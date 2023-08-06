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


    public flush()
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

abstract class Pipeline<T extends GPUPipelineBase>
{

    protected readonly device: Device
    private readonly bindings: [number, GPUBindGroup][] = []

    protected constructor(device: Device, public readonly pipeline: T) { this.device = device }


    public bind(group: number, bindings: [number, Resource][])
    {
        let device = this.device.device
        this.bindings.push([group, device.createBindGroup(
        {
            layout: this.pipeline.getBindGroupLayout(group),
            entries: bindings.map(([binding, resource]) => ({ binding, resource: resource.getBinding() }))
        })])
    }

    protected setBindings(pass: GPUBindingCommandsMixin)
    {
        for (let [binding, group] of this.bindings) pass.setBindGroup(binding, group)
    }

}

export const enum StepMode { VERTEX = "vertex", INSTANCE = "instance" }
export const enum VertexFormat
{
    I32 = "sint32",  I32_2 = "sint32x2",  I32_3 = "sint32x3",  I32_4 = "sint32x4",
    U32 = "uint32",  U32_2 = "uint32x2",  U32_3 = "uint32x3",  U32_4 = "uint32x4",
    F32 = "float32", F32_2 = "float32x2", F32_3 = "float32x2", F32_4 = "float32x2"
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


    private readonly buffers: [number, Buffer][] = []

    public constructor(device: Device, shader: Shader, vertex: string, fragment: string,
        format: TextureFormat, buffers: [number, Buffer, VertexFormat, StepMode?][])
    {
        let entries = buffers.map(([location, _, format, step = StepMode.VERTEX]) =>
        ({
            arrayStride: RenderPipeline.getBytes(format),
            stepMode: step,
            attributes:
            [{
                format, offset: 0,
                shaderLocation: location
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
            }
        }))

        this.buffers = buffers.map(buffer => buffer.slice(0, 2) as [number, Buffer])
    }

    public render(texture: Texture, vertices: number, instances?: number)
    {
        let pass = this.device.encoder.beginRenderPass(
        {
            colorAttachments:
            [{
                view: texture.view,
                loadOp: "clear", storeOp: "store"
            }]
        })

        pass.setPipeline(this.pipeline)
        this.setBindings(pass)
        for (let [location, buffer] of this.buffers) pass.setVertexBuffer(location, buffer.buffer)

        pass.draw(vertices, instances)
        pass.end()
    }

}

export class ComputePipeline extends Pipeline<GPUComputePipeline>
{

    public constructor(device: Device, shader: Shader, entry: string)
    {
        super(device, device.device.createComputePipeline(
        {
            layout: "auto",
            compute: { module: shader.module, entryPoint: entry }
        }))
    }

    public dispatch(x: number, y: number = 1, z: number = 1)
    {
        let pass = this.device.encoder.beginComputePass()

        pass.setPipeline(this.pipeline)
        this.setBindings(pass)

        pass.dispatchWorkgroups(x, y, z)
        pass.end()
    }

}
