import { Component } from "../Engine"
import { Matrix4, Quaternion, Vector3 } from "../Math"
import Device, { RenderPass, RenderPipeline, Shader, VertexFormat } from "./Device"
import { Buffer } from "./Resource"

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

    protected constructor(private readonly device: Device, private readonly canvas: HTMLCanvasElement)
    {
        this.pipeline = new RenderPipeline(device, new Shader(device, test), device.texture.format,
            [{ format: VertexFormat.F32_3 }])

        this.view = new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 16)

        let vertices = new Buffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 12)
        vertices.write(new Float32Array(
        [
            [-1, -1, 0],
            [ 1, -1, 0],
            [ 1,  1, 0],
            [-1,  1, 0]
        ].flat()))

        let indices = new Buffer(device, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, 6)
        indices.write(new Uint32Array(
        [
            0, 1, 2,
            0, 2, 3
        ]))

        this.pass = new RenderPass(this.pipeline, [[this.view]], [vertices], indices)
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

        let m = Matrix4.perspective(Math.PI / 3, width / height, [1, 10])
        // let m = Matrix4.orthographic(3 * width / height, 3, [0, 10])
            .mul(Matrix4.translate(new Vector3(0, 0, -5)).inverse())
            .mul(Matrix4.rotate(Quaternion.rotate(1, Vector3.UP)))
        this.view.write(new Float32Array(
        [
            m.m00, m.m10, m.m20, m.m30,
            m.m01, m.m11, m.m21, m.m31,
            m.m02, m.m12, m.m22, m.m32,
            m.m03, m.m13, m.m23, m.m33
        ]))
    }


    private pipeline: RenderPipeline
    private pass: RenderPass
    private view: Buffer

    // TODO: Draw call to render pass conversion
    public render()
    {
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

    public size: number

    public constructor(size: number = 20)
    {
        super()
        this.size = size
    }


    public override init() { this.scene.renderer.attachCamera(this) } // Attach to renderer
    public resize(aspect: number)
    {

    }

}

export class Mesh
{

}

export class Material
{

}
