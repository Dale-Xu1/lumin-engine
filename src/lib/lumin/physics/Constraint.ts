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

    private accumulated: number = 0

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

    public start()
    {
        let [r1, r2] = this.localPoints

        let normal = this.a.position.add(r1).sub(this.b.position.add(r2)).normalize()
        let impulse = normal.mul(this.accumulated)

        // Warm start
        this.a.applyImpulse(impulse.neg(), r1)
        this.b.applyImpulse(impulse, r2)
    }

    public resolve(dt: number)
    {
        let [r1, r2] = this.localPoints

        let offset = this.a.position.add(r1).sub(this.b.position.add(r2))
        let normal = offset.normalize()

        let rn = r1.cross(normal) ** 2 * this.a.invInertia + r2.cross(normal) ** 2 * this.b.invInertia
        let share = 1 / (this.a.invMass + this.b.invMass + rn)

        let v1 = this.a.velocity.add(new Vector2(-r1.y * this.a.angularVelocity, r1.x * this.a.angularVelocity))
        let v2 = this.b.velocity.add(new Vector2(-r2.y * this.b.angularVelocity, r2.x * this.b.angularVelocity))
        let dv = v2.sub(v1)

        let bias = BIAS_FACTOR / dt * (offset.length - this.length)
        let normalVelocity = -dv.dot(normal) + bias

        let j = normalVelocity * share
        let impulse = normal.mul(j)

        this.a.applyImpulse(impulse.neg(), r1)
        this.b.applyImpulse(impulse, r2)

        this.accumulated += j
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
