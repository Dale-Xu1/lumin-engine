import { Input, Key, MouseButton, Scene } from "./lumin/Lumin"
import Vector2 from "./lumin/Vector2"
import RigidBody, { BodyType } from "./lumin/physics/RigidBody"
import Shape, { Circle, Ray, Rectangle } from "./lumin/physics/Shape"
import PhysicsEngine from "./lumin/physics/PhysicsEngine"
import Constraint from "./lumin/physics/Constraint"
import Entity, { Component } from "./lumin/Entity"
import Lumin from "./lumin/Lumin"

// TODO: UI system
// TODO: Scene description file
// TODO: Particle system

class Control extends Component
{

    private body!: RigidBody<Rectangle>

    public override init() { this.body = this.getComponent(RigidBody)! }
    public override update()
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

        let intersection = this.scene.physics.testRay(new Ray(this.entity.position, Vector2.DOWN.rotate(this.entity.angle)))
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

class AddBody extends Component
{

    private down: boolean = false
    public override update()
    {
        let previous = this.down
        this.down = Input.button[MouseButton.LEFT]

        if (this.down && !previous)
        {
            let position = this.scene.toWorldSpace(Input.mouse)
            if (this.scene.physics.testPoint(position).length > 0) return

            let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
            this.scene.addEntity(new Entity(position, Math.random() * 2 * Math.PI, [new RigidBody(shape)]))
        }
    }

}

export default class ExampleScene extends Scene
{

    public constructor()
    {
        let camera = new Entity(Vector2.ZERO, 0, [Lumin.camera])
        super(camera, new PhysicsEngine())

        this.addEntity(new Entity(Vector2.ZERO, 0, [new AddBody()]))

        for (let i = 0; i < 50; i++)
        {
            let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
            this.addEntity(new Entity(new Vector2(Math.random() * 2 - 1, 0), Math.random() * 2 * Math.PI, [new RigidBody(shape)]))
        }

        this.addEntity(new Entity(new Vector2(0, 8), 0, [new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })]))
        this.addEntity(new Entity(new Vector2(0, -8), 0, [new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })]))
        this.addEntity(new Entity(new Vector2(-12, 0), 0, [new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })]))
        this.addEntity(new Entity(new Vector2(12, 0), 0, [new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })]))

        this.addEntity(new Entity(new Vector2(0, 5), 0, [new RigidBody(new Rectangle(0.5, 0.5, 20), { gravityScale: 0 }), new Control()]))

        let a = new RigidBody(new Rectangle(1, 1))
        let b = new RigidBody(new Rectangle(1, 1))
        let c = new RigidBody(new Rectangle(1, 1))
        let d = new RigidBody(new Rectangle(1, 1))
        this.addEntity(new Entity(new Vector2(-5, 2), 0, [a, new Constraint(2, a, b), new Constraint(Math.sqrt(8), a, c)]))
        this.addEntity(new Entity(new Vector2(-5, 4), 0, [b, new Constraint(2, b, c), new Constraint(Math.sqrt(8), b, d)]))
        this.addEntity(new Entity(new Vector2(-3, 4), 0, [c, new Constraint(2, c, d)]))
        this.addEntity(new Entity(new Vector2(-3, 2), 0, [d, new Constraint(2, d, a)]))

        let start = new RigidBody(new Rectangle(0.5, 0.5), { type: BodyType.Static })
        let chain: RigidBody<Shape>[] = []
        for (let i = 0; i < 8; i++)
        {
            let body = new RigidBody(new Rectangle(0.2, 0.5))
            chain.push(body)
        }

        let y = 4
        this.addEntity(new Entity(new Vector2(4, y), 0, [start, new Constraint(0.5, start, chain[0], { pointA: Vector2.ZERO, pointB: Vector2.UP.mul(0.15) })]))
        for (let i = 0; i < chain.length - 1; i++)
        {
            let a = chain[i], b = chain[i + 1]
            y -= 0.6

            this.addEntity(new Entity(new Vector2(4, y), 0, [a, new Constraint(0.25, a, b, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) })]))
        }
        this.addEntity(new Entity(new Vector2(4, y - 0.6), 0, [chain[chain.length - 1]]))
    }

}
