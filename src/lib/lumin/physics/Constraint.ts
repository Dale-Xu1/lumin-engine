import Vector2 from "../../math/Vector2"
import { Component } from "../LuminEngine"
import type RigidBody from "./RigidBody"
import type Shape from "./Shape"

export interface ConstraintParams
{

    pointA?: Vector2
    pointB?: Vector2

    stiffness?: number
    damping?: number

}

export default class Constraint extends Component
{

    public readonly pointA: Vector2
    public readonly pointB: Vector2

    public stiffness: number
    public damping: number

    public constructor(public readonly length: number, public readonly a: RigidBody<Shape>, public readonly b: RigidBody<Shape>,
    {
        pointA = Vector2.ZERO,
        pointB = Vector2.ZERO,
        stiffness = 1, damping = 1
    }: ConstraintParams = {})
    {
        super()
        this.pointA = pointA
        this.pointB = pointB

        this.stiffness = stiffness
        this.damping = damping
    }

    public override init() { this.scene.physics.constraints.push(this) }


    public resolve(iterations: number)
    {
        let pointA = this.pointA.rotate(this.a.angle)
        let pointB = this.pointB.rotate(this.b.angle)

        let delta = this.a.position.add(pointA).sub(this.b.position.add(pointB))
        let normal = delta.normalize()

        let rv = this.a.velocity.sub(this.b.velocity)
        let difference = delta.length - this.length

        // Apply restorative force as impulse
        let force = normal.mul(this.stiffness * difference)
        this.correctPositions(force)

        force = force.div(iterations)
        this.a.applyImpulse(force.neg(), pointA)
        this.b.applyImpulse(force, pointB)

        // Reduce velocity along normal of the constraint
        let velocity = normal.mul(this.damping * normal.dot(rv) / iterations)
        this.a.applyImpulse(velocity.neg(), pointA)
        this.b.applyImpulse(velocity, pointB)
    }

    private correctPositions(force: Vector2)
    {
        let total = this.a.mass + this.b.mass
        this.a.position = this.a.position.sub(force.mul(this.damping * this.a.mass / total))
        this.b.position = this.b.position.add(force.mul(this.damping * this.b.mass / total))
    }

    public debug(c: CanvasRenderingContext2D)
    {
        c.strokeStyle = "black"
        c.strokeWidth = 1

        let u = this.a.entity.position.add(this.pointA.rotate(this.a.angle))
        let v = this.b.entity.position.add(this.pointB.rotate(this.b.angle))

        c.beginPath()
        c.moveTo(u.x, u.y)
        c.lineTo(v.x, v.y)
        c.stroke()
    }

}
