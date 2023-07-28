<script lang="ts">
import { onMount } from "svelte"

import LuminEngine, { Camera, Scene } from "./lumin/LuminEngine"
import Vector2 from "./math/Vector2"
import Body, { BodyType } from "./lumin/Body"
import { Circle, Rectangle } from "./lumin/Shape"

let canvas: HTMLCanvasElement
let scene: Scene

onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight
    scene = new Scene(new Camera(canvas, width, height, Vector2.ZERO))

    setInterval(() =>
    {
        let shape = Math.random() < 0.5 ?
            new Circle(Math.random() * 0.4 + 0.2) :
            new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        scene.bodies.push(new Body(shape, new Vector2(Math.random() * 2 - 1, 5), Math.random() * 2 * Math.PI))
    }, 1000)

    // for (let i = 0; i < 50; i++)
    // {
    //     let shape = Math.random() < 0.5 ?
    //         new Circle(Math.random() * 0.4 + 0.2) :
    //         new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
    //     scene.bodies.push(new Body(shape, new Vector2(Math.random() * 2 - 1, 0), Math.random() * 2 * Math.PI))
    // }

    // scene.bodies.push(new Body(new Circle(0.5), new Vector2(2, 5), 0))
    // scene.bodies.push(new Body(new Rectangle(1, 1), new Vector2(0, 0), 0))

    // scene.bodies.push(new Body(new Rectangle(1, 0.5), new Vector2(0.7, 5), 0))

    scene.bodies.push(new Body(new Rectangle(16, 1), new Vector2(0, -8), 0, { type: BodyType.Static }))
    scene.bodies.push(new Body(new Rectangle(1, 16), new Vector2(-8, 0), 0, { type: BodyType.Static }))
    scene.bodies.push(new Body(new Rectangle(1, 16), new Vector2(8, 0), 0, { type: BodyType.Static }))
    scene.bodies.push(new class extends Body<Rectangle>
    {

        private up: boolean = false
        private down: boolean = false
        private left: boolean = false
        private right: boolean = false

        private cw: boolean = false
        private ccw: boolean = false

        public constructor()
        {
            super(new Rectangle(0.5, 0.5, 20), new Vector2(0, 0), 0)
            let event = (value: boolean) => (e: KeyboardEvent) =>
            {
                switch (e.code)
                {
                    case "ArrowUp": this.up = value; break
                    case "ArrowDown": this.down = value; break
                    case "ArrowLeft": this.left = value; break
                    case "ArrowRight": this.right = value; break

                    case "KeyX": this.cw = value; break
                    case "KeyZ": this.ccw = value; break
                }
            }

            window.addEventListener("keydown", event(true))
            window.addEventListener("keyup", event(false))
        }


        public override update(delta: number, gravity: Vector2)
        {
            let speed = 30

            let offset = Vector2.ZERO
            let angle = 0

            if (this.up) offset = offset.add(Vector2.UP)
            if (this.down) offset = offset.add(Vector2.DOWN)
            if (this.left) offset = offset.add(Vector2.LEFT)
            if (this.right) offset = offset.add(Vector2.RIGHT)

            if (this.cw) angle -= 1
            if (this.ccw) angle += 1

            this.applyForce(offset.normalize().mul(speed * 5))
            this.applyTorque(angle * speed)

            super.update(delta, gravity)
        }

    }())

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
