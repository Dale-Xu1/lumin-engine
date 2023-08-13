import { Matrix2, Vector2 } from "../Math"
import type RigidBody from "./RigidBody"

export default interface Shape
{

    calculate(density: number): [number, number]

    getBounds(body: RigidBody<this>): Bounds

    update(body: RigidBody<this>): void
    render(c: CanvasRenderingContext2D): void

}

export class Bounds
{

    public constructor(public readonly body: RigidBody<Shape>,
        public readonly min: Vector2, public readonly max: Vector2) { }

}

export class Circle implements Shape
{

    public constructor(public readonly radius: number) { }


    public calculate(density: number): [number, number]
    {
        let rs = this.radius ** 2

        let mass = Math.PI * rs * density
        let inertia = mass * rs / 2

        return [mass, inertia]
    }

    public getBounds(body: RigidBody<this>): Bounds
    {
        let r = new Vector2(this.radius, this.radius)
        return new Bounds(body, body.position.sub(r), body.position.add(r))
    }

    public update(body: RigidBody<this>) { }
    public render(c: CanvasRenderingContext2D)
    {
        c.strokeStyle = "blue"
        c.strokeWidth = 1

        // Line shows angle
        c.beginPath()
        c.moveTo(0, 0)
        c.lineTo(this.radius, 0)
        c.stroke()

        // Draw circle
        c.strokeStyle = "black"
        c.beginPath()
        c.arc(0, 0, this.radius, 0, Math.PI * 2)
        c.stroke()
    }

}

export class TransformedPolygon
{

    public constructor(public readonly vertices: Vector2[], public readonly normals: Vector2[] = []) { }

}

export class Polygon implements Shape
{

    public static pair(array: Vector2[], i: number): [Vector2, Vector2]
    {
        return [array[i], array[(i + 1) % array.length]]
    }

    public readonly normals: Vector2[] = []
    public transform!: TransformedPolygon

    public constructor(public readonly vertices: Vector2[])
    {
        // Calculate normals
        this.vertices = vertices
        for (let i = 0; i < vertices.length; i++)
        {
            let [a, b] = Polygon.pair(vertices, i)

            // Get perpendicular vector
            let direction = b.sub(a)
            let normal = direction.perpendicular().normalize()
            this.normals[i] = normal

            // Test if polygon is concave
            let c = vertices[(i + 2) % vertices.length]
            if (c.sub(b).dot(normal) > 0) throw new Error("Polygon cannot be concave")
        }
    }


    public calculate(density: number): [number, number]
    {
        let total = 0
        let area = 0, moment = 0

        for (let i = 0; i < this.vertices.length; i++)
        {
            let [a, b] = Polygon.pair(this.vertices, i)

            // Split polygon into triangles made of origin and two vertices
            let cross = Math.abs(a.cross(b))
            total += cross

            // Sum area and inertia of individual triangles
            area += cross / 2
            moment += cross * (a.dot(a) + b.dot(b) + a.dot(b))
        }

        let mass = area * density
        let inertia = mass * moment / (6 * total)

        return [mass, inertia]
    }

    public getBounds(body: RigidBody<this>): Bounds
    {
        // Compute AABB for polygon
        let minX = Infinity, minY = Infinity
        let maxX = -Infinity, maxY = -Infinity

        for (let vertex of this.transform.vertices)
        {
            if (vertex.x > maxX) maxX = vertex.x
            if (vertex.x < minX) minX = vertex.x
            if (vertex.y > maxY) maxY = vertex.y
            if (vertex.y < minY) minY = vertex.y
        }

        let min = new Vector2(minX, minY)
        let max = new Vector2(maxX, maxY)

        return new Bounds(body, body.position.add(min), body.position.add(max))
    }

    public update(body: RigidBody<this>)
    {
        let rotate = Matrix2.rotate(body.angle)
        let vertices = this.vertices.map(vertex => rotate.vmul(vertex))
        let normals = this.normals.map(normal => rotate.vmul(normal))

        this.transform = new TransformedPolygon(vertices, normals)
    }

    public render(c: CanvasRenderingContext2D)
    {
        // Render normals
        c.strokeStyle = "blue"
        c.strokeWidth = 1

        for (let i = 0; i < this.vertices.length; i++)
        {
            let [a, b] = Polygon.pair(this.vertices, i)

            let u = a.add(b).div(2)
            let v = u.add(this.normals[i].mul(0.1))

            c.beginPath()
            c.moveTo(u.x, u.y)
            c.lineTo(v.x, v.y)
            c.stroke()
        }

        // Draw polygon
        c.strokeStyle = "black"
        c.beginPath()
        for (let vertex of this.vertices) c.lineTo(vertex.x, vertex.y)

        c.closePath()
        c.stroke()
    }

}

export class Rectangle extends Polygon
{

    public constructor(public readonly width: number, public readonly height: number)
    {
        let w = width / 2
        let h = height / 2

        super([new Vector2(w, h), new Vector2(-w, h), new Vector2(-w, -h), new Vector2(w, -h)])

        this.width = width
        this.height = height
    }


    public override calculate(density: number): [number, number]
    {
        let mass = this.width * this.height * density
        let inertia = mass * (this.width ** 2 + this.height ** 2) / 12

        return [mass, inertia]
    }

}

export class Ray
{

    public constructor(public readonly position: Vector2, public readonly direction: Vector2) { }

}
