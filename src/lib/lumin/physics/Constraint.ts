import Vector2 from "../Vector2"
import { Component } from "../Entity"
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


    private get localPoints(): [Vector2, Vector2]
    {
        return [this.pointA.rotate(this.a.angle), this.pointB.rotate(this.b.angle)]
    }

    private calculateDifference(): [Vector2, number]
    {
        let [pointA, pointB] = this.localPoints
        let delta = this.a.position.add(pointA).sub(this.b.position.add(pointB))
        let normal = delta.normalize()

        let difference = delta.length - this.length
        return [normal, difference]
    }

    public resolve(iterations: number)
    {
        let [pointA, pointB] = this.localPoints
        let [normal, difference] = this.calculateDifference()

        // Restorative impulse
        let impulse = normal.mul(this.stiffness * difference).div(iterations)
        this.a.applyImpulse(impulse.neg(), pointA)
        this.b.applyImpulse(impulse, pointB)

        // Dampen velocity along normal direction
        let rv = this.a.velocity.sub(this.b.velocity)
        let damping = normal.mul(this.damping * normal.dot(rv)).div(iterations)

        this.a.applyImpulse(damping.neg(), pointA)
        this.b.applyImpulse(damping, pointB)
    }

    public correctPositions(rate: number)
    {
        let [normal, difference] = this.calculateDifference()

        let total = this.a.mass + this.b.mass
        let correction = this.stiffness * this.damping * difference / total * rate

        this.a.position = this.a.position.sub(normal.mul(correction * this.a.mass))
        this.b.position = this.b.position.add(normal.mul(correction * this.b.mass))
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
