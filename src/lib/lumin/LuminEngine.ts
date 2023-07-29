import Vector2 from "../math/Vector2"
import type Body from "./Body"
import Collision, { Detector, RayIntersection } from "./Collision"
import type Manifold from "./Manifold"
import type { Ray } from "./Shape"
import type Shape from "./Shape"

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

export interface SceneParams
{

    gravity?: Vector2

    iterations?: number
    correctionRate?: number

}

export class Scene
{

    public readonly camera: Camera
    public readonly bodies: Body<Shape>[] = []

    private readonly gravity: Vector2

    private readonly iterations: number
    private readonly rate: number

    public constructor(camera: Camera,
    {
        gravity = Vector2.DOWN.mul(9.81),
        iterations = 12,
        correctionRate = 0.4
    }: SceneParams = {})
    {
        this.camera = camera
        this.gravity = gravity

        this.iterations = iterations
        this.rate = correctionRate
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


    public testPoint(point: Vector2): Body<Shape>[]
    {
        let bodies: Body<Shape>[] = []
        for (let body of this.bodies)
        {
            let bounds = body.getBounds()
            if (point.x > bounds.min.x && point.x < bounds.max.x &&
                point.y > bounds.min.y && point.y < bounds.max.y &&
                Collision.testPoint(body, point)) bodies.push(body)
        }

        return bodies
    }

    public testRay(ray: Ray): RayIntersection | null
    {
        let min: RayIntersection | null = null
        for (let body of this.bodies)
        {
            let bounds = body.getBounds()
            if (Collision.rayBounds(bounds, ray))
            {
                let intersection = Collision.testRay(body, ray)
                if (intersection !== null && (min === null || intersection.distance < min.distance)) min = intersection
            }
        }

        return min
    }


    private collisions: Manifold[] = []
    public update(delta: number)
    {
        for (let body of this.bodies) body.update(delta, this.gravity)

        // TODO: Mouse interaction
        // TODO: Constraints
        // TODO: Collision layers

        // TODO: Refactor physics engine into more general game engine/entity-component system
        // TODO: Particle system

        this.collisions = []
        for (let i = 0; i < this.iterations; i++) this.resolve()
    }

    private resolve()
    {
        let detector = new Detector(this.bodies)

        let collisions = detector.detect()
        for (let collision of collisions) collision.resolve(this.rate)

        this.collisions.push(...collisions)
    }

    public render(alpha: number)
    {
        this.camera.init()
        let c = this.camera.context

        for (let collision of this.collisions) collision.render(c)
        for (let body of this.bodies) body.render(c, alpha)
    }

}

export class Camera
{

    public readonly canvas: HTMLCanvasElement
    public readonly context: CanvasRenderingContext2D

    public width!: number
    public height!: number

    public position: Vector2
    public size: number

    public constructor(canvas: HTMLCanvasElement, width: number, height: number, position: Vector2, size: number = 20)
    {
        this.canvas = canvas
        this.context = canvas.getContext("2d")!

        this.position = position
        this.size = size
        this.resize(width, height)

        // Define custom setter "strokeWidth" that sets lineWidth relative to camera scale
        let c = this.context
        Object.defineProperty(c, "strokeWidth",
        {
            set: value => c.lineWidth = value * this.size / this.height
        })
    }


    public init()
    {
        let c = this.context
        c.restore()
        c.save()
        c.clearRect(0, 0, this.width, this.height)

        // Center origin
        c.translate(this.width / 2, this.height / 2)

        // Apply transformations
        let scale = this.height / this.size
        c.scale(scale, -scale)
        c.translate(this.position.x, this.position.y)
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
