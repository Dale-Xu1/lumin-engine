import { Component } from "../Engine"
import { Quaternion, Vector2 } from "../Math"
import type { Bounds } from "./Shape"
import type Shape from "./Shape"

export const enum BodyType { Static, Dynamic }
export interface BodyParams
{

    type?: BodyType

    density?: number
    restitution?: number

    friction?: number
    staticFriction?: number

    gravityScale?: number

}

interface Constructor<T> { new(...args: any[]): T }

export default class RigidBody<T extends Shape> extends Component
{

    public position!: Vector2
    public velocity: Vector2 = Vector2.ZERO
    private force: Vector2 = Vector2.ZERO

    public angle!: number
    public rotation: number = 0
    private torque: number = 0

    public readonly type: BodyType

    private _density!: number
    public get density(): number { return this._density }
    public set density(density: number)
    {
        this._density = density
        this.calculateMass()
    }

    public restitution: number

    public mass!: number
    public inertia!: number

    public friction: number
    public staticFriction: number

    public gravityScale: number

    public constructor(public readonly shape: T,
    {
        type = BodyType.Dynamic,
        density = 1, restitution = 0.2,
        friction = 0.3, staticFriction = 0.5,
        gravityScale = 1
    }: BodyParams = {})
    {
        super()
        this.shape = shape
        this.type = type

        this.density = density
        this.restitution = restitution

        this.friction = friction
        this.staticFriction = staticFriction

        this.gravityScale = gravityScale
        this.shape.update(this)
    }

    private calculateMass()
    {
        if (this.type === BodyType.Dynamic)
        {
            let [mass, inertia] = this.shape.calculate(this.density)

            this.mass = 1 / mass // Store inverse because multiplication is faster
            this.inertia = 1 / inertia
        }
        else // Static bodies are given infinite mass
        {
            this.mass = 0
            this.inertia = 0
        }
    }

    public is<T extends Shape>(shape: Constructor<T>): this is RigidBody<T> { return this.shape instanceof shape }
    public override init()
    {
        this.previousPosition = this.position = this.entity.position.cast()
        this.previousAngle = this.angle = this.entity.rotation.euler.z

        this.scene.physics.addBody(this)
    }

    public override destroy() { this.scene.physics.removeBody(this) }


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

    private previousPosition!: Vector2 // Previous data is kept for interpolation
    private previousAngle!: number

    public integrate(delta: number, gravity: Vector2)
    {
        this.previousPosition = this.position
        this.previousAngle = this.angle

        if (this.type === BodyType.Dynamic) this.dynamicUpdate(delta, gravity)
        else this.staticUpdate()

        // Clear forces
        this.force = Vector2.ZERO
        this.torque = 0

        this.shape.update(this)
    }

    private dynamicUpdate(delta: number, gravity: Vector2)
    {
        // Calculate acceleration
        let acceleration = this.force.mul(this.mass).add(gravity.mul(this.gravityScale))

        // Integrate position
        this.velocity = this.velocity.add(acceleration.mul(delta))
        this.position = this.position.add(this.velocity.mul(delta))

        // Integrate angle
        this.rotation += this.torque * this.inertia * delta
        this.angle += this.rotation * delta
    }

    private staticUpdate()
    {
        this.position = this.entity.position.cast()
        this.angle = this.entity.rotation.euler.z
    }

    public getBounds(): Bounds { return this.shape.getBounds(this) }

    private lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
    public override update(alpha: number)
    {
        if (this.type === BodyType.Static) return
        
        // Interpolate position
        let position = Vector2.lerp(this.previousPosition, this.position, alpha)
 
        this.entity.position = position.cast(this.entity.position.z)
        this.entity.rotation = Quaternion.rotate(this.lerp(this.previousAngle, this.angle, alpha))
    }

    public debug(c: CanvasRenderingContext2D)
    {
        // Apply transformations
        c.save()
        c.translate(this.entity.position.x, this.entity.position.y)
        c.rotate(this.entity.rotation.euler.z)

        this.shape.render(c)
        c.restore()
    }

}
