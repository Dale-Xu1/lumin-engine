import { Component } from "../Engine"
import { Color4, Matrix2, Matrix4, Vector2, Vector3 } from "../Math"
import Device, { RenderPass, RenderPipeline, Shader, VertexFormat } from "./Device"
import { Buffer, BufferFormat } from "./Resource"

import test from "./shaders/Test.wgsl?raw"

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

    private constructor(public readonly device: Device, private readonly canvas: HTMLCanvasElement)
    {
        let material = new Material(this, test)
        let mesh = new Mesh(this,
        [
            new Vector3(-1, -1, 0),
            new Vector3( 1, -1, 0),
            new Vector3( 1,  1, 0),
            new Vector3(-1,  1, 0)
        ], [0, 1, 2, 0, 2, 3])

        this.pipeline = material.pipeline

        this.view = new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16)
        this.pass = new RenderPass(this.pipeline, [[this.view]], [mesh.vertex], mesh.index!)
    }

    private camera!: Camera
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


    private pipeline: RenderPipeline
    private pass: RenderPass
    private view: Buffer

    // TODO: Draw call to render pass conversion
    public render()
    {
        this.view.write(Buffer.flatten(BufferFormat.F32, [this.camera.view]))

        this.pipeline.start(this.device.texture)
        this.pass.render(6)
        this.pipeline.end()

        this.device.submit()
    }

    // TODO: Reimplement coordinate conversions
    // public toWorldSpace(screen: Vector2): Vector2
    // public toScreenSpace(world: Vector2): Vector2

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

    public uniforms!: BufferMap
    private pass!: RenderPass

    public constructor(public mesh: Mesh, public material: Material) { super() }
    public override init(): void
    {
        this.uniforms = new BufferMap(this.scene.renderer)
        // this.pass = new RenderPass(this.material.pipeline, )

        // TODO: Create render pass from material and mesh
        // TODO: Recreate pass when mesh or uniform map destroys buffer
    }

    public override destroy() { this.uniforms.destroy() }


    public override render()
    {

    }

}

const VERTEX_ID: string = "position"
const INDEX_ID: string = ":index" // Identifier not usable by WGSL

export class Mesh
{

    private readonly attributes: BufferMap

    public vertices!: Vector3[]
    public get vertex(): Buffer { return this.getAttribute(VERTEX_ID)! }
    public set vertex(vertices: Vector3[])
    {
        this.vertices = vertices
        this.setAttribute(VERTEX_ID, Buffer.flatten(BufferFormat.F32, vertices))
    }

    public indices: number[] | null = null
    public get index(): Buffer | null { return this.getAttribute(INDEX_ID) }
    public set index(indices: number[])
    {
        this.indices = indices
        this.setAttribute(INDEX_ID, new Uint32Array(indices), GPUBufferUsage.INDEX)
    }


    public constructor(renderer: RenderEngine, vertices: Vector3[], indices?: number[])
    {
        this.attributes = new BufferMap(renderer)

        this.vertex = vertices
        if (indices) this.index = indices
    }

    public destroy() { this.attributes.destroy() }

    public getAttribute(name: string): Buffer | null { return this.attributes.getBuffer(name) }
    public setAttribute(name: string, data: BufferData, flags: GPUBufferUsageFlags = GPUBufferUsage.VERTEX)
    {
        this.attributes.setBuffer(name, flags, data)
    }

}

type BufferData = Int32Array | Uint32Array | Float32Array
class BufferMap extends Map<string, Buffer>
{

    public constructor(private readonly renderer: RenderEngine) { super() }

    public destroy() { for (let [_, buffer] of this) buffer.destroy() }

    public getBuffer(name: string): Buffer | null { return this.get(name) ?? null }
    public setBuffer(name: string, flags: GPUBufferUsageFlags, data: BufferData)
    {
        let buffer = this.getBuffer(name)
        if (buffer === null || data.length !== buffer.length)
        {
            buffer?.destroy()
            buffer = new Buffer(this.renderer.device, flags | GPUBufferUsage.COPY_DST, data.length)

            this.set(name, buffer)
        }

        buffer.write(data)
    }

}

export class Material
{

    public readonly pipeline: RenderPipeline

    public readonly buffers: string[] = []
    public readonly uniforms: string[][] = []

    public constructor(renderer: RenderEngine, code: string)
    {
        let device = renderer.device

        let shader = new Shader(device, code)
        this.pipeline = new RenderPipeline(device, shader, device.texture.format,
            this.getVertexLayout(code).map(format => ({ format })))

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
