export class Vector2
{

    public static readonly ZERO:  Vector2 = new Vector2( 0,  0)

    public static readonly UP:    Vector2 = new Vector2( 0,  1)
    public static readonly DOWN:  Vector2 = new Vector2( 0, -1)
    public static readonly LEFT:  Vector2 = new Vector2(-1,  0)
    public static readonly RIGHT: Vector2 = new Vector2( 1,  0)

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

    public perpendicular(): Vector2 { return new Vector2(this.y, -this.x) }
    public cast(z: number = 0): Vector3 { return new Vector3(this.x, this.y, z) }

}

export class Vector3
{

    public static readonly ZERO:    Vector3 = new Vector3( 0,  0,  0)

    public static readonly UP:      Vector3 = new Vector3( 0,  1,  0)
    public static readonly DOWN:    Vector3 = new Vector3( 0, -1,  0)
    public static readonly LEFT:    Vector3 = new Vector3(-1,  0,  0)
    public static readonly RIGHT:   Vector3 = new Vector3( 1,  0,  0)
    public static readonly FORWARD: Vector3 = new Vector3( 0,  0,  1)
    public static readonly BACK:    Vector3 = new Vector3( 0,  0, -1)

    public static lerp(a: Vector3, b: Vector3, t: number): Vector3 { return a.add(b.sub(a).mul(t)) }

    public readonly x: number
    public readonly y: number
    public readonly z: number

    public constructor(x: number, y: number, z: number)
    {
        this.x = x
        this.y = y
        this.z = z
    } 

    public add(v: Vector3): Vector3 { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z) }
    public sub(v: Vector3): Vector3 { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z) }

    public mul(v: number): Vector3 { return new Vector3(this.x * v, this.y * v, this.z * v) }
    public div(v: number): Vector3 { return new Vector3(this.x / v, this.y / v, this.z / v) }
    public neg(): Vector3 { return new Vector3(-this.x, -this.y, -this.z) }

    public dot(v: Vector3): number { return this.x * v.x + this.y * v.y + this.z * v.z }
    public cross(v: Vector3): Vector3
    {
        return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x)
    }

    public get length(): number { return Math.sqrt(this.lengthSq) }
    public get lengthSq(): number { return this.x * this.x + this.y * this.y + this.z * this.z }

    public normalize(): Vector3
    {
        let len = this.lengthSq
        if (len === 0) return this

        return this.div(this.length)
    }

    public cast(): Vector2 { return new Vector2(this.x, this.y) }

}

export class Matrix2
{

    public static ZERO:     Matrix2 = new Matrix2(0, 0, 0, 0)
    public static IDENTITY: Matrix2 = new Matrix2(1, 0, 0, 1)

    public static rotate(angle: number): Matrix2
    {
        let cos = Math.cos(angle)
        let sin = Math.sin(angle)

        return new Matrix2(cos, -sin, sin, cos)
    }

    public static scale(scale: number): Matrix2 { return new Matrix2(scale, 0, 0, scale) }

    public readonly a: number
    public readonly b: number
    public readonly c: number
    public readonly d: number

    public constructor(a: number, b: number, c: number, d: number)
    {
        this.a = a
        this.b = b
        this.c = c
        this.d = d
    }


    public matMul(m: Matrix2): Matrix2
    {
        let a = this.a * m.a + this.b * m.c
        let b = this.a * m.b + this.b * m.d
        let c = this.c * m.a + this.d * m.c
        let d = this.c * m.b + this.d * m.d

        return new Matrix2(a, b, c, d)
    }

    public mul(v: Vector2): Vector2
    {
        let x = this.a * v.x + this.b * v.y
        let y = this.c * v.x + this.d * v.y

        return new Vector2(x, y)
    }

    public transpose(): Matrix2 { return new Matrix2(this.a, this.c, this.b, this.d) }
    public inverse(): Matrix2
    {
        let det = 1 / (this.a * this.d - this.b * this.c)
        return new Matrix2(det * this.d, -det * this.b, -det * this.c, det * this.a) 
    }

}

// TODO: Matrix4
export class Matrix4
{



}
