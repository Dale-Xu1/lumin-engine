<script lang="ts">
import { onMount } from "svelte"

import LuminEngine, { Scene } from "./lumin/LuminEngine"
import Vector2 from "./math/Vector2"
import RigidBody, { BodyType } from "./lumin/physics/RigidBody"
import Shape, { Circle, Polygon, Ray, Rectangle } from "./lumin/physics/Shape"
import PhysicsEngine from "./lumin/physics/PhysicsEngine"
import Constraint from "./lumin/physics/Constraint"
import Entity, { Camera, Component } from "./lumin/Entity"

let canvas: HTMLCanvasElement
let scene: Scene

onMount(() =>
{
    let width = window.innerWidth, height = window.innerHeight

    let camera = new Entity(Vector2.ZERO, 0, [new Camera(canvas, width, height)])
    scene = new Scene(camera, new PhysicsEngine())

    window.addEventListener("mousedown", e =>
    {
        let position = scene.toWorldSpace(new Vector2(e.clientX, e.clientY))
        if (scene.physics.testPoint(position).length > 0) return

        let shape = Math.random() < 0.5 ?
            new Circle(Math.random() * 0.4 + 0.2) :
            new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        scene.addEntity(new Entity(position, Math.random() * 2 * Math.PI, [new RigidBody(shape)]))
    })

    for (let i = 0; i < 30; i++)
    {
        let shape = Math.random() < 0.5 ?
            new Circle(Math.random() * 0.4 + 0.2) :
            new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        scene.addEntity(new Entity(new Vector2(Math.random() * 2 - 1, 0), Math.random() * 2 * Math.PI, [new RigidBody(shape)]))
    }

    scene.addEntity(new Entity(new Vector2(0, -8), 0, [new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })]))
    scene.addEntity(new Entity(new Vector2(-12, 0), 0, [new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })]))
    scene.addEntity(new Entity(new Vector2(12, 0), 0, [new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })]))
    scene.addEntity(new Entity(new Vector2(0, 5), 0,
    [
        new RigidBody(new Rectangle(0.5, 0.5, 20), { gravityScale: 0 }),
        new class extends Component
        {

            private up: boolean = false
            private down: boolean = false
            private left: boolean = false
            private right: boolean = false

            private cw: boolean = false
            private ccw: boolean = false

            private body!: RigidBody<Rectangle>

            public override init()
            {
                this.body = this.getComponent(RigidBody)!
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

            public override update()
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

                this.body.applyForce(offset.normalize().mul(speed * 5))
                this.body.applyTorque(angle * speed)
            }

            public override render(c: CanvasRenderingContext2D)
            {
                let t = c.getTransform()
                c.restore()

                let intersection = scene.physics.testRay(new Ray(this.entity.position, Vector2.DOWN.rotate(this.entity.angle)))
                if (intersection !== null)
                {
                    c.strokeStyle = "red"
                    c.strokeWidth = 1

                    let u = this.entity.position
                    let v = intersection.position

                    c.beginPath()
                    c.moveTo(u.x, u.y)
                    c.lineTo(v.x, v.y)
                    c.stroke()
                }

                c.save()
                c.setTransform(t)
            }

        }()
    ]))

    let a = new RigidBody(new Rectangle(1, 1))
    let b = new RigidBody(new Rectangle(1, 1))
    let c = new RigidBody(new Rectangle(1, 1))
    let d = new RigidBody(new Rectangle(1, 1))
    scene.addEntity(new Entity(new Vector2(-5, 2), 0, [a, new Constraint(2, a, b), new Constraint(Math.sqrt(8), a, c)]))
    scene.addEntity(new Entity(new Vector2(-5, 4), 0, [b, new Constraint(2, b, c), new Constraint(Math.sqrt(8), b, d)]))
    scene.addEntity(new Entity(new Vector2(-3, 4), 0, [c, new Constraint(2, c, d)]))
    scene.addEntity(new Entity(new Vector2(-3, 2), 0, [d, new Constraint(2, d, a)]))

    let y = 4
    let start = new RigidBody(new Rectangle(0.5, 0.5, 5), { type: BodyType.Static })

    let chain: RigidBody<Shape>[] = []
    for (let i = 0; i < 12; i++)
    {
        let body = new RigidBody(new Rectangle(0.2, 0.5, 5))
        chain.push(body)
    }

    scene.addEntity(new Entity(new Vector2(4, y), 0, [start, new Constraint(0.5, start, chain[0], { pointA: Vector2.ZERO, pointB: Vector2.UP.mul(0.15), damping: 0.02 })]))
    scene.addEntity(new Entity(new Vector2(4, --y), 0, [chain[chain.length - 1]]))
    for (let i = 0; i < chain.length - 1; i++)
    {
        let a = chain[i]
        let b = chain[i + 1]

        y -= 0.6
        scene.addEntity(new Entity(new Vector2(4, y), 0, [a, new Constraint(0.25, a, b, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) })]))
    }

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
