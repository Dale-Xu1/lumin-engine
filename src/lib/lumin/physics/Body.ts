import Vector2 from "../../math/Vector2"
import type { Bounds } from "./Shape"
import type Shape from "./Shape"

export enum BodyType { Static, Dynamic }
export interface BodyParams
{

    type?: BodyType

    friction?: number
    staticFriction?: number

    restitution?: number

    gravityScale?: number

}

interface Constructor<T> { new(...args: any[]): T }

export default class Body<T extends Shape>
{

    public velocity: Vector2 = Vector2.ZERO
    private force: Vector2 = Vector2.ZERO

    public rotation: number = 0
    private torque: number = 0

    public readonly type: BodyType
    public readonly mass: number
    public readonly inertia: number

    public readonly friction: number
    public readonly staticFriction: number

    public readonly restitution: number
    public gravityScale: number


    public constructor(public readonly shape: T, public position: Vector2, public angle: number,
    {
        type = BodyType.Dynamic,
        friction = 0.3, staticFriction = 0.5,
        restitution = 0.2,
        gravityScale = 1
    }: BodyParams = {})
    {
        this.shape = shape

        this.previousPosition = position
        this.previousAngle = angle

        this.type = type
        if (type === BodyType.Dynamic)
        {
            let [mass, inertia] = shape.calculate()

            this.mass = 1 / mass // Store inverse because multiplication is faster
            this.inertia = 1 / inertia
        }
        else // Static bodies are given infinite mass
        {
            this.mass = 0
            this.inertia = 0
        }

        this.friction = friction
        this.staticFriction = staticFriction

        this.restitution = restitution
        this.gravityScale = gravityScale

        this.shape.update(this)
    }

    public is<T extends Shape>(shape: Constructor<T>): this is Body<T> { return this.shape instanceof shape }


    public applyTorque(torque: number) { this.torque += torque }
    public applyForce(force: Vector2, contact?: Vector2)
    {
        this.force = this.force.add(force)
        if (contact) this.applyTorque(contact.cross(force)) // Calculate torque based on contact point
    }

    public applyImpulse(impulse: Vector2, contact: Vector2)
    {
        this.velocity = this.velocity.add(impulse.mul(this.mass))
        this.rotation += contact.cross(impulse) * this.inertia
    }

    private previousPosition: Vector2 // Previous data is kept for interpolation
    private previousAngle: number

    public update(delta: number, gravity: Vector2)
    {
        this.previousPosition = this.position
        this.previousAngle = this.angle

        if (this.type === BodyType.Dynamic) this.integrate(delta, gravity)
        this.shape.update(this)
    }

    private integrate(delta: number, gravity: Vector2)
    {
        // Calculate acceleration
        let acceleration = this.force.mul(this.mass).add(gravity.mul(this.gravityScale))

        // Integrate position
        this.velocity = this.velocity.add(acceleration.mul(delta))
        this.position = this.position.add(this.velocity.mul(delta))

        // Integrate angle
        this.rotation += this.torque * this.inertia * delta
        this.angle += this.rotation * delta

        // Clear forces
        this.force = Vector2.ZERO
        this.torque = 0
    }

    public getBounds(): Bounds { return this.shape.getBounds(this) }

    private lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
    public render(c: CanvasRenderingContext2D, alpha: number)
    {
        // Interpolate position
        let position = Vector2.lerp(this.previousPosition, this.position, alpha)
        let angle = this.lerp(this.previousAngle, this.angle, alpha)

        // let bound = this.shape.getBounds(this)

        // c.strokeWidth = 1
        // c.strokeStyle = "gray"
        // c.strokeRect(bound.min.x, bound.min.y, bound.max.x - bound.min.x, bound.max.y - bound.min.y)

        // Apply transformations
        c.save()
        c.translate(position.x, position.y)
        c.rotate(angle)

        this.shape.render(c)
        c.restore()
    }

}
