import type Resource from "./Resource"
import { Buffer, Texture, TextureFormat } from "./Resource"

export default class Device
{

    public static async init(canvas: HTMLCanvasElement): Promise<Device>
    {
        let adapter = await window.navigator.gpu.requestAdapter()
        if (adapter === null) throw new Error("No GPU adapter found")

        let device = await adapter.requestDevice()

        let context = canvas.getContext("webgpu")
        if (context === null) throw new Error("HTML canvas does not support WebGPU")

        let format = window.navigator.gpu.getPreferredCanvasFormat()
        context.configure({ device: device, format })

        return new Device(device, context)
    }

    public encoder!: GPUCommandEncoder
    public get texture(): Texture { return new Texture(this, this.context.getCurrentTexture()) }

    private constructor(public readonly device: GPUDevice, private readonly context: GPUCanvasContext)
    {
        this.encoder = this.device.createCommandEncoder()
    }


    public submit()
    {
        this.device.queue.submit([this.encoder.finish()])
        this.encoder = this.device.createCommandEncoder()
    }

    public copyBuffer(source: Buffer, destination: Buffer,
        sourceOffset: number = 0, destinationOffset: number = 0, length?: number)
    {
        length ??= source.length
        this.encoder.copyBufferToBuffer(
            source.buffer, sourceOffset, destination.buffer, destinationOffset, 4 * length)
    }

    public copyTexture(source: Texture, destination: Texture, size?: number[])
    {
        size ??= source.size
        this.encoder.copyTextureToTexture({ texture: source.texture }, { texture: destination.texture }, size)
    }

}

export class Shader
{

    public readonly module: GPUShaderModule

    public constructor({ device }: Device, code: string) { this.module = device.createShaderModule({ code }) }

}

interface PassEncoder { end(): void }
abstract class Pipeline<T extends GPUPipelineBase>
{

    protected readonly device: Device
    private groups: GPUBindGroup[] = []

    protected constructor(device: Device, public readonly pipeline: T) { this.device = device }


    public bind(group: number, bindings: Resource[])
    {
        let device = this.device.device
        this.groups[group] = device.createBindGroup(
        {
            layout: this.pipeline.getBindGroupLayout(group),
            entries: bindings.map((resource, i) => ({ binding: i, resource: resource.getBinding() }))
        })
    }

    protected setBindings(pass: GPUBindingCommandsMixin)
    {
        for (let i = 0; i < this.groups.length; i++)
        {
            let group = this.groups[i]
            pass.setBindGroup(i, group)
        }
    }

    public abstract start(...args: any[]): PassEncoder

}

export const enum StepMode { VERTEX = "vertex", INSTANCE = "instance" }
export const enum VertexFormat
{
    I32 = "sint32",  I32_2 = "sint32x2",  I32_3 = "sint32x3",  I32_4 = "sint32x4",
    U32 = "uint32",  U32_2 = "uint32x2",  U32_3 = "uint32x3",  U32_4 = "uint32x4",
    F32 = "float32", F32_2 = "float32x2", F32_3 = "float32x3", F32_4 = "float32x4"
}

export const enum LoadOperation { CLEAR = "clear", LOAD = "load" }
export interface VertexFormatParams
{

    format: VertexFormat
    step?: StepMode

}

export const enum PrimitiveTopology { POINT = "point-list", LINE = "line-list", TRIANGLE = "triangle-list" }
export const enum CullMode { NONE = "none", FRONT = "front", BACK = "back" }

export interface RenderPipelineParams
{

    vertex?: string
    fragment?: string

    primitive?: PrimitiveTopology
    cull?: CullMode
    depth?: TextureFormat

}

export interface RenderEncoderParams
{

    load?: LoadOperation

    depth?: Texture
    depthLoad?: LoadOperation

}

export class RenderPipeline extends Pipeline<GPURenderPipeline>
{

    private static getBytes(format: VertexFormat): number
    {
        switch (format)
        {
            case VertexFormat.I32:   case VertexFormat.U32:   case VertexFormat.F32:   return 4
            case VertexFormat.I32_2: case VertexFormat.U32_2: case VertexFormat.F32_2: return 8
            case VertexFormat.I32_3: case VertexFormat.U32_3: case VertexFormat.F32_3: return 12
            case VertexFormat.I32_4: case VertexFormat.U32_4: case VertexFormat.F32_4: return 16
        }
    }


    public constructor(device: Device, shader: Shader, format: TextureFormat, vertices: VertexFormatParams[],
    {
        vertex = "vs", fragment = "fs",
        primitive = PrimitiveTopology.TRIANGLE,
        cull = CullMode.BACK,
        depth
    }: RenderPipelineParams = {})
    {
        let entries = vertices.map(({ format, step = StepMode.VERTEX }, i) =>
        ({
            arrayStride: RenderPipeline.getBytes(format),
            stepMode: step,
            attributes:
            [{
                format, offset: 0,
                shaderLocation: i 
            }]
        }))
        super(device, device.device.createRenderPipeline(
        {
            layout: "auto",
            vertex:
            {
                module: shader.module,
                entryPoint: vertex,
                buffers: entries
            },
            fragment:
            {
                module: shader.module,
                entryPoint: fragment,
                targets: [{ format }]
            },
            primitive:
            {
                topology: primitive,
                cullMode: cull
            },
            depthStencil: depth ?
            {
                format: depth,
                depthWriteEnabled: true,
                depthCompare: "less"
            } : undefined
        }))
    }

    public override start(texture: Texture,
    {
        load = LoadOperation.CLEAR,
        depth, depthLoad = LoadOperation.CLEAR
    }: RenderEncoderParams = {}): RenderPassEncoder
    {
        let encoder = this.device.encoder.beginRenderPass(
        {
            colorAttachments:
            [{
                view: texture.view,
                loadOp: load, storeOp: "store"
            }],
            depthStencilAttachment: depth ?
            {
                view: depth.view,
                depthClearValue: 1,
                depthLoadOp: depthLoad, depthStoreOp: "store"
            } : undefined
        })

        encoder.setPipeline(this.pipeline)
        this.setBindings(encoder)    

        return new RenderPassEncoder(encoder)
    }

}

export interface RenderParams
{

    index?: Buffer
    instances?: number

}

export class RenderPassEncoder implements PassEncoder
{

    public constructor(public readonly encoder: GPURenderPassEncoder) { }

    public render(count: number, vertices: Buffer[], { index, instances }: RenderParams = {})
    {
        for (let i = 0; i < vertices.length; i++)
        {
            let buffer = vertices[i].buffer
            this.encoder.setVertexBuffer(i, buffer)
        }

        if (index)
        {
            this.encoder.setIndexBuffer(index.buffer, "uint32")
            this.encoder.drawIndexed(count, instances)
        }
        else this.encoder.draw(count, instances)
    }

    public end() { this.encoder.end() }

}

export class ComputePipeline extends Pipeline<GPUComputePipeline>
{

    public constructor(device: Device, shader: Shader, entry: string = "main")
    {
        super(device, device.device.createComputePipeline(
        {
            layout: "auto",
            compute: { module: shader.module, entryPoint: entry }
        }))
    }

    public override start(): ComputePassEncoder
    {
        let encoder = this.device.encoder.beginComputePass()

        encoder.setPipeline(this.pipeline)
        this.setBindings(encoder) 

        return new ComputePassEncoder(encoder)
    }

}

export class ComputePassEncoder implements PassEncoder
{

    public constructor(public readonly encoder: GPUComputePassEncoder) { }

    public dispatch(x: number, y: number = 1, z: number = 1) { this.encoder.dispatchWorkgroups(x, y, z) }
    public end() { this.encoder.end() }    

}
