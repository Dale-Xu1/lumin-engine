import Vector2 from "../Vector2"
import type RigidBody from "./RigidBody"
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

    public readonly bodies: RigidBody<Shape>[] = []
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


    public testPoint(point: Vector2): RigidBody<Shape>[]
    {
        let bodies: RigidBody<Shape>[] = []
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
        for (let body of this.bodies) body.integrate(delta, this.gravity)

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

    public preRender(alpha: number) { for (let body of this.bodies) body.preRender(alpha) }
    public debug(c: CanvasRenderingContext2D)
    {
        for (let collision of this.collisions) collision.debug(c)
        for (let constraint of this.constraints) constraint.debug(c)
        for (let body of this.bodies) body.debug(c)
    }

}
