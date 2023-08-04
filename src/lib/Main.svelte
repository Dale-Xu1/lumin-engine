<script lang="ts">
import { onMount } from "svelte"

import { Camera } from "./lumin/Entity"
import Lumin from "./lumin/Lumin"

import ExampleScene from "./ExampleScene"

let canvas: HTMLCanvasElement
onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight
    Lumin.camera = new Camera(canvas, width, height)

    Lumin.enter(new ExampleScene())
    Lumin.engine.start()
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
