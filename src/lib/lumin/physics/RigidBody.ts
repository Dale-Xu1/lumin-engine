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

    kineticFriction?: number
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
    public angularVelocity: number = 0
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
    public invMass!: number

    public inertia!: number
    public invInertia!: number

    public kineticFriction: number
    public staticFriction: number

    public gravityScale: number

    public constructor(public readonly shape: T,
    {
        type = BodyType.Dynamic,
        density = 1, restitution = 0.2,
        kineticFriction = 0.3, staticFriction = 0.5,
        gravityScale = 1
    }: BodyParams = {})
    {
        super()
        this.shape = shape
        this.type = type

        this.density = density
        this.restitution = restitution

        this.kineticFriction = kineticFriction
        this.staticFriction = staticFriction

        this.gravityScale = gravityScale
        this.shape.update(this)
    }

    private calculateMass()
    {
        if (this.type === BodyType.Dynamic)
        {
            [this.mass, this.inertia] = this.shape.calculate(this.density)

            this.invMass = 1 / this.mass // Store inverse because multiplication is faster
            this.invInertia = 1 / this.inertia
        }
        else // Static bodies are given infinite mass
        {
            this.invMass = 0
            this.invInertia = 0
        }
    }


    public is<T extends Shape>(shape: Constructor<T>): this is RigidBody<T> { return this.shape instanceof shape }
    public override init()
    {
        this.position = this.previousPosition = this.entity.position
        this.angle = this.previousAngle = this.entity.rotation

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
        this.velocity = this.velocity.add(impulse.mul(this.invMass))
        this.angularVelocity += contact.cross(impulse) * this.invInertia
    }

    private previousPosition!: Vector2 // Previous data is kept for interpolation
    private previousAngle!: number

    public integrate(delta: number, gravity: Vector2)
    {
        this.previousPosition = this.position
        this.previousAngle = this.angle

        if (this.type === BodyType.Dynamic) this.dynamicUpdate(delta, gravity)
        else this.staticUpdate()

        // Clear forces and torque
        this.force = Vector2.ZERO
        this.torque = 0

        this.shape.update(this)
    }

    private dynamicUpdate(delta: number, gravity: Vector2)
    {
        // Integrate position
        let acceleration = this.force.mul(this.invMass).add(gravity.mul(this.gravityScale))
        this.velocity = this.velocity.add(acceleration.mul(delta))
        this.position = this.position.add(this.velocity.mul(delta))

        // Integrate angle
        let angularAcceleration = this.torque * this.invInertia
        this.angularVelocity += angularAcceleration * delta
        this.angle += this.angularVelocity * delta
    }

    private staticUpdate()
    {
        this.position = this.entity.position
        this.angle = this.entity.rotation
    }

    public getBounds(): Bounds { return this.shape.getBounds(this) }

    private lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
    public override update(alpha: number)
    {
        if (this.type === BodyType.Static) return
        
        // Interpolate position
        this.entity.position = Vector2.lerp(this.previousPosition, this.position, alpha)
        this.entity.rotation = this.lerp(this.previousAngle, this.angle, alpha)
    }

    public render(c: CanvasRenderingContext2D) { if (this.scene.physics.debug) this.shape.render(c) }

}
