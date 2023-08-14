<script lang="ts">
import { onMount } from "svelte"

import * as Lumin from "./lumin/Lumin"
import RenderEngine from "./lumin/render/RenderEngine"

import RenderExample from "./RenderExample"
import ExampleScene from "./ExampleScene"

let canvas: HTMLCanvasElement
onMount(async () =>
{
    let width = window.innerWidth, height = window.innerHeight
    Lumin.init(await RenderEngine.init(canvas, width, height))

    Lumin.enter(new ExampleScene())
    Lumin.engine.start()
})

function onResize()
{
    let width = window.innerWidth, height = window.innerHeight
    Lumin.renderer.resize(width, height)
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
