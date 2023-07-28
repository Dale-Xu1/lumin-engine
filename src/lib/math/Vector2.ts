export default class Vector2
{

    public static readonly ZERO: Vector2 = new Vector2(0, 0)

    public static readonly UP: Vector2 = new Vector2(0, 1)
    public static readonly DOWN: Vector2 = new Vector2(0, -1)
    public static readonly LEFT: Vector2 = new Vector2(-1, 0)
    public static readonly RIGHT: Vector2 = new Vector2(1, 0)

    public static lerp(a: Vector2, b: Vector2, t: number): Vector2 { return a.add(b.sub(a).mul(t)) }


    public readonly x: number
    public readonly y: number

    public constructor(x: number, y: number)
    {
        this.x = x
        this.y = y
    }


    public add(v: Vector2): Vector2 { return new Vector2(this.x + v.x, this.y + v.y) }
    public sub(v: Vector2): Vector2 { return new Vector2(this.x - v.x, this.y - v.y) }

    public mul(v: number): Vector2 { return new Vector2(this.x * v, this.y * v) }
    public div(v: number): Vector2 { return new Vector2(this.x / v, this.y / v) }
    public neg(): Vector2 { return new Vector2(-this.x, -this.y) }

    public dot(v: Vector2): number { return this.x * v.x + this.y * v.y }
    public cross(v: Vector2): number { return this.x * v.y - this.y * v.x }

    public get length(): number { return Math.sqrt(this.lengthSq) }
    public get lengthSq(): number { return this.x * this.x + this.y * this.y }

    public normalize(): Vector2
    {
        let len = this.lengthSq
        if (len === 0) return this

        return this.div(this.length)
    }

    public rotate(a: number): Vector2
    {
        return new Vector2(
            this.x * Math.cos(a) - this.y * Math.sin(a),
            this.x * Math.sin(a) + this.y * Math.cos(a)
        )
    }

}
