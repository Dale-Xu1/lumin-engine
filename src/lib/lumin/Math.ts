export class Vector2
{

    public static readonly ZERO:  Vector2 = new Vector2( 0,  0)
    public static readonly ONE:   Vector2 = new Vector2( 1,  1)

    public static readonly UP:    Vector2 = new Vector2( 0,  1)
    public static readonly DOWN:  Vector2 = new Vector2( 0, -1)
    public static readonly LEFT:  Vector2 = new Vector2(-1,  0)
    public static readonly RIGHT: Vector2 = new Vector2( 1,  0)

    public static lerp(a: Vector2, b: Vector2, t: number): Vector2 { return a.mul(1 - t).add(b.mul(t)) }

    public constructor(public readonly x: number, public readonly y: number) { }


    public add(v: Vector2): Vector2 { return new Vector2(this.x + v.x, this.y + v.y) }
    public sub(v: Vector2): Vector2 { return new Vector2(this.x - v.x, this.y - v.y) }

    public mul(v: number): Vector2 { return new Vector2(this.x * v, this.y * v) }
    public div(v: number): Vector2 { return new Vector2(this.x / v, this.y / v) }
    public neg(): Vector2 { return new Vector2(-this.x, -this.y) }

    public dot(v: Vector2): number { return this.x * v.x + this.y * v.y }
    public cross(v: Vector2): number { return this.x * v.y - this.y * v.x }
    public orthogonal(): Vector2 { return new Vector2(this.y, -this.x) }

    public get length(): number { return Math.sqrt(this.lengthSq) }
    public get lengthSq(): number { return this.x * this.x + this.y * this.y }

    public normalize(): Vector2
    {
        let len = this.lengthSq
        if (len === 0) return this

        return this.div(Math.sqrt(len))
    }

    public perpendicular(): Vector2 { return new Vector2(this.y, -this.x) }

    public equals(v: Vector2): boolean { return this.x === v.x && this.y === v.y }
    public cast(z: number = 0): Vector3 { return new Vector3(this.x, this.y, z) }

}

export class Vector3
{

    public static readonly ZERO:    Vector3 = new Vector3( 0,  0,  0)
    public static readonly ONE:     Vector3 = new Vector3( 1,  1,  1)

    public static readonly UP:      Vector3 = new Vector3( 0,  1,  0)
    public static readonly DOWN:    Vector3 = new Vector3( 0, -1,  0)
    public static readonly LEFT:    Vector3 = new Vector3(-1,  0,  0)
    public static readonly RIGHT:   Vector3 = new Vector3( 1,  0,  0)
    public static readonly FORWARD: Vector3 = new Vector3( 0,  0,  1)
    public static readonly BACK:    Vector3 = new Vector3( 0,  0, -1)

    public static lerp(a: Vector3, b: Vector3, t: number): Vector3 { return a.mul(1 - t).add(b.mul(t)) }

    public constructor(public readonly x: number, public readonly y: number, public readonly z: number) { }


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

        return this.div(Math.sqrt(len))
    }

    public equals(v: Vector3): boolean { return this.x === v.x && this.y === v.y && this.z === v.z }
    public cast(): Vector2 { return new Vector2(this.x, this.y) }

}

export class Color4
{

    public static readonly BLACK: Color4 = new Color4(0, 0, 0, 1)
    public static readonly WHITE: Color4 = new Color4(1, 1, 1, 1)

    public static readonly RED:   Color4 = new Color4(1, 0, 0, 1)
    public static readonly GREEN: Color4 = new Color4(0, 1, 0, 1)
    public static readonly BLUE:  Color4 = new Color4(0, 0, 1, 1)

    public static lerp(a: Color4, b: Color4, t: number): Color4 { return a.mul(1 - t).add(b.mul(t)) }

    public constructor(public readonly r: number, public readonly g: number, public readonly b: number,
        public readonly a: number) { }


    public add(c: Color4): Color4 { return new Color4(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a) }
    public sub(c: Color4): Color4 { return new Color4(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a) }

    public mul(v: number): Color4 { return new Color4(this.r * v, this.g * v, this.b * v, this.a * v) }
    public div(v: number): Color4 { return new Color4(this.r / v, this.g / v, this.b / v, this.a / v) }

}

export class Quaternion
{

    public static readonly IDENTITY: Quaternion = new Quaternion(0, 0, 0, 1)

    public static rotate(a: number, axis: Vector3 = Vector3.FORWARD): Quaternion
    {
        let s = Math.sin(a / 2)
        return new Quaternion(s * axis.x, s * axis.y, s * axis.z, Math.cos(a / 2))
    }

    public static euler(x: number, y: number, z: number): Quaternion
    {
        let cx = Math.cos(x / 2)
        let sx = Math.sin(x / 2)
        let cy = Math.cos(y / 2)
        let sy = Math.sin(y / 2)
        let cz = Math.cos(z / 2)
        let sz = Math.sin(z / 2)

        let qx = sx * cy * cz - cx * sy * sz
        let qy = cx * sy * cz + sx * cy * sz
        let qz = cx * cy * sz - sx * sy * cz
        let qw = cx * cy * cz + sx * sy * sz

        return new Quaternion(qx, qy, qz, qw)
    }

    public static slerp(a: Quaternion, b: Quaternion, t: number): Quaternion
    {
        let c = a.dot(b)
        let p = Math.acos(c), s = Math.sqrt(1 - c * c)

        let ra = Math.sin((1 - t) * p) / s
        let rb = Math.sin(t * p) / s
        return a.scale(ra).add(b.scale(rb))
    }

    public constructor(public readonly x: number, public readonly y: number, public readonly z: number, public readonly w: number) { }


    public add(q: Quaternion): Quaternion { return new Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w) }
    public sub(q: Quaternion): Quaternion { return new Quaternion(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w) }

    public scale(v: number): Quaternion { return new Quaternion(this.x * v, this.y * v, this.z * v, this.w * v) }
    public div(v: number): Quaternion { return new Quaternion(this.x / v, this.y / v, this.z / v, this.w / v) }

    public dot(q: Quaternion): number { return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w }
    public mul(q: Quaternion): Quaternion
    {
        let x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y
        let y = this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z
        let z = this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x
        let w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z

        return new Quaternion(x, y, z, w)
    }

    public get length(): number { return Math.sqrt(this.lengthSq) }
    public get lengthSq(): number { return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w }

    public normalize(): Quaternion
    {
        let len = this.lengthSq
        if (len === 0) return this

        return this.div(Math.sqrt(len))
    }

    public inverse(): Quaternion { return new Quaternion(-this.x, -this.y, -this.z, this.w).div(this.lengthSq) }

    public equals(q: Quaternion): boolean { return this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w }
    public get euler(): Vector3
    {
        let sr = 2 * (this.w * this.x + this.y * this.z)
        let cr = 1 - 2 * (this.x * this.x + this.y * this.y)

        let sp = 2 * (this.w * this.y - this.x * this.z)
        if (sp > 1) sp = 1
        else if (sp < -1) sp = -1

        let sy = 2 * (this.w * this.z + this.x * this.y)
        let cy = 1 - 2 * (this.y * this.y + this.z * this.z)

        return new Vector3(Math.atan2(sr, cr), Math.asin(sp), Math.atan2(sy, cy))
    }

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

    public constructor(
        public readonly m00: number, public readonly m01: number,
        public readonly m10: number, public readonly m11: number) { }


    public mul(m: Matrix2): Matrix2
    {
        let a = this.m00 * m.m00 + this.m01 * m.m10
        let b = this.m00 * m.m01 + this.m01 * m.m11
        let c = this.m10 * m.m00 + this.m11 * m.m10
        let d = this.m10 * m.m01 + this.m11 * m.m11

        return new Matrix2(a, b, c, d)
    }

    public vmul(v: Vector2): Vector2
    {
        let x = this.m00 * v.x + this.m01 * v.y
        let y = this.m10 * v.x + this.m11 * v.y

        return new Vector2(x, y)
    }

    public transpose(): Matrix2 { return new Matrix2(this.m00, this.m10, this.m01, this.m11) }
    public inverse(): Matrix2
    {
        let det = 1 / (this.m00 * this.m11 - this.m01 * this.m10)
        return new Matrix2(det * this.m11, -det * this.m01, -det * this.m10, det * this.m00) 
    }

}

export class Matrix4
{

    public static readonly ZERO: Matrix4 = new Matrix4(
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    )

    public static readonly IDENTITY: Matrix4 = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )

    public static translate(v: Vector3): Matrix4
    {
        return new Matrix4(
            1, 0, 0, v.x,
            0, 1, 0, v.y,
            0, 0, 1, v.z,
            0, 0, 0, 1
        )
    }

    public static scale(v: Vector3): Matrix4
    {
        return new Matrix4(
            v.x, 0,   0,   0,
            0,   v.y, 0,   0,
            0,   0,   v.z, 0,
            0,   0,   0,   1
        )
    }

    public static rotate(q: Quaternion): Matrix4
    {
        let x = 2 * q.x, y = 2 * q.y, z = 2 * q.z
        let xx = q.x * x
        let yy = q.y * y
        let zz = q.z * z
        let xy = q.x * y
        let xz = q.x * z
        let yz = q.y * z
        let wx = q.w * x
        let wy = q.w * y
        let wz = q.w * z

        return new Matrix4(
            1 - (yy + zz), xy - wz,       xz + wy,       0,
            xy + wz,       1 - (xx + zz), yz - wx,       0,
            xz - wy,       yz + wx,       1 - (xx + yy), 0,
            0,             0,             0,             1
        )
    }

    public static orthographic(width: number, height: number, [near, far]: [number, number]): Matrix4
    {
        let range = far - near
        return new Matrix4(
            2 / width, 0,          0,          0,
            0,         2 / height, 0,          0,
            0,         0,          1 / range, -near / range,
            0,         0,          0,          1
        )
    }

    public static perspective(fov: number, aspect: number, [near, far]: [number, number]): Matrix4
    {
        let f = 1 / Math.tan(fov / 2)
        let q = far / (far - near)

        return new Matrix4(
            f / aspect, 0, 0,  0,
            0,          f, 0,  0,
            0,          0, q, -near * q,
            0,          0, 1,  0
        )
    }

    public constructor(
        public readonly m00: number, public readonly m01: number, public readonly m02: number, public readonly m03: number,
        public readonly m10: number, public readonly m11: number, public readonly m12: number, public readonly m13: number,
        public readonly m20: number, public readonly m21: number, public readonly m22: number, public readonly m23: number,
        public readonly m30: number, public readonly m31: number, public readonly m32: number, public readonly m33: number
    ) { }


    public mul(m: Matrix4): Matrix4
    {
        let m00 = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20 + this.m03 * m.m30
        let m01 = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21 + this.m03 * m.m31
        let m02 = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22 + this.m03 * m.m32
        let m03 = this.m00 * m.m03 + this.m01 * m.m13 + this.m02 * m.m23 + this.m03 * m.m33

        let m10 = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20 + this.m13 * m.m30
        let m11 = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31
        let m12 = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32
        let m13 = this.m10 * m.m03 + this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33

        let m20 = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20 + this.m23 * m.m30
        let m21 = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31
        let m22 = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32
        let m23 = this.m20 * m.m03 + this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33

        let m30 = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + this.m33 * m.m30
        let m31 = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31
        let m32 = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32
        let m33 = this.m30 * m.m03 + this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33

        return new Matrix4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
    }

    public vmul(v: Vector3): Vector3
    {
        let x = this.m00 * v.x + this.m01 * v.y + this.m02 * v.z + this.m03
        let y = this.m10 * v.x + this.m11 * v.y + this.m12 * v.z + this.m13
        let z = this.m20 * v.x + this.m21 * v.y + this.m22 * v.z + this.m23

        return new Vector3(x, y, z)
    }

    public wmul(v: Vector3, w: number = 1): Vector3
    {
        let x = this.m00 * v.x + this.m01 * v.y + this.m02 * v.z + this.m03 * w
        let y = this.m10 * v.x + this.m11 * v.y + this.m12 * v.z + this.m13 * w
        let z = this.m20 * v.x + this.m21 * v.y + this.m22 * v.z + this.m23 * w

        let d = this.m30 * v.x + this.m31 * v.y + this.m32 * v.z + this.m33 * w
        return new Vector3(x, y, z).div(d)
    }

    public transpose(): Matrix4
    {
        return new Matrix4(
            this.m00, this.m10, this.m20, this.m30,
            this.m01, this.m11, this.m21, this.m31,
            this.m02, this.m12, this.m22, this.m32,
            this.m03, this.m13, this.m23, this.m33
        )
    }

    public inverse(): Matrix4
    {
        let a2323 = this.m22 * this.m33 - this.m23 * this.m32
        let a1323 = this.m21 * this.m33 - this.m23 * this.m31
        let a1223 = this.m21 * this.m32 - this.m22 * this.m31
        let a0323 = this.m20 * this.m33 - this.m23 * this.m30
        let a0223 = this.m20 * this.m32 - this.m22 * this.m30
        let a0123 = this.m20 * this.m31 - this.m21 * this.m30
        let a2313 = this.m12 * this.m33 - this.m13 * this.m32
        let a1313 = this.m11 * this.m33 - this.m13 * this.m31
        let a1213 = this.m11 * this.m32 - this.m12 * this.m31
        let a2312 = this.m12 * this.m23 - this.m13 * this.m22
        let a1312 = this.m11 * this.m23 - this.m13 * this.m21
        let a1212 = this.m11 * this.m22 - this.m12 * this.m21
        let a0313 = this.m10 * this.m33 - this.m13 * this.m30
        let a0213 = this.m10 * this.m32 - this.m12 * this.m30
        let a0312 = this.m10 * this.m23 - this.m13 * this.m20
        let a0212 = this.m10 * this.m22 - this.m12 * this.m20
        let a0113 = this.m10 * this.m31 - this.m11 * this.m30
        let a0112 = this.m10 * this.m21 - this.m11 * this.m20

        let det = 1 /
            (this.m00 * (this.m11 * a2323 - this.m12 * a1323 + this.m13 * a1223)
           - this.m01 * (this.m10 * a2323 - this.m12 * a0323 + this.m13 * a0223)
           + this.m02 * (this.m10 * a1323 - this.m11 * a0323 + this.m13 * a0123)
           - this.m03 * (this.m10 * a1223 - this.m11 * a0223 + this.m12 * a0123))

        let m00 =  det * (this.m11 * a2323 - this.m12 * a1323 + this.m13 * a1223)
        let m01 = -det * (this.m01 * a2323 - this.m02 * a1323 + this.m03 * a1223)
        let m02 =  det * (this.m01 * a2313 - this.m02 * a1313 + this.m03 * a1213)
        let m03 = -det * (this.m01 * a2312 - this.m02 * a1312 + this.m03 * a1212)

        let m10 = -det * (this.m10 * a2323 - this.m12 * a0323 + this.m13 * a0223)
        let m11 =  det * (this.m00 * a2323 - this.m02 * a0323 + this.m03 * a0223)
        let m12 = -det * (this.m00 * a2313 - this.m02 * a0313 + this.m03 * a0213)
        let m13 =  det * (this.m00 * a2312 - this.m02 * a0312 + this.m03 * a0212)

        let m20 =  det * (this.m10 * a1323 - this.m11 * a0323 + this.m13 * a0123)
        let m21 = -det * (this.m00 * a1323 - this.m01 * a0323 + this.m03 * a0123)
        let m22 =  det * (this.m00 * a1313 - this.m01 * a0313 + this.m03 * a0113)
        let m23 = -det * (this.m00 * a1312 - this.m01 * a0312 + this.m03 * a0112)

        let m30 = -det * (this.m10 * a1223 - this.m11 * a0223 + this.m12 * a0123)
        let m31 =  det * (this.m00 * a1223 - this.m01 * a0223 + this.m02 * a0123)
        let m32 = -det * (this.m00 * a1213 - this.m01 * a0213 + this.m02 * a0113)
        let m33 =  det * (this.m00 * a1212 - this.m01 * a0212 + this.m02 * a0112)

        return new Matrix4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
    }

}
