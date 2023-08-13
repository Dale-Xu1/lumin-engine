import { Component } from "../Engine"
import { Matrix4, Vector2, Vector3 } from "../Math"
import Device, { RenderPass, RenderPipeline, Shader, VertexFormat, type RenderPipelineParams } from "./Device"
import type Resource from "./Resource"
import { Buffer, BufferFormat, type BufferData } from "./Resource"

export default class RenderEngine
{

    public static async init(canvas: HTMLCanvasElement, width: number, height: number)
    {
        let device = await Device.init(canvas)
        let renderer = new RenderEngine(device, canvas)

        renderer.resize(width, height)
        return renderer
    }

    public get width(): number { return this.canvas.width }
    public get height(): number { return this.canvas.height }

    private constructor(public readonly device: Device, private readonly canvas: HTMLCanvasElement) { }

    public camera!: Camera
    public attachCamera(camera: Camera)
    {
        this.camera = camera
        camera.resize(this.width / this.height)
    }

    public resize(width: number, height: number)
    {
        let ratio = window.devicePixelRatio

        this.canvas.width = width * ratio
        this.canvas.height = height * ratio

        if (this.camera) this.camera.resize(width / height)
    }


    private readonly passes: Map<Material, [RenderPass, number][]> = new Map()
    public encode(material: Material, pass: RenderPass, length: number)
    {
        let pipeline = this.passes.get(material)
        if (!pipeline) this.passes.set(material, pipeline = [])

        pipeline.push([pass, length])
    }

    public render()
    {
        let texture = this.device.texture
        for (let [material, passes] of this.passes)
        {
            material.pipeline.start(texture)
            for (let [pass, length] of passes) pass.render(length)

            material.pipeline.end()
        }

        this.device.submit()
        this.passes.clear()
    }

    // TODO: Reimplement coordinate conversions
    // TODO: Compute shaders
    // TODO: Line rendering

    // public toWorldSpace(screen: Vector2): Vector2
    // public toScreenSpace(world: Vector3): Vector2
    // {
    //     let clip = this.camera.view.wmul(world).cast()
    //     return new Vector2(clip.x, -clip.y)
    // }

}

export class Camera extends Component
{

    private projection!: Matrix4
    public get view(): Matrix4 { return this.projection.mul(this.entity.transform.inverse()) }

    private _size: number
    private _depth: [number, number]

    public get size(): number { return this._size }
    public set size(size: number)
    {
        this._size = size
        this.resize(this.aspect)
    }

    public get depth(): [number, number] { return this._depth }
    public set depth(depth: [number, number])
    {
        this._depth = depth
        this.resize(this.aspect)
    }

    public constructor(size: number = 20, depth: [number, number] = [0, 50])
    {
        super()

        this._size = size
        this._depth = depth
    }


    public override init() { this.scene.renderer.attachCamera(this) } // Attach to renderer

    private aspect!: number
    public resize(aspect: number)
    {
        this.aspect = aspect
        this.projection = Matrix4.orthographic(this.size * aspect, this.size, this.depth)
    }

}

export class MeshRenderer extends Component
{

    private uniforms: Map<string, Resource> = new Map()
    private pass!: RenderPass

    private _mesh: Mesh
    private _material: Material

    public get mesh(): Mesh { return this._mesh }
    public set mesh(mesh: Mesh)
    {
        this._mesh = mesh
        this.refresh()
    }

    public get material(): Material { return this._material }
    public set material(material: Material)
    {
        this._material = material
        this.refresh()
    }


    public constructor(mesh: Mesh, material: Material)
    {
        super()

        this._mesh = mesh
        this._material = material
    }

    public override init(): void
    {
        let device = this.scene.renderer.device

        // Initialize system uniforms
        this.setUniform("view",      new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))
        this.setUniform("transform", new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))
        this.setUniform("normal",    new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))

        this.refresh()
    }

    public override destroy() { for (let [_, resource] of this.uniforms) resource.destroy() }
    private refresh()
    {
        let bindings = this.material.uniforms.map(group => group.map(name => this.getUniform(name)!))
        let vertices = this.material.buffers.map(name => this.mesh.getAttribute(name)!)

        let index = this.mesh.getAttribute(INDEX_ID) ?? undefined
        this.pass = new RenderPass(this.material.pipeline, bindings, vertices, index)
    }


    public getUniform<T extends Resource>(name: string): T | null { return this.uniforms.get(name) as T ?? null }
    public setUniform(name: string, resource: Resource)
    {
        let previous = this.getUniform(name)
        this.uniforms.set(name, resource)

        if (previous !== null)
        {
            previous.destroy()
            this.refresh()
        }
    }

    public override render()
    {
        let renderer = this.scene.renderer

        this.getUniform<Buffer>("view")!.write(Buffer.flatten(BufferFormat.F32, [renderer.camera.view]))
        this.getUniform<Buffer>("transform")!.write(Buffer.flatten(BufferFormat.F32, [this.entity.transform]))
        this.getUniform<Buffer>("normal")!.write(Buffer.flatten(BufferFormat.F32, [this.entity.normal]))

        let length = this.mesh.indices?.length ?? this.mesh.vertices.length
        renderer.encode(this.material, this.pass, length)
    }

}

const VERTEX_ID: string = "position"
const INDEX_ID: string = ":index" // Identifier not usable by WGSL

export class Mesh
{

    private readonly attributes: Map<string, Buffer> = new Map()

    public vertices!: Vector3[]
    public indices: number[] | null = null

    public get vertex(): Buffer { return this.getAttribute(VERTEX_ID)! }
    public set vertex(vertices: Vector3[])
    {
        this.vertices = vertices
        this.setAttribute(VERTEX_ID, Buffer.flatten(BufferFormat.F32, vertices))
    }

    public get index(): Buffer | null { return this.getAttribute(INDEX_ID) }
    public set index(indices: number[])
    {
        this.indices = indices
        this.setBuffer(INDEX_ID, new Uint32Array(indices), GPUBufferUsage.INDEX)
    }


    public constructor(private readonly renderer: RenderEngine, vertices: Vector3[], indices?: number[])
    {
        this.vertex = vertices
        if (indices) this.index = indices
    }

    public destroy() { for (let [_, buffer] of this.attributes) buffer.destroy() }

    public getAttribute(name: string): Buffer | null { return this.attributes.get(name) ?? null }
    public setAttribute(name: string, data: BufferData, flags: GPUBufferUsageFlags = 0)
    {
        this.setBuffer(name, data, flags | GPUBufferUsage.VERTEX)
    }

    private setBuffer(name: string, data: BufferData, flags: GPUBufferUsageFlags)
    {
        let buffer = this.getAttribute(name)
        if (buffer === null)
        {
            buffer = new Buffer(this.renderer.device, flags | GPUBufferUsage.COPY_DST, data.length)
            this.attributes.set(name, buffer)
        }

        buffer.write(data)
    }

}

export class Material
{

    public readonly pipeline: RenderPipeline

    public readonly buffers: string[] = []
    public readonly uniforms: string[][] = []

    public constructor(renderer: RenderEngine, code: string, params: RenderPipelineParams = {})
    {
        let device = renderer.device
        let shader = new Shader(device, code)

        let vertices = this.getVertexLayout(code).map(format => ({ format }))
        this.pipeline = new RenderPipeline(device, shader, device.texture.format, vertices, params)

        this.getUniforms(code)
    }


    private getVertexLayout(code: string): VertexFormat[] // Please forgive me
    {
        let input = code.match(/struct\s+VertexInput\s*{[^]*?}/)?.[0]
        if (!input) throw new Error("No 'VertexInput' struct defined in shader")

        let layout: VertexFormat[] = []
        for (let [_, index, name, type] of input.matchAll(/@\s*location\s*\(\s*(\d+)\s*\)\s*(\w+)\s*:\s*([^,}]+)/g))
        {
            let i = +index

            this.buffers[i] = name
            layout[i] = this.getFormat(type.replaceAll(/\s/g, ""))
        }

        return layout
    }

    private getUniforms(code: string)
    {
        let results = code.matchAll(/@\s*group\s*\(\s*(\d+)\s*\)\s*@\s*binding\s*\(\s*(\d+)\s*\)\s*[^]*?(\w+)\s*:/g)
        for (let [_, group, binding, name] of results)
        {
            let i = +group, j = +binding

            if (!this.uniforms[i]) this.uniforms[i] = []
            this.uniforms[i][j] = name
        }
    }

    private getFormat(type: string): VertexFormat
    {
        switch (type)
        {
            case "i32": return VertexFormat.I32
            case "u32": return VertexFormat.U32
            case "f32": return VertexFormat.F32

            case "vec2i": case "vec2<i32>": return VertexFormat.I32_2
            case "vec2u": case "vec2<u32>": return VertexFormat.U32_2
            case "vec2f": case "vec2<f32>": return VertexFormat.F32_2

            case "vec3i": case "vec3<i32>": return VertexFormat.I32_3
            case "vec3u": case "vec3<u32>": return VertexFormat.U32_3
            case "vec3f": case "vec3<f32>": return VertexFormat.F32_3

            case "vec4i": case "vec4<i32>": return VertexFormat.I32_4
            case "vec4u": case "vec4<u32>": return VertexFormat.U32_4
            case "vec4f": case "vec4<f32>": return VertexFormat.F32_4
        }

        throw new Error(`Invalid vertex buffer type: '${type}'`)
    }

}
