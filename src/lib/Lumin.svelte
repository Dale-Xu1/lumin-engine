<script lang="ts">
import { onMount } from "svelte"

import LuminEngine, { Camera, Scene } from "./lumin/LuminEngine"
import Vector2 from "./math/Vector2"
import Body from "./lumin/Body"
import { Circle, Rectangle } from "./lumin/Shape"

let canvas: HTMLCanvasElement
let scene: Scene

onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight
    scene = new Scene(new Camera(canvas, width, height, Vector2.ZERO))

    scene.bodies.push(new Body(new Rectangle(16, 0.5), new Vector2(0, -8), { dynamic: false }))
    scene.bodies.push(new Body(new Rectangle(2, 1), new Vector2(-2, 0)))
    scene.bodies.push(new Body(new Circle(1), new Vector2(2, 0)))

    let engine = new LuminEngine(scene)
    engine.start()
})

function onResize()
{
    let width = window.innerWidth, height = window.innerHeight
    scene.camera.resize(width, height)
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
