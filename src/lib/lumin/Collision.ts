import Vector2 from "../math/Vector2"
import type Body from "./Body"
import { BodyType } from "./Body"
import Manifold from "./Manifold"
import type Shape from "./Shape"
import { Circle, Polygon, Ray } from "./Shape"

export class Detector
{

    public constructor(private readonly bodies: Body<Shape>[]) { }

    public detect(): Manifold[]
    {
        let collisions: Manifold[] = []
        for (let [a, b] of this.broadPhase())
        {
            let collision = Collision.test(a, b)
            if (collision !== null) collisions.push(collision)
        }

        return collisions
    }

    private broadPhase(): [Body<Shape>, Body<Shape>][]
    {
        let pairs: [Body<Shape>, Body<Shape>][] = []

        // Sort bodies based on AABB minimum x coordinate
        let bounds = this.bodies.map(body => body.getBounds())
        bounds.sort((a, b) => a.min.x - b.min.x)

        for (let i = 0; i < bounds.length; i++)
        {
            let a = bounds[i]
            for (let j = i + 1; j < bounds.length; j++)
            {
                let b = bounds[j]

                if (b.min.x > a.max.x) break // No AABB further than this one will intersect either
                if (b.min.y > a.max.y || b.max.y < a.min.y ||
                    a.body.type === BodyType.Static && b.body.type === BodyType.Static) continue

                pairs.push([a.body, b.body])
            }
        }

        return pairs
    }

}

export class RayIntersection
{

    public constructor(public readonly body: Body<Shape>,
        public readonly position: Vector2, public readonly normal: Vector2,
        public readonly distance: number) { }

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
        let u = findAxis(a, b); if (u === null) return null
        let v = findAxis(b, a); if (v === null) return null

        let [i, penetration] = u[1] < v[1] ? u : ([a, b] = [b, a], v)
        let vertices = a.shape.transform.vertices
        let normals = a.shape.transform.normals

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

    function findAxis(a: Body<Polygon>, b: Body<Polygon>): [number, number] | null
    {
        let vertices = a.shape.transform.vertices
        let normals = a.shape.transform.normals

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

        return [index!, min]
    }

    function findSupport(a: Body<Polygon>, b: Body<Polygon>, face: Vector2, normal: Vector2): number | null
    {
        let vertices = b.shape.transform.vertices
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
        // Find normal on B that is most in the opposite direction as the normal of the reference face
        let normals = b.shape.transform.normals
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

        return Vector2.pair(b.shape.transform.vertices, index!)
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
        let vertices = a.shape.transform.vertices
        let normals = a.shape.transform.normals

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


    export function testPoint(body: Body<Shape>, point: Vector2): boolean
    {
        if (body.is(Circle)) return pointCircle(body, point)
        if (body.is(Polygon)) return pointPolygon(body, point)

        return false
    }

    export function pointCircle(circle: Body<Circle>, point: Vector2): boolean
    {
        let distSq = point.sub(circle.position).lengthSq
        let radius = circle.shape.radius

        return distSq < radius * radius
    }

    export function pointPolygon(polygon: Body<Polygon>, point: Vector2): boolean
    {
        let vertices = polygon.shape.transform.vertices
        let normals = polygon.shape.transform.normals

        // Test if point is behind all faces of polygon
        let relative = point.sub(polygon.position)
        for (let i = 0; i < vertices.length; i++)
        {
            let projected = relative.sub(vertices[i]).dot(normals[i])
            if (projected >= 0) return false
        }

        return true
    }


    export function testRay(body: Body<Shape>, ray: Ray): RayIntersection | null
    {
        if (body.is(Circle)) return rayCircle(body, ray)
        if (body.is(Polygon)) return rayPolygon(body, ray)

        return null
    }

    export function rayCircle(circle: Body<Circle>, ray: Ray): RayIntersection | null
    {
        return null
    }

    export function rayPolygon(polygon: Body<Polygon>, ray: Ray): RayIntersection | null
    {
        return null
    }

}
export default Collision
