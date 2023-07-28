import Vector2 from "../math/Vector2"
import type Body from "./Body"

export class Bounds
{

    public constructor(public readonly body: Body<Shape>,
        public readonly min: Vector2, public readonly max: Vector2) { }

}

export default abstract class Shape
{

    protected constructor(protected readonly density: number) { }


    public abstract calculate(): [number, number]

    public abstract getBounds(body: Body<this>): Bounds

    public update(body: Body<this>) { }
    public abstract render(c: CanvasRenderingContext2D): void

}

export class Circle extends Shape
{

    public constructor(public readonly radius: number, density: number = 1) { super(density) }


    public override calculate(): [number, number]
    {
        let rs = this.radius ** 2

        let mass = Math.PI * rs * this.density
        let inertia = mass * rs / 2

        return [mass, inertia]
    }

    public override getBounds(body: Body<this>): Bounds
    {
        let r = new Vector2(this.radius, this.radius)
        return new Bounds(body, body.position.sub(r), body.position.add(r))
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

export class Transform
{

    public constructor(public readonly vertices: Vector2[], public readonly normals: Vector2[] = []) { }

}

export class Polygon extends Shape
{

    public readonly normals: Vector2[] = []
    public transform!: Transform

    public constructor(public readonly vertices: Vector2[], density: number = 1)
    {
        super(density)

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

    public override getBounds(body: Body<this>): Bounds
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

    public override update(body: Body<this>)
    {
        let vertices = this.vertices.map(vertex => vertex.rotate(body.angle))
        let normals = this.normals.map(normal => normal.rotate(body.angle))

        this.transform = new Transform(vertices, normals)
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

    public constructor(public readonly width: number, public readonly height: number, density: number = 1)
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
