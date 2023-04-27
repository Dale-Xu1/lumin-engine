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

    public cross(v: Vector2): number
    public cross(v: number): Vector2
    public cross(v: unknown)
    {
        if (v instanceof Vector2) return this.x * v.y - this.y * v.x
        else if (typeof v === "number") return new Vector2(-this.y * v, this.x * v)
    }

    public length(): number { return Math.sqrt(this.dot(this)) }
    public normalize(): Vector2
    {
        let len = this.length()
        if (len === 0) return this

        return this.div(len)
    }

}
