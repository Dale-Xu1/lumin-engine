import Vector2 from "../../math/Vector2"
import type Body from "./Body"
import Collision, { Detector, RayIntersection } from "./Collision"
import type Constraint from "./Constraint"
import type Manifold from "./Manifold"
import type { Ray } from "./Shape"
import type Shape from "./Shape"

export interface PhysicsParams
{

    gravity?: Vector2

    iterations?: number
    correctionRate?: number

}

export default class PhysicsEngine
{

    public readonly bodies: Body<Shape>[] = []
    public readonly constraints: Constraint[] = []

    private readonly gravity: Vector2

    private readonly iterations: number
    private readonly rate: number

    public constructor(
    {
        gravity = Vector2.DOWN.mul(9.81),
        iterations = 12,
        correctionRate = 0.4
    }: PhysicsParams = {})
    {
        this.gravity = gravity

        this.iterations = iterations
        this.rate = correctionRate
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
        this.collisions = []
        for (let body of this.bodies) body.update(delta, this.gravity)

        for (let i = 0; i < this.iterations; i++)
        {
            this.resolveConstraints()
            this.resolveCollisions()
        }
    }

    private resolveConstraints()
    {
        for (let constraint of this.constraints) constraint.resolve(this.iterations)
    }

    private resolveCollisions()
    {
        let detector = new Detector(this.bodies)
        let collisions = detector.detect()

        for (let collision of collisions) collision.resolve(this.rate)
        this.collisions.push(...collisions)
    }

    public render(c: CanvasRenderingContext2D, alpha: number)
    {
        for (let collision of this.collisions) collision.render(c)

        for (let body of this.bodies) body.render(c, alpha)
        for (let constraint of this.constraints) constraint.render(c) // TODO: Constraint rendering with interpolation
    }

}
