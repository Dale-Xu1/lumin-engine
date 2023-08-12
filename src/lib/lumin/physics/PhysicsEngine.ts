import { Vector2 } from "../Math"
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
    positionIterations?: number

    correctionRate?: number

}

export default class PhysicsEngine
{

    private readonly bodies: RigidBody<Shape>[] = []
    private readonly constraints: Constraint[] = []

    private readonly gravity: Vector2

    private readonly iterations: number
    private readonly positionIterations: number

    private readonly rate: number

    public constructor(
    {
        gravity = Vector2.DOWN.mul(9.81),
        iterations = 16, positionIterations = 12,
        correctionRate = 0.7
    }: PhysicsParams = {})
    {
        this.gravity = gravity

        this.iterations = iterations
        this.positionIterations = positionIterations
        this.rate = correctionRate
    }

    public addBody(body: RigidBody<Shape>) { this.bodies.push(body) }
    public removeBody(body: RigidBody<Shape>)
    {
        let index = this.bodies.indexOf(body)
        if (index >= 0) this.bodies.splice(index, 1)
    }

    public addConstraint(constraint: Constraint) { this.constraints.push(constraint) }
    public removeConstraint(constraint: Constraint)
    {
        let index = this.constraints.indexOf(constraint)
        if (index >= 0) this.constraints.splice(index, 1)
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


    private collisions!: Manifold[]
    public update(delta: number)
    {
        for (let body of this.bodies) body.integrate(delta, this.gravity)

        let detector = new Detector(this.bodies)
        this.collisions = detector.detect()

        for (let i = 0; i < this.iterations; i++)
        {
            for (let constraint of this.constraints) constraint.resolve()
            for (let collision of this.collisions) collision.resolve()
        }

        for (let i = 0; i < this.positionIterations; i++)
        {
            for (let constraint of this.constraints) constraint.correctPositions(this.rate)
            for (let collision of this.collisions) collision.correctPositions(this.rate)
        }
    }

    public debug(c: CanvasRenderingContext2D)
    {
        for (let collision of this.collisions) collision.debug(c)
        for (let constraint of this.constraints) constraint.debug(c)
        for (let body of this.bodies) body.debug(c)
    }

}
