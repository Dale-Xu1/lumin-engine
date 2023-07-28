import Vector2 from "../math/Vector2"
import type Body from "./Body"

export default abstract class Shape
{

    public static testBounds(a: Body<Shape>, b: Body<Shape>): boolean
    {
        let distSq = a.position.sub(b.position).lengthSq
        let radius = a.shape.bound + b.shape.bound

        return distSq <= radius * radius
    }

    protected constructor(protected readonly density: number, private readonly bound: number) { }


    public abstract calculate(): [number, number]
    public abstract render(c: CanvasRenderingContext2D): void

}


export class Circle extends Shape
{

    public radius: number

    public constructor(radius: number, density: number = 1)
    {
        super(density, radius)
        this.radius = radius
    }


    public override calculate(): [number, number]
    {
        let rs = this.radius ** 2

        let mass = Math.PI * rs * this.density
        let inertia = mass * rs / 2

        return [mass, inertia]
    }

    public override render(c: CanvasRenderingContext2D)
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

export class Polygon extends Shape
{

    public readonly vertices: Vector2[]
    public readonly normals: Vector2[] = []


    public constructor(vertices: Vector2[], density: number = 1)
    {
        let max = 0
        for (let vertex of vertices)
        {
            let len = vertex.lengthSq
            if (len > max) max = len
        }
        super(density, Math.sqrt(max))

        // Calculate normals
        this.vertices = vertices
        for (let i = 0; i < vertices.length; i++)
        {
            let [a, b] = Vector2.pair(vertices, i)

            // Get perpendicular vector
            let direction = b.sub(a)
            this.normals[i] = new Vector2(direction.y, -direction.x).normalize()
        }
    }


    public override calculate(): [number, number]
    {
        let total = 0
        let area = 0, moment = 0

        for (let i = 0; i < this.vertices.length; i++)
        {
            let [a, b] = Vector2.pair(this.vertices, i)

            // Split polygon into triangles made of origin and two vertices
            let cross = Math.abs(a.cross(b))
            total += cross

            // Sum area and inertia of individual triangles
            area += cross / 2
            moment += cross * (a.dot(a) + b.dot(b) + a.dot(b))
        }

        let mass = area * this.density
        let inertia = mass * moment / (6 * total)

        return [mass, inertia]
    }

    public override render(c: CanvasRenderingContext2D)
    {
        // Render normals
        c.strokeStyle = "blue"
        c.strokeWidth = 1

        for (let i = 0; i < this.vertices.length; i++)
        {
            let [a, b] = Vector2.pair(this.vertices, i)

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

    public readonly width: number
    public readonly height: number


    public constructor(width: number, height: number, density: number = 1)
    {
        let w = width / 2
        let h = height / 2

        super([new Vector2(w, h), new Vector2(-w, h), new Vector2(-w, -h), new Vector2(w, -h)], density)

        this.width = width
        this.height = height
    }


    public override calculate(): [number, number]
    {
        let mass = this.width * this.height * this.density
        let inertia = mass * (this.width ** 2 + this.height ** 2) / 12

        return [mass, inertia]
    }

}
