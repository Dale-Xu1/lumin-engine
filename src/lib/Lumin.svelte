<script lang="ts">
import { onMount } from "svelte"

import LuminEngine, { Camera, Scene } from "./lumin/LuminEngine"
import Vector2 from "./math/Vector2"
import Body, { BodyType } from "./lumin/physics/Body"
import { Circle, Rectangle } from "./lumin/physics/Shape"
import PhysicsEngine from "./lumin/physics/PhysicsEngine"
import Constraint from "./lumin/physics/Constraint"

let canvas: HTMLCanvasElement
let scene: Scene

onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight

    let camera = new Camera(canvas, width, height, Vector2.ZERO)
    let physics = new PhysicsEngine()
    scene = new Scene(camera, physics)

    window.addEventListener("mousedown", e =>
    {
        let position = scene.toWorldSpace(new Vector2(e.clientX, e.clientY))
        if (scene.physics.testPoint(position).length > 0) return

        let shape = Math.random() < 0.5 ?
            new Circle(Math.random() * 0.4 + 0.2) :
            new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        scene.physics.bodies.push(new Body(shape, position, Math.random() * 2 * Math.PI))
    })

    for (let i = 0; i < 30; i++)
    {
        let shape = Math.random() < 0.5 ?
            new Circle(Math.random() * 0.4 + 0.2) :
            new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        scene.physics.bodies.push(new Body(shape, new Vector2(Math.random() * 2 - 1, 0), Math.random() * 2 * Math.PI))
    }

    scene.physics.bodies.push(new Body(new Rectangle(24, 1), new Vector2(0, -8), 0, { type: BodyType.Static }))
    scene.physics.bodies.push(new Body(new Rectangle(1, 16), new Vector2(-12, 0), 0, { type: BodyType.Static }))
    scene.physics.bodies.push(new Body(new Rectangle(1, 16), new Vector2(12, 0), 0, { type: BodyType.Static }))
    let control = new class extends Body<Rectangle>
    {

        private up: boolean = false
        private down: boolean = false
        private left: boolean = false
        private right: boolean = false

        private cw: boolean = false
        private ccw: boolean = false

        public constructor()
        {
            super(new Rectangle(0.5, 0.5, 20), new Vector2(0, 5), 0, { gravityScale: 0 })
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

    }()
    scene.physics.bodies.push(control)

    let a = new Body(new Rectangle(1, 1), new Vector2(-5, 2), 0)
    let b = new Body(new Rectangle(1, 1), new Vector2(-5, 4), 0)
    let c = new Body(new Rectangle(1, 1), new Vector2(-3, 4), 0)
    let d = new Body(new Rectangle(1, 1), new Vector2(-3, 2), 0)
    scene.physics.bodies.push(a)
    scene.physics.bodies.push(b)
    scene.physics.bodies.push(c)
    scene.physics.bodies.push(d)

    scene.physics.constraints.push(new Constraint(2, a, b))
    scene.physics.constraints.push(new Constraint(2, b, c))
    scene.physics.constraints.push(new Constraint(2, c, d))
    scene.physics.constraints.push(new Constraint(2, d, a))
    scene.physics.constraints.push(new Constraint(Math.sqrt(8), a, c))
    scene.physics.constraints.push(new Constraint(Math.sqrt(8), b, d))

    let e = new Body(new Rectangle(0.5, 0.5, 5), new Vector2(4, 4), 0, { type: BodyType.Static })
    let f = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, 3), 0)
    let g = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, 2), 0)
    let h = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, 1), 0)
    let i = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, 0), 0)
    let j = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, -1), 0)
    let k = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, -2), 0)
    let l = new Body(new Rectangle(0.2, 0.5, 5), new Vector2(4, -3), 0)
    scene.physics.bodies.push(e)
    scene.physics.bodies.push(f)
    scene.physics.bodies.push(g)
    scene.physics.bodies.push(h)
    scene.physics.bodies.push(i)
    scene.physics.bodies.push(j)
    scene.physics.bodies.push(k)
    scene.physics.bodies.push(l)

    scene.physics.constraints.push(new Constraint(0.5, e, f, { pointA: Vector2.ZERO, pointB: Vector2.UP.mul(0.15), damping: 0.01 }))
    scene.physics.constraints.push(new Constraint(0.5, f, g, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))
    scene.physics.constraints.push(new Constraint(0.5, g, h, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))
    scene.physics.constraints.push(new Constraint(0.5, h, i, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))
    scene.physics.constraints.push(new Constraint(0.5, i, j, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))
    scene.physics.constraints.push(new Constraint(0.5, j, k, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))
    scene.physics.constraints.push(new Constraint(0.5, k, l, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) }))

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
