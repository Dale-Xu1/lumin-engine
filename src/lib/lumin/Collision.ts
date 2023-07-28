import Vector2 from "../math/Vector2"
import type Body from "./Body"
import type Shape from "./Shape"
import { Circle, Polygon } from "./Shape"

const SLOP = 0.01

export class Manifold
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

    private applyImpulse(start: Vector2)
    {
        let [r1, r2] = this.calculateContact(start)

        let normal = this.normal
        let rn = r1.cross(normal) ** 2 * this.a.inertia + r2.cross(normal) ** 2 * this.b.inertia
        let share = 1 / ((this.a.mass + this.b.mass + rn) * this.contacts.length)

        // Calculate relative velocity
        let v1 = this.a.velocity.add(new Vector2(-r1.y * this.a.rotation, r1.x * this.a.rotation))
        let v2 = this.b.velocity.add(new Vector2(-r2.y * this.b.rotation, r2.x * this.b.rotation))
        let rv = v2.sub(v1)

        // Calculate normal velocity
        let normalVelocity = rv.dot(normal)
        if (normalVelocity > 0) return [] // Bodies are moving apart

        // Calculate impulse in normal direction
        let restitution = Math.min(this.a.restitution, this.b.restitution)
        let jn = -(1 + restitution) * normalVelocity * share

        let normalImpulse = normal.mul(jn)

        this.a.applyImpulse(normalImpulse.neg(), r1)
        this.b.applyImpulse(normalImpulse, r2)

        // Recalculate relative velocity
        v1 = this.a.velocity.add(new Vector2(-r1.y * this.a.rotation, r1.x * this.a.rotation))
        v2 = this.b.velocity.add(new Vector2(-r2.y * this.b.rotation, r2.x * this.b.rotation))
        rv = v2.sub(v1)

        // Calculate impulse in tangent direction
        let tangent = rv.sub(normal.mul(rv.dot(normal))).normalize()
        let jt = -rv.dot(tangent) * share

        // Colummb's Law
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

namespace Collision
{

    export function test(a: Body<Shape>, b: Body<Shape>): Manifold | null
    {
        if (a.is(Circle) && b.is(Circle)) return circleCircle(a, b)
        if (a.is(Circle) && b.is(Polygon)) return polygonCircle(b, a)
        if (a.is(Polygon) && b.is(Circle)) return polygonCircle(a, b)
        if (a.is(Polygon) && b.is(Polygon)) return polygonPolygon(a, b)

        return null
    }

    export function circleCircle(a: Body<Circle>, b: Body<Circle>): Manifold | null
    {
        let radius = b.shape.radius
        let total = a.shape.radius + radius

        // Calculate distance
        let direction = b.position.sub(a.position)
        let distSq = direction.lengthSq

        // Exit if circles don't intersect
        if (distSq >= total * total) return null
        let dist = direction.length

        let normal = dist > 0 ? direction.normalize() : Vector2.RIGHT // Arbitrary vector if positions are the same
        let penetration = total - dist

        let contact = normal.mul(-radius)
        return new Manifold(a, b, [contact], normal, penetration)
    }


    export function polygonPolygon(a: Body<Polygon>, b: Body<Polygon>): Manifold | null
    {
        // Find axis of least penetration
        let u = findAxis(a, b)
        if (u === null) return null

        let v = findAxis(b, a)
        if (v === null) return null

        let [i, penetration, [vertices, normals]] = u[1] < v[1] ? u : ([a, b] = [b, a], v)

        // Index i refers to the reference face on polygon A
        let normal = normals[i]
        let offset = a.position.sub(b.position)

        let [r1, r2] = Vector2.pair(vertices, i).map(v => v.add(offset))
        let [i1, i2] = findIncident(b, normal)

        // Clip incident face onto reference face
        let right = new Vector2(normal.y, -normal.x)
        let left = right.neg();

        [i1, i2] = clip(r2, left, i1, i2), [i2, i1] = clip(r1, right, i2, i1)
        let contacts: Vector2[] = []

        // Calculate penetration
        let p1 = -i1.sub(r1).dot(normal)
        let p2 = -i2.sub(r1).dot(normal)

        if (p1 > 0) contacts.push(i1)
        if (p2 > 0) contacts.push(i2)
        if (contacts.length === 2) penetration = (p1 + p2) / 2

        return new Manifold(a, b, contacts, normal, penetration)
    }

    function findAxis(a: Body<Polygon>, b: Body<Polygon>): [number, number, [Vector2[], Vector2[]]] | null
    {
        // Apply rotation to vertices and normals
        let vertices = a.shape.vertices.map(vertex => vertex.rotate(a.angle))
        let normals = a.shape.normals.map(normal => normal.rotate(a.angle))

        let index: number, min = Infinity
        for (let i = 0; i < vertices.length; i++)
        {
            let penetration = findSupport(a, b, vertices[i], normals[i])
            if (penetration === null) return null

            // Select axis with least penetration
            if (penetration < min)
            {
                min = penetration
                index = i
            }
        }

        return [index!, min, [vertices, normals]]
    }

    function findSupport(a: Body<Polygon>, b: Body<Polygon>, face: Vector2, normal: Vector2): number | null
    {
        let vertices = b.shape.vertices.map(vertex => vertex.rotate(b.angle))
        let offset = b.position.sub(a.position)

        let max: number | null = null
        for (let vertex of vertices)
        {
            // Track distance of point furthest behind face
            let relative = vertex.add(offset).sub(face)
            let projected = -relative.dot(normal)

            // Limit to only vertices behind face
            if (projected > 0 && (max === null || projected > max)) max = projected
        }

        return max
    }

    function findIncident(b: Body<Polygon>, normal: Vector2): [Vector2, Vector2]
    {
        let normals = b.shape.normals.map(normal => normal.rotate(b.angle))

        // Find normal on B that is most in the opposite direction as the normal of the reference face
        let index: number, min = Infinity
        for (let i = 0; i < normals.length; i++)
        {
            let compare = normal.dot(normals[i])
            if (compare < min)
            {
                min = compare
                index = i
            }
        }

        return Vector2.pair(b.shape.vertices, index!).map(v => v.rotate(b.angle)) as [Vector2, Vector2]
    }

    function clip(vertex: Vector2, direction: Vector2, i1: Vector2, i2: Vector2): [Vector2, Vector2]
    {
        let d1 = i1.sub(vertex).dot(direction)
        let d2 = i2.sub(vertex).dot(direction)

        if (d1 * d2 > 0) return [i1, i2]
        let alpha = d1 / (d1 - d2)

        return [Vector2.lerp(i1, i2, alpha), i2]
    }


    export function polygonCircle(a: Body<Polygon>, b: Body<Circle>): Manifold | null
    {
        // Apply rotation to vertices and normals
        let vertices = a.shape.vertices.map(vertex => vertex.rotate(a.angle))
        let normals = a.shape.normals.map(normal => normal.rotate(a.angle))

        // Find axis of least penetration
        let edge = findEdge(a, b, vertices, normals)

        if (edge === null) return null
        let [i, penetration] = edge

        let radius = b.shape.radius
        let center = b.position.sub(a.position)

        let [right, left] = Vector2.pair(vertices, i).map(v => center.sub(v))

        // Test if circle is in corner regions
        let normal = normals[i]
        if (normal.cross(left) > 0) return corner(a, b, left)
        else if (normal.cross(right) < 0) return corner(a, b, right)

        let contact = normal.mul(-radius)
        return new Manifold(a, b, [contact], normal, penetration)
    }

    function findEdge(a: Body<Polygon>, b: Body<Circle>,
        vertices: Vector2[], normals: Vector2[]): [number, number] | null
    {
        let radius = b.shape.radius
        let center = b.position.sub(a.position)

        let index: number, min = Infinity
        for (let i = 0; i < vertices.length; i++)
        {
            let vertex = vertices[i]
            let normal = normals[i]

            let projected = center.sub(vertex).dot(normal) // Project center of circle along normal
            if (projected >= radius) return null

            // Select axis with least penetration
            let penetration = radius - projected
            if (penetration < min)
            {
                min = penetration
                index = i
            }
        }

        return [index!, min]
    }

    function corner(a: Body<Polygon>, b: Body<Circle>, vertex: Vector2): Manifold | null
    {
        let radius = b.shape.radius
        let distSq = vertex.lengthSq

        if (distSq >= radius * radius) return null
        let dist = vertex.length

        let normal = vertex.div(dist)
        let penetration = radius - dist

        let contact = normal.mul(-radius)
        return new Manifold(a, b, [contact], normal, penetration)
    }

}
export default Collision
