<script lang="ts">
import { onMount } from "svelte"

import Device, { ComputePipeline, RenderPipeline, Shader, VertexFormat } from "../lumin/render/Device"
import { Buffer, Texture, TextureFormat } from "../lumin/render/Resource"

import renderCode from "./render.wgsl?raw"
import computeCode from "./compute.wgsl?raw"

let canvas: HTMLCanvasElement
onMount(async () =>
{
    let ratio = window.devicePixelRatio
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio

    let device = await Device.init(canvas)

    let vertices = new Buffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 12)
    vertices.write(new Float32Array(
    [
        [-1, -1], [1, -1], [ 1, 1],
        [-1, -1], [1,  1], [-1, 1]
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
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST, [canvas.width, canvas.height])

    let render = new RenderPipeline(device, new Shader(device, renderCode), "vertex", "fragment",
        texture.format, [[0, vertices, VertexFormat.F32_2]])
    render.bind(0, [[0, gridSize], [1, state]])

    let compute = new ComputePipeline(device, new Shader(device, computeCode), "main")
    compute.bind(0, [[0, gridSize], [1, state], [2, temp]])

    window.requestAnimationFrame(update)
    function update()
    {
        window.requestAnimationFrame(update)
        compute.dispatch(Math.ceil(GRID_WIDTH / 8), Math.ceil(GRID_HEIGHT / 8))

        device.copyTexture(temp, state)
        render.render(texture, 6, length)

        device.flush()
    }
})

</script>

<canvas bind:this={canvas}></canvas>
<style>
canvas {
    width: 100%;
    height: 100vh;
}

</style>
