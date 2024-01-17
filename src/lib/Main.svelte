<script lang="ts">
import { onMount } from "svelte"

import * as Lumin from "./lumin/Lumin"
import ExampleScene from "./ExampleScene"

let canvas: HTMLCanvasElement
onMount(() =>
{
    Lumin.init(new Lumin.RenderEngine(canvas, window.innerWidth, window.innerHeight))

    Lumin.engine.enter(new ExampleScene())
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
