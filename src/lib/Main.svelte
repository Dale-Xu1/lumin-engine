<script lang="ts">
import { onMount } from "svelte"

import * as Lumin from "./lumin/Lumin"
import ExampleScene from "./ExampleScene"
import RenderEngine from "./lumin/render/RenderEngine"

let canvas: HTMLCanvasElement
onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight
    // Lumin.init(new Lumin.Camera(canvas, width, height))

    // Lumin.enter(new ExampleScene())
    // Lumin.engine.start()

    let ratio = window.devicePixelRatio
    canvas.width = width * ratio
    canvas.height = height * ratio
    let renderer = new RenderEngine(canvas)
})

function onResize()
{
    let width = window.innerWidth, height = window.innerHeight
    Lumin.camera.resize(width, height)
}

</script>

<svelte:window on:resize={onResize} />
<canvas bind:this={canvas}></canvas>

<style>
canvas {
    width: 100%;
    height: 100vh;
}

</style>
