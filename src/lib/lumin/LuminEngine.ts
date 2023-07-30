import Vector2 from "../math/Vector2"
import type PhysicsEngine from "./physics/PhysicsEngine"

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

const MAX_DELAY = 200

export default class LuminEngine
{

    private readonly scene: Scene

    private readonly delta: number
    private readonly delay: number

    public constructor(scene: Scene, delta: number = 0.02)
    {
        this.scene = scene

        this.delta = delta
        this.delay = delta * 1000 // Convert to milliseconds

        this.frame = this.frame.bind(this)
    }


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
            this.scene.update(this.delta)
        }

        // Calculate alpha for interpolation
        let alpha = this.accumulated / this.delay
        this.scene.render(alpha)
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
        // TODO: Scene stack
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
        this.physics.debug(c)
        for (let entity of this.entities) entity.render(c, alpha)
    }

}

interface Constructor<T> { new(...args: any[]): T }

export class Entity
{

    public scene!: Scene

    public constructor(public position: Vector2, public angle: number, public readonly components: Component[])
    {
        // Register components to this entity
        for (let component of components) component.entity = this
    }


    public getComponent<T>(type: Constructor<T>): T | null
    {
        for (let component of this.components) if (component instanceof type) return component
        return null
    }

    public addComponent(component: Component)
    {
        component.entity = this
        this.components.push(component)
    }

    public init() { for (let component of this.components) component.init() }
    public update(delta: number) { for (let component of this.components) component.update(delta) }

    public render(c: CanvasRenderingContext2D, alpha: number)
    {
        // Apply transformations
        c.save()
        c.translate(this.position.x, this.position.y)
        c.rotate(this.angle)

        for (let component of this.components) component.render(c, alpha)
        c.restore()
    }

}

export abstract class Component
{

    public entity!: Entity
    public get scene(): Scene { return this.entity.scene }

    protected getComponent<T>(type: Constructor<T>): T | null { return this.entity.getComponent(type) }


    public init() { }
    public update(delta: number) { }
    public render(c: CanvasRenderingContext2D, alpha: number) { }

}

export class Camera extends Component
{

    public readonly canvas: HTMLCanvasElement
    public readonly context: CanvasRenderingContext2D

    public get position(): Vector2 { return this.entity.position }
    public get angle(): number { return this.entity.angle }

    public width!: number
    public height!: number

    public size: number

    public constructor(canvas: HTMLCanvasElement, width: number, height: number, size: number = 20)
    {
        super()
        this.canvas = canvas
        this.context = canvas.getContext("2d")!

        this.size = size
        this.resize(width, height)

        // Define custom setter "strokeWidth" that sets lineWidth relative to camera scale
        let c = this.context
        Object.defineProperty(c, "strokeWidth",
        {
            set: value => c.lineWidth = value * this.size / this.height
        })
    }


    public transform()
    {
        let c = this.context
        c.restore()
        c.save()
        c.clearRect(0, 0, this.width, this.height)

        // Center origin
        c.translate(this.width / 2, this.height / 2)

        // Apply transformations
        let position = this.position.neg()
        let scale = this.height / this.size

        c.scale(scale, -scale)
        c.rotate(-this.angle)
        c.translate(position.x, position.y)
    }

    public resize(width: number, height: number)
    {
        this.width = width
        this.height = height

        let ratio = window.devicePixelRatio

        this.canvas.width = width * ratio
        this.canvas.height = height * ratio

        let c = this.context
        c.scale(ratio, ratio)
    }

}
