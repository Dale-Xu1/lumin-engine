import Device, { ComputePass, ComputePipeline, LoadOperation, RenderPass, RenderPipeline, Shader, VertexFormat } from "./Device"
import { Buffer, Sampler, Texture, TextureFormat } from "./Resource"

import renderCode from "./shaders/render.wgsl?raw"
import quadCode from "./shaders/quad.wgsl?raw"
import computeCode from "./shaders/compute.wgsl?raw"
import testCode from "./shaders/test.wgsl?raw"

// TODO: Entity parenting
// TODO: Quaternions for entity rotation
// TODO: Multisampling

export default class RenderEngine
{

    public constructor(canvas: HTMLCanvasElement)
    {
        this.init(canvas)
    }

    private async init(canvas: HTMLCanvasElement)
    {
        let device = await Device.init(canvas)

        let vertices = new Buffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 12)
        vertices.write(new Float32Array(
        [
            [-1, -1, 0], [1, -1, 0], [ 1, 1, 0], [-1, 1, 0]
        ].flat()))

        let indices = new Buffer(device, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, 6)
        indices.write(new Uint32Array(
        [
            0, 1, 2,
            0, 2, 3
        ]))

        let uvs = new Buffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 8)
        uvs.write(new Float32Array(
        [
            [0, 0], [1, 0], [1, 1], [0, 1]
        ].flat()))

        const SCALE = 5
        const GRID_WIDTH = Math.floor(window.innerWidth / SCALE), GRID_HEIGHT = Math.floor(window.innerHeight / SCALE)

        let gridSize = new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 2)
        gridSize.write(new Uint32Array([GRID_WIDTH, GRID_HEIGHT]))

        let length = GRID_WIDTH * GRID_HEIGHT
        let state = new Texture(device, TextureFormat.R_U32, GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            [GRID_WIDTH, GRID_HEIGHT])
        let temp = new Texture(device, TextureFormat.R_U32, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
            [GRID_WIDTH, GRID_HEIGHT])

        let stateData = new Uint32Array(length)
        for (let i = 0; i < stateData.length; i++) stateData[i] = Math.random() > 0.6 ? 1 : 0
        state.write(stateData)

        let texture = new Texture(device, TextureFormat.RGBA_UNORM,
            GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, [canvas.width, canvas.height])
        let sampler = new Sampler(device)

        let depth = new Texture(device, TextureFormat.DEPTH24, GPUTextureUsage.RENDER_ATTACHMENT,
            [canvas.width, canvas.height])

        let render = new RenderPipeline(device, new Shader(device, renderCode),
            texture.format, [{ format: VertexFormat.F32_3 }], { depth: depth.format })
        let renderPass = new RenderPass(render, [[gridSize, state]], [vertices], indices)

        let quad = new RenderPipeline(device, new Shader(device, quadCode), device.texture.format,
            [{ format: VertexFormat.F32_3 }, { format: VertexFormat.F32_2 }])
        let quadPass = new RenderPass(quad, [[texture, sampler]], [vertices, uvs], indices)

        let test = new RenderPipeline(device, new Shader(device, testCode), texture.format,
            [{ format: VertexFormat.F32_3 }], { depth: depth.format, blend: true })
        let testPass = new RenderPass(test, [], [vertices], indices)

        let compute = new ComputePipeline(device, new Shader(device, computeCode))
        let computePass = new ComputePass(compute, [[gridSize, state, temp]])

        window.requestAnimationFrame(update)
        function update()
        {
            window.requestAnimationFrame(update)

            compute.start()
            computePass.dispatch(Math.ceil(GRID_WIDTH / 8), Math.ceil(GRID_HEIGHT / 8))
            compute.end()

            device.copyTexture(temp, state)

            render.start(texture, { depth })
            renderPass.render(6, length)
            render.end()

            test.start(texture, { load: LoadOperation.LOAD, depth, depthLoad: LoadOperation.LOAD })
            testPass.render(6)
            test.end()

            quad.start(device.texture)
            quadPass.render(6)
            quad.end()

            device.submit()
        }
    }

}
