// import { Component } from "../Engine"
// import { Vector2 } from "../Math"

// export default class RenderEngine
// {

//     public static init(canvas: HTMLCanvasElement, width: number, height: number)
//     {
//         let renderer = new RenderEngine(canvas)

//         renderer.resize(width, height)
//         return renderer
//     }

//     public context: CanvasRenderingContext2D

//     public get width(): number { return this.canvas.width }
//     public get height(): number { return this.canvas.height }

//     private constructor(private readonly canvas: HTMLCanvasElement)
//     {
//         let ratio = window.devicePixelRatio

//         this.context = canvas.getContext("2d")!
//         Object.defineProperty(this.context, "strokeWidth",
//         {
//             set: value => this.context.lineWidth = value * ratio * this.camera.size / this.height
//         })
//     }


//     public camera!: Camera
//     public attachCamera(camera: Camera) { this.camera = camera }

//     public resize(width: number, height: number)
//     {
//         let ratio = window.devicePixelRatio

//         this.canvas.width = width * ratio
//         this.canvas.height = height * ratio
//     }

//     public render()
//     {
//         let c = this.context
//         c.restore()
//         c.save()
//         c.clearRect(0, 0, this.width, this.height)

//         // Center origin
//         c.translate(this.width / 2, this.height / 2)

//         // Apply transformations
//         let position = this.camera.entity.position.neg()
//         let scale = this.height / this.camera.size

//         c.scale(scale, -scale)
//         c.rotate(-this.camera.entity.rotation)
//         c.translate(position.x, position.y)
//     }

//     public toWorldSpace(screen: Vector2): Vector2
//     {
//         // let clip = new Vector2(screen.x / this.width, screen.y / this.height).mul(2).sub(Vector2.ONE)
//         // Matrix2.rotate(this.camera.entity.rotation).vmul(new Vector2(clip.x, -clip.y))
//         // return this.camera.view.inverse().vmul(new Vector2(clip.x, -clip.y).cast())
//         let camera = this.camera
//         let dimensions = new Vector2(this.width / 2, this.height / 2)
//         let world = screen.sub(dimensions).div(this.height / camera.size)

//         return new Vector2(world.x, -world.y).sub(camera.entity.position)
//     }

//     // public toScreenSpace(world: Vector3): Vector2
//     // {
//     //     let clip = this.camera.view.wmul(world).cast().add(Vector2.ONE).div(2)
//     //     return new Vector2(clip.x * this.width, (1 - clip.y) * this.height)
//     // }

// }

// /*
// export default class RenderEngine
// {

//     public static async init(canvas: HTMLCanvasElement, width: number, height: number)
//     {
//         let device = await Device.init(canvas)
//         let renderer = new RenderEngine(device, canvas)

//         renderer.resize(width, height)
//         return renderer
//     }

//     public get width(): number { return this.canvas.width }
//     public get height(): number { return this.canvas.height }

//     private constructor(public readonly device: Device, private readonly canvas: HTMLCanvasElement) { }

//     public camera!: Camera
//     public attachCamera(camera: Camera)
//     {
//         this.camera = camera
//         camera.resize(this.width / this.height)
//     }

//     public resize(width: number, height: number)
//     {
//         let ratio = window.devicePixelRatio

//         this.canvas.width = width * ratio
//         this.canvas.height = height * ratio

//         if (this.camera) this.camera.resize(width / height)
//     }


//     private readonly passes: Map<Texture, [RenderPass, number][]> = new Map()
//     public encode(texture: Texture, pass: RenderPass, length: number)
//     {
//         let pipeline = this.passes.get(texture)
//         if (!pipeline) this.passes.set(texture, pipeline = [])

//         pipeline.push([pass, length])
//     }

//     public render()
//     {
//         // TODO: Depth texture
//         for (let [texture, passes] of this.passes)
//         {
//             this.device.beginPass(texture)
//             for (let [pass, length] of passes) pass.render(length)
    
//             this.device.endPass()
//         }

//         // TODO: Post-processing system
//         this.device.submit()
//         this.passes.clear()
//     }

//     // TODO: Compute shaders
//     // TODO: Line rendering

// }
// */

// export class Camera extends Component
// {

//     public constructor(public size: number = 20) { super() }

//     public override init() { this.scene.renderer.attachCamera(this) } // Attach to renderer

// }

// // export class MeshRenderer extends Component
// // {

// //     private uniforms: Map<string, Resource> = new Map()
// //     private pass!: RenderPass

// //     private _mesh: Mesh
// //     private _material: Material

// //     public get mesh(): Mesh { return this._mesh }
// //     public set mesh(mesh: Mesh)
// //     {
// //         this._mesh = mesh
// //         this.refresh()
// //     }

// //     public get material(): Material { return this._material }
// //     public set material(material: Material)
// //     {
// //         this._material = material
// //         this.refresh()
// //     }


// //     public constructor(mesh: Mesh, material: Material)
// //     {
// //         super()

// //         this._mesh = mesh
// //         this._material = material
// //     }

// //     public override init(): void
// //     {
// //         let device = this.scene.renderer.device

// //         // Initialize system uniforms
// //         this.setUniform("view",      new Buffer(device, BufferFormat.F32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))
// //         this.setUniform("transform", new Buffer(device, BufferFormat.F32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))
// //         this.setUniform("normal",    new Buffer(device, BufferFormat.F32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16))

// //         this.refresh()
// //     }

// //     public override destroy() { for (let [_, resource] of this.uniforms) resource.destroy() }
// //     private refresh()
// //     {
// //         let bindings = this.material.uniforms.map(group => group.map(name => this.getUniform(name)!))
// //         let vertices = this.material.buffers.map(name => this.mesh.getAttribute(name)!)

// //         let index = this.mesh.getAttribute(INDEX_ID) ?? undefined
// //         this.pass = new RenderPass(this.material.pipeline, bindings, vertices, index)
// //     }


// //     public getUniform<T extends Resource>(name: string): T | null { return this.uniforms.get(name) as T ?? null }
// //     public setUniform(name: string, resource: Resource)
// //     {
// //         let previous = this.getUniform(name)
// //         this.uniforms.set(name, resource)

// //         if (previous !== null)
// //         {
// //             previous.destroy()
// //             this.refresh()
// //         }
// //     }

// //     public override render() // TODO: PRIORITY: Option to change render target (not specifying should use canvas)
// //     {
// //         let renderer = this.scene.renderer

// //         // this.getUniform<Buffer>("view")!.write([renderer.camera.view])
// //         // this.getUniform<Buffer>("transform")!.write([this.entity.transform])
// //         // this.getUniform<Buffer>("normal")!.write([this.entity.normal])

// //         let length = this.mesh.indices?.length ?? this.mesh.vertices.length
// //         renderer.encode(renderer.device.texture, this.pass, length)
// //     }

// // }

// // const VERTEX_ID: string = "position"
// // const INDEX_ID: string = ":index" // Identifier not usable by WGSL

// // type Data = number | Vector2 | Vector3 | Color4 | Matrix2 | Matrix4
// // export class Mesh
// // {

// //     private readonly attributes: Map<string, Buffer> = new Map()

// //     public vertices!: Vector3[]
// //     public indices: number[] | null = null

// //     public get vertex(): Buffer { return this.getAttribute(VERTEX_ID)! }
// //     public set vertex(vertices: Vector3[])
// //     {
// //         this.vertices = vertices
// //         this.write(VERTEX_ID, vertices)
// //     }

// //     public get index(): Buffer | null { return this.getAttribute(INDEX_ID) }
// //     public set index(indices: number[])
// //     {
// //         this.indices = indices
// //         this.write(INDEX_ID, indices)
// //     }


// //     public constructor(renderer: RenderEngine, vertices: Vector3[], indices?: number[])
// //     {
// //         this.setAttribute(VERTEX_ID, new Buffer(renderer.device, BufferFormat.F32, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 3 * vertices.length))
// //         this.vertex = vertices

// //         if (indices)
// //         {
// //             this.setAttribute(INDEX_ID, new Buffer(renderer.device, BufferFormat.U32, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, indices.length))
// //             this.index = indices
// //         }
// //     }

// //     public destroy() { for (let [_, buffer] of this.attributes) buffer.destroy() }

// //     public getAttribute(name: string): Buffer | null { return this.attributes.get(name) ?? null }
// //     public setAttribute(name: string, buffer: Buffer)
// //     {
// //         this.getAttribute(name)?.destroy()
// //         this.attributes.set(name, buffer)
// //     }

// //     public write(name: string, data: Data[])
// //     {
// //         let buffer = this.getAttribute(name)
// //         buffer?.write(data)
// //     }

// // }

// // export class Material
// // {

// //     public readonly pipeline: RenderPipeline

// //     public readonly buffers: string[] = []
// //     public readonly uniforms: string[][] = []

// //     public constructor(renderer: RenderEngine, code: string, params: RenderPipelineParams = {})
// //     {
// //         let device = renderer.device
// //         let shader = new Shader(device, code)

// //         let vertices = this.getVertexLayout(code).map(format => ({ format }))
// //         this.pipeline = new RenderPipeline(device, shader, device.format, vertices, params)

// //         this.getUniforms(code)
// //     }


// //     private getVertexLayout(code: string): VertexFormat[] // Please forgive me
// //     {
// //         let input = code.match(/struct\s+VertexInput\s*{[^]*?}/)?.[0]
// //         if (!input) throw new Error("No 'VertexInput' struct defined in shader")

// //         let layout: VertexFormat[] = []
// //         for (let [_, index, name, type] of input.matchAll(/@\s*location\s*\(\s*(\d+)\s*\)\s*(\w+)\s*:\s*([^,}]+)/g))
// //         {
// //             let i = +index

// //             this.buffers[i] = name
// //             layout[i] = this.getFormat(type.replaceAll(/\s/g, ""))
// //         }

// //         return layout
// //     }

// //     private getUniforms(code: string)
// //     {
// //         let results = code.matchAll(/@\s*group\s*\(\s*(\d+)\s*\)\s*@\s*binding\s*\(\s*(\d+)\s*\)\s*[^]*?(\w+)\s*:/g)
// //         for (let [_, group, binding, name] of results)
// //         {
// //             let i = +group, j = +binding

// //             if (!this.uniforms[i]) this.uniforms[i] = []
// //             this.uniforms[i][j] = name
// //         }
// //     }

// //     private getFormat(type: string): VertexFormat
// //     {
// //         switch (type)
// //         {
// //             case "i32": return VertexFormat.I32
// //             case "u32": return VertexFormat.U32
// //             case "f32": return VertexFormat.F32

// //             case "vec2i": case "vec2<i32>": return VertexFormat.I32_2
// //             case "vec2u": case "vec2<u32>": return VertexFormat.U32_2
// //             case "vec2f": case "vec2<f32>": return VertexFormat.F32_2

// //             case "vec3i": case "vec3<i32>": return VertexFormat.I32_3
// //             case "vec3u": case "vec3<u32>": return VertexFormat.U32_3
// //             case "vec3f": case "vec3<f32>": return VertexFormat.F32_3

// //             case "vec4i": case "vec4<i32>": return VertexFormat.I32_4
// //             case "vec4u": case "vec4<u32>": return VertexFormat.U32_4
// //             case "vec4f": case "vec4<f32>": return VertexFormat.F32_4
// //         }

// //         throw new Error(`Invalid vertex buffer type: '${type}'`)
// //     }

// // }
