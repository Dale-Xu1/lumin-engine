import { Vector2 } from "../Math"
import type RigidBody from "./RigidBody"
import type Shape from "./Shape"

const BIAS_FACTOR = 0.2
const SLOP = 0.01

export default class Manifold
{

    public readonly a: RigidBody<Shape>
    public readonly b: RigidBody<Shape>

    public readonly contacts: Vector2[]
    public readonly normal: Vector2

    public readonly penetration: number


    public constructor(a: RigidBody<Shape>, b: RigidBody<Shape>, contacts: Vector2[], normal: Vector2, penetration: number)
    {
        this.a = a
        this.b = b

        this.contacts = contacts
        this.normal = normal

        this.penetration = penetration
    }


    public resolve(delta: number) { for (let contact of this.contacts) this.applyImpulse(contact, delta) }
    private applyImpulse(start: Vector2, delta: number)
    {
        if (this.penetration < SLOP) return
        let [r1, r2] = this.calculateContact(start)

        let normal = this.normal
        let rn = r1.cross(normal) ** 2 * this.a.invInertia + r2.cross(normal) ** 2 * this.b.invInertia
        let share = 1 / ((this.a.invMass + this.b.invMass + rn) * this.contacts.length)

        let rv = this.relativeVelocity(r1, r2)

        // Calculate normal velocity
        let bias = BIAS_FACTOR / delta * (this.penetration - SLOP)
        let normalVelocity = -rv.dot(normal) + bias

        if (normalVelocity < 0) return // Bodies are moving apart

        // Calculate impulse in normal direction
        let restitution = Math.min(this.a.restitution, this.b.restitution)
        let jn = (1 + restitution) * normalVelocity * share

        let normalImpulse = normal.mul(jn)

        this.a.applyImpulse(normalImpulse.neg(), r1)
        this.b.applyImpulse(normalImpulse, r2)

        rv = this.relativeVelocity(r1, r2) // Recalculate relative velocity

        // Calculate impulse in tangent direction
        let tangent = rv.sub(normal.mul(rv.dot(normal))).normalize()
        let jt = -rv.dot(tangent) * share

        // Coulomb's Law
        let friction = (this.a.kineticFriction + this.b.kineticFriction) / 2
        let staticFriction = (this.a.staticFriction + this.b.staticFriction) / 2

        let tangentImpulse: Vector2
        if (Math.abs(jt) < jn * staticFriction) tangentImpulse = tangent.mul(jt)
        else tangentImpulse = tangent.mul(-jn * friction)

        this.a.applyImpulse(tangentImpulse.neg(), r1)
        this.b.applyImpulse(tangentImpulse, r2)
    }

    private calculateContact(start: Vector2): [Vector2, Vector2]
    {
        let end = start.add(this.normal.mul(this.penetration))
        let total = this.a.invMass + this.b.invMass

        // Calculate contact point based on masses
        let r2 = start.mul(this.b.invMass / total).add(end.mul(this.a.invMass / total))
        let r1 = r2.add(this.b.position.sub(this.a.position))

        return [r1, r2]
    }

    private relativeVelocity(r1: Vector2, r2: Vector2): Vector2
    {
        let v1 = this.a.velocity.add(new Vector2(-r1.y * this.a.angularVelocity, r1.x * this.a.angularVelocity))
        let v2 = this.b.velocity.add(new Vector2(-r2.y * this.b.angularVelocity, r2.x * this.b.angularVelocity))
        return v2.sub(v1)
    }


    public render(c: CanvasRenderingContext2D)
    {
        c.strokeStyle = "red"
        c.fillStyle = "green"
        c.strokeWidth = 1

        // Render contact normal
        let average = Vector2.ZERO
        for (let contact of this.contacts) average = average.add(contact)

        let penetration = Math.max(this.penetration, 0.1)

        let u = this.b.position.add(average.div(this.contacts.length))
        let v = u.add(this.normal.mul(penetration))

        c.beginPath()
        c.moveTo(u.x, u.y)
        c.lineTo(v.x, v.y)
        c.stroke()

        // Render contacts
        for (let contact of this.contacts)
        {
            let u = this.b.position.add(contact)

            c.beginPath()
            c.arc(u.x, u.y, 0.05, 0, Math.PI * 2)
            c.fill()
        }
    }

}
