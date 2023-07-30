import Vector2 from "../math/Vector2"
import Entity, { Camera } from "./Entity"
import type PhysicsEngine from "./physics/PhysicsEngine"

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

const DEBUG = true
const MAX_DELAY = 200

export default class LuminEngine
{

    private readonly stack: Scene[] = []
    private get scene(): Scene { return this.stack[this.stack.length - 1] }

    private readonly delta: number
    private readonly delay: number

    public constructor(scene: Scene, delta: number = 0.02)
    {
        this.enter(scene)

        this.delta = delta
        this.delay = delta * 1000 // Convert to milliseconds

        this.frame = this.frame.bind(this)
    }


    public enter(scene: Scene) { this.stack.push(scene) }
    public exit(): Scene { return this.stack.pop()! }

    private previous!: number
    private accumulated: number = 0

    private timer!: number
    public start()
    {
        this.timer = window.requestAnimationFrame(now =>
        {
            this.previous = now
            this.scene.update(this.delta)

            this.frame(now)
        })
    }
    public stop() { window.cancelAnimationFrame(this.timer) }

    private frame(now: number)
    {
        window.requestAnimationFrame(this.frame)

        // Accumulate lagged time
        this.accumulated += now - this.previous
        this.previous = now

        if (this.accumulated > MAX_DELAY) this.accumulated = MAX_DELAY // Prevent spiral of death
        while (this.accumulated > this.delay)
        {
            this.accumulated -= this.delay
            if (this.scene !== null) this.scene.update(this.delta)
        }

        // Calculate alpha for interpolation
        let alpha = this.accumulated / this.delay
        if (this.scene !== null) this.scene.render(alpha)
    }

}

export class Scene
{

    public readonly camera: Camera
    public readonly entities: Entity[] = []

    public constructor(camera: Entity, public readonly physics: PhysicsEngine)
    {
        this.addEntity(camera)

        let component = camera.getComponent(Camera)
        if (component === null) throw new Error("Entity must have Camera component")

        this.camera = component
    }


    public addEntity(entity: Entity)
    {
        entity.scene = this
        this.entities.push(entity)

        entity.init()
    }

    public toWorldSpace(screen: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(camera.width / 2, camera.height / 2)

        let world = screen.sub(dimensions).div(camera.height / camera.size)
        return new Vector2(world.x, -world.y).sub(camera.position)
    }

    public toScreenSpace(world: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(camera.width / 2, camera.height / 2)

        let screen = world.add(camera.position)
        return new Vector2(screen.x, -screen.y).mul(camera.height / camera.size).add(dimensions)
    }

    public update(delta: number)
    {
        // TODO: Scene description file
        // TODO: Particle system

        for (let entity of this.entities) entity.update(delta)
        this.physics.update(delta)
    }

    public render(alpha: number)
    {
        this.physics.preRender(alpha)
        this.camera.transform()

        let c = this.camera.context
        for (let entity of this.entities) entity.render(c, alpha)

        if (DEBUG) this.physics.debug(c)
    }

}
