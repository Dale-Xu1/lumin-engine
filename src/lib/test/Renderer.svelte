<script lang="ts">
import { onMount } from "svelte"

import Device, { ComputePipeline, RenderPipeline, Shader, VertexFormat } from "../lumin/render/Device"
import { Buffer, Texture } from "../lumin/render/Resource"

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
       -1, -1,
        1, -1,
        1,  1,

       -1, -1,
        1,  1,
       -1,  1
    ]))

    const SCALE = 5
    const GRID_WIDTH = Math.floor(window.innerWidth / SCALE), GRID_HEIGHT = Math.floor(window.innerHeight / SCALE)

    let gridSize = new Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 2)
    gridSize.write(new Float32Array([GRID_WIDTH, GRID_HEIGHT]))

    // TODO: Rewrite to use textures
    let length = GRID_WIDTH * GRID_HEIGHT
    let state = new Buffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, length)
    let temp = new Buffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, length)

    // let test = new Texture(device, TextureFormat.R_U8, GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    //     [GRID_WIDTH, GRID_HEIGHT])

    let stateData = new Uint32Array(length)
    for (let i = 0; i < stateData.length; i++) stateData[i] = Math.random() > 0.6 ? 1 : 0
    state.write(stateData)

    let render = new RenderPipeline(device, new Shader(device, renderCode), "vertex", "fragment",
        [[0, vertices, VertexFormat.F32_2]])
    render.bind(0, [[0, gridSize], [1, state]])

    let compute = new ComputePipeline(device, new Shader(device, computeCode), "main")
    compute.bind(0, [[0, gridSize], [1, state], [2, temp]])

    window.requestAnimationFrame(update)
    function update()
    {
        window.requestAnimationFrame(update)
        compute.dispatch(Math.ceil(GRID_WIDTH / 8), Math.ceil(GRID_HEIGHT / 8))

        device.copyBuffer(temp, state)
        render.render(device.texture, 6, length)

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
