import { Vector2 } from "../Math"
import { Component } from "../Entity"
import type RigidBody from "./RigidBody"
import type Shape from "./Shape"

export interface ConstraintParams
{

    pointA?: Vector2
    pointB?: Vector2

}

export default class Constraint extends Component
{

    public readonly pointA: Vector2
    public readonly pointB: Vector2

    public constructor(public readonly length: number, public readonly a: RigidBody<Shape>, public readonly b: RigidBody<Shape>,
    {
        pointA = Vector2.ZERO,
        pointB = Vector2.ZERO
    }: ConstraintParams = {})
    {
        super()
        this.pointA = pointA
        this.pointB = pointB
    }

    public override init() { this.scene.physics.constraints.push(this) }


    private get localPoints(): [Vector2, Vector2]
    {
        return [this.pointA.rotate(this.a.angle), this.pointB.rotate(this.b.angle)]
    }

    private calculateDelta(): Vector2
    {
        let [pointA, pointB] = this.localPoints
        let delta = this.a.position.add(pointA).sub(this.b.position.add(pointB))

        return delta
    }

    public resolve()
    {
        let [pointA, pointB] = this.localPoints
        let normal = this.calculateDelta().normalize()

        let rn = pointA.cross(normal) ** 2 * this.a.inertia + pointB.cross(normal) ** 2 * this.b.inertia
        let share = 1 / (this.a.mass + this.b.mass + rn)

        let v1 = this.a.velocity.add(new Vector2(-pointA.y * this.a.rotation, pointA.x * this.a.rotation))
        let v2 = this.b.velocity.add(new Vector2(-pointB.y * this.b.rotation, pointB.x * this.b.rotation))
        let normalVelocity = v2.sub(v1).dot(normal)

        let j = -normalVelocity * share
        let impulse = normal.mul(j)

        this.a.applyImpulse(impulse.neg(), pointA)
        this.b.applyImpulse(impulse, pointB)
    }

    public correctPositions(rate: number)
    {
        let delta = this.calculateDelta()

        let total = this.a.mass + this.b.mass
        let correction = (delta.length - this.length) / total * rate

        let normal = delta.normalize()
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
