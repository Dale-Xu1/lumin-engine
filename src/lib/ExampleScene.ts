import * as Lumin from "./lumin/Lumin"
import { BodyType, Circle, Constraint, Entity, Input, Key, Matrix2,
    Quaternion, Ray, Rectangle, RigidBody, Shape, Vector2, Vector3 } from "./lumin/Lumin"

class Control extends Lumin.Component
{

    private body!: RigidBody<Rectangle>

    public override init() { this.body = this.getComponent(RigidBody)! }
    public override fixedUpdate()
    {
        let offset = Vector2.ZERO
        let angle = 0

        if (Input.key(Key.UP)) offset = offset.add(Vector2.UP)
        if (Input.key(Key.DOWN)) offset = offset.add(Vector2.DOWN)
        if (Input.key(Key.LEFT)) offset = offset.add(Vector2.LEFT)
        if (Input.key(Key.RIGHT)) offset = offset.add(Vector2.RIGHT)

        if (Input.key(Key.X)) angle -= 1
        if (Input.key(Key.Z)) angle += 1

        this.body.applyForce(offset.normalize().mul(150))
        this.body.applyTorque(angle * 5)
    }

    public override render(c: CanvasRenderingContext2D)
    {
        let t = c.getTransform()
        c.restore()

        let intersection = this.scene.physics.testRay(new Ray(this.entity.position.cast(), Matrix2.rotate(this.entity.euler.z).vmul(Vector2.DOWN)))
        if (intersection !== null)
        {
            c.strokeStyle = "red"
            c.strokeWidth = 1

            let u = this.entity.position
            let v = intersection.position

            c.beginPath()
            c.moveTo(u.x, u.y)
            c.lineTo(v.x, v.y)
            c.stroke()
        }

        c.save()
        c.setTransform(t)
    }

}

class AddBody extends Lumin.Component
{

    private down: boolean = false
    public override fixedUpdate()
    {
        // let previous = this.down
        // this.down = Input.button[MouseButton.LEFT]

        // if (this.down && !previous)
        // {
        //     let position = this.scene.renderer.toWorldSpace(Input.mouse)
        //     if (this.scene.physics.testPoint(position).length > 0) return

        //     let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
        //     this.scene.addEntity(new Entity(position.cast(), Math.random() * 2 * Math.PI, [new RigidBody(shape)]))
        // }
    }

}

export default class ExampleScene extends Lumin.Scene
{

    public constructor()
    {
        super(Lumin.renderer, new Lumin.PhysicsEngine())

        this.addEntity(new Entity([new Lumin.Camera()]))
        this.addEntity(new Entity([new AddBody()]))

        for (let i = 0; i < 50; i++)
        {
            let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
            this.addEntity(new Entity([new RigidBody(shape)],
            {
                position: new Vector3(Math.random() * 2 - 1, 0, 0),
                rotation: Quaternion.rotate(Math.random() * 2 * Math.PI)
            }))
        }

        this.addEntity(new Entity([new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })], { position: new Vector3(0, 8, 0) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })], { position: new Vector3(0, -8, 0) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })], { position: new Vector3(-12, 0, 0) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })], { position: new Vector3(12, 0, 0) }))

        this.addEntity(new Entity([new RigidBody(new Rectangle(0.5, 0.5, 20), { gravityScale: 0 }), new Control()], { position: new Vector3(0, 5, 0) }))

        let a = new RigidBody(new Rectangle(1, 1))
        let b = new RigidBody(new Rectangle(1, 1))
        let c = new RigidBody(new Rectangle(1, 1))
        let d = new RigidBody(new Rectangle(1, 1))
        this.addEntity(new Entity([a, new Constraint(2, a, b), new Constraint(Math.sqrt(8), a, c)], { position: new Vector3(-5, 2, 0) }))
        this.addEntity(new Entity([b, new Constraint(2, b, c), new Constraint(Math.sqrt(8), b, d)], { position: new Vector3(-5, 4, 0) }))
        this.addEntity(new Entity([c, new Constraint(2, c, d)], { position: new Vector3(-3, 4, 0) }))
        this.addEntity(new Entity([d, new Constraint(2, d, a)], { position: new Vector3(-3, 2, 0) }))

        let start = new RigidBody(new Rectangle(0.5, 0.5), { type: BodyType.Static })
        let chain: RigidBody<Shape>[] = []
        for (let i = 0; i < 8; i++)
        {
            let body = new RigidBody(new Rectangle(0.2, 0.5))
            chain.push(body)
        }

        let y = 4
        this.addEntity(new Entity([start, new Constraint(0.5, start, chain[0], { pointA: Vector2.ZERO, pointB: Vector2.UP.mul(0.15) })], { position: new Vector3(4, y, 0) }))
        for (let i = 0; i < chain.length - 1; i++)
        {
            let a = chain[i], b = chain[i + 1]
            y -= 0.6

            this.addEntity(new Entity([a, new Constraint(0.25, a, b, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) })], { position: new Vector3(4, y, 0) }))
        }
        this.addEntity(new Entity([chain[chain.length - 1]], { position: new Vector3(4, y - 0.6, 0) }))
    }

}
