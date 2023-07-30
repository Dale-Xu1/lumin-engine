import Vector2 from "../../math/Vector2"
import type Body from "./Body"
import type Shape from "./Shape"

const SLOP = 0

export default class Manifold
{

    public readonly a: Body<Shape>
    public readonly b: Body<Shape>

    public readonly contacts: Vector2[]
    public readonly normal: Vector2

    public readonly penetration: number


    public constructor(a: Body<Shape>, b: Body<Shape>, contacts: Vector2[], normal: Vector2, penetration: number)
    {
        this.a = a
        this.b = b

        this.contacts = contacts
        this.normal = normal

        this.penetration = penetration
    }


    public resolve(rate: number)
    {
        this.correctPositions(rate)
        if (this.penetration < SLOP) return

        for (let contact of this.contacts) this.applyImpulse(contact)
    }

    private correctPositions(rate: number)
    {
        // Distribute correction based on masses
        let total = this.a.mass + this.b.mass
        let correction = Math.max(this.penetration - SLOP, 0) / total * rate

        this.a.position = this.a.position.sub(this.normal.mul(correction * this.a.mass))
        this.b.position = this.b.position.add(this.normal.mul(correction * this.b.mass))
    }


    private calculateContact(start: Vector2): [Vector2, Vector2]
    {
        let end = start.add(this.normal.mul(this.penetration))
        let total = this.a.mass + this.b.mass

        // Calculate contact point based on masses
        let r2 = start.mul(this.b.mass / total).add(end.mul(this.a.mass / total))
        let r1 = r2.add(this.b.position.sub(this.a.position))

        return [r1, r2]
    }

    private relativeVelocity(r1: Vector2, r2: Vector2): Vector2
    {
        let v1 = this.a.velocity.add(new Vector2(-r1.y * this.a.rotation, r1.x * this.a.rotation))
        let v2 = this.b.velocity.add(new Vector2(-r2.y * this.b.rotation, r2.x * this.b.rotation))
        return v2.sub(v1)
    }

    private applyImpulse(start: Vector2)
    {
        let [r1, r2] = this.calculateContact(start)

        let normal = this.normal
        let rn = r1.cross(normal) ** 2 * this.a.inertia + r2.cross(normal) ** 2 * this.b.inertia
        let share = 1 / ((this.a.mass + this.b.mass + rn) * this.contacts.length)

        // Calculate normal velocity
        let rv = this.relativeVelocity(r1, r2)
        let normalVelocity = rv.dot(normal)

        if (normalVelocity > 0) return [] // Bodies are moving apart

        // Calculate impulse in normal direction
        let restitution = Math.min(this.a.restitution, this.b.restitution)
        let jn = -(1 + restitution) * normalVelocity * share

        let normalImpulse = normal.mul(jn)

        this.a.applyImpulse(normalImpulse.neg(), r1)
        this.b.applyImpulse(normalImpulse, r2)

        // Calculate impulse in tangent direction
        rv = this.relativeVelocity(r1, r2) // Recalculate relative velocity
        let tangent = rv.sub(normal.mul(rv.dot(normal))).normalize()
        let jt = -rv.dot(tangent) * share

        // Coulomb's Law
        let friction = (this.a.friction + this.b.friction) / 2
        let staticFriction = (this.a.staticFriction + this.b.staticFriction) / 2

        let tangentImpulse: Vector2
        if (Math.abs(jt) < jn * staticFriction) tangentImpulse = tangent.mul(jt)
        else tangentImpulse = tangent.mul(-jn * friction)

        this.a.applyImpulse(tangentImpulse.neg(), r1)
        this.b.applyImpulse(tangentImpulse, r2)
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
