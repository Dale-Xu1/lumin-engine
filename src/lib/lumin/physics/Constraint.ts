import { Component } from "../Engine"
import { Matrix2, Vector2 } from "../Math"
import type RigidBody from "./RigidBody"
import type Shape from "./Shape"

const BIAS_FACTOR = 0.2

export interface ConstraintParams
{

    pointA?: Vector2
    pointB?: Vector2

}

export default class Constraint extends Component
{

    public readonly pointA: Vector2
    public readonly pointB: Vector2

    public constructor(public length: number,
        public readonly a: RigidBody<Shape>, public readonly b: RigidBody<Shape>,
    {
        pointA = Vector2.ZERO,
        pointB = Vector2.ZERO
    }: ConstraintParams = {})
    {
        super()
        this.pointA = pointA
        this.pointB = pointB
    }

    public override init() { this.scene.physics.addConstraint(this) }


    private get localPoints(): [Vector2, Vector2]
    {
        let a = Matrix2.rotate(this.a.angle)
        let b = Matrix2.rotate(this.b.angle)

        return [a.vmul(this.pointA), b.vmul(this.pointB)]
    }

    private calculateOffset(): Vector2
    {
        let [pointA, pointB] = this.localPoints
        let delta = this.a.position.add(pointA).sub(this.b.position.add(pointB))

        return delta
    }

    public resolve(delta: number)
    {
        let [pointA, pointB] = this.localPoints

        let offset = this.calculateOffset()
        let normal = offset.normalize()

        let rn = pointA.cross(normal) ** 2 * this.a.invInertia + pointB.cross(normal) ** 2 * this.b.invInertia
        let share = 1 / (this.a.invMass + this.b.invMass + rn)

        let v1 = this.a.velocity.add(
            new Vector2(-pointA.y * this.a.angularVelocity, pointA.x * this.a.angularVelocity))
        let v2 = this.b.velocity.add(
            new Vector2(-pointB.y * this.b.angularVelocity, pointB.x * this.b.angularVelocity))

        let bias = BIAS_FACTOR / delta * (offset.length - this.length)
        let normalVelocity = -v2.sub(v1).dot(normal) + bias

        let j = normalVelocity * share
        let impulse = normal.mul(j)

        this.a.applyImpulse(impulse.neg(), pointA)
        this.b.applyImpulse(impulse, pointB)
    }


    public render(c: CanvasRenderingContext2D)
    {
        if (!this.scene.physics.debug) return
        let transform = c.getTransform()

        c.restore()
        c.strokeStyle = "black"
        c.strokeWidth = 1

        let [pointA, pointB] = this.localPoints
        let u = this.a.position.add(pointA)
        let v = this.b.position.add(pointB)

        c.beginPath()
        c.moveTo(u.x, u.y)
        c.lineTo(v.x, v.y)
        c.stroke()

        c.save()
        c.setTransform(transform)
    }

}
