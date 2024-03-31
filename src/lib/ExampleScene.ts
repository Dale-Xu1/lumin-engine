import * as Lumin from "./lumin/Lumin"
import { BodyType, Circle, Constraint, Entity, Input, Key, Rectangle, RigidBody, type Shape,
    Vector2, MouseButton } from "./lumin/Lumin"

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

}

class AddBody extends Lumin.Component
{

    private down: boolean = false
    public override fixedUpdate()
    {
        let previous = this.down
        this.down = Input.button[MouseButton.LEFT]

        if (this.down && !previous)
        {
            let position = Lumin.renderer.toWorldSpace(Input.mouse)
            position = Lumin.renderer.toWorldSpace(Lumin.renderer.toScreenSpace(position))

            if (this.scene.physics.testPoint(position).length > 0) return

            let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
            this.scene.addEntity(new Entity([new RigidBody(shape)], { position, rotation: Math.random() * 2 * Math.PI }))
        }
    }

}

export default class ExampleScene extends Lumin.Scene
{

    public constructor()
    {
        super(new Lumin.PhysicsEngine({ debug: true }))

        this.addEntity(new Entity([new Lumin.Camera()]))
        this.addEntity(new Entity([new AddBody()]))

        for (let i = 0; i < 50; i++)
        {
            let shape = Math.random() < 0.5 ? new Circle(Math.random() * 0.4 + 0.2) : new Rectangle(Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4)
            this.addEntity(new Entity([new RigidBody(shape)],
            {
                position: new Vector2(Math.random() * 10 - 5, Math.random() * 4),
                rotation: Math.random() * 2 * Math.PI
            }))
        }

        this.addEntity(new Entity([new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })], { position: new Vector2(0, 8) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(24, 1), { type: BodyType.Static })], { position: new Vector2(0, -8) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })], { position: new Vector2(-12, 0) }))
        this.addEntity(new Entity([new RigidBody(new Rectangle(1, 16), { type: BodyType.Static })], { position: new Vector2(12, 0) }))

        this.addEntity(new Entity([new RigidBody(new Rectangle(0.5, 0.5), { density: 20, gravityScale: 0 }), new Control()], { position: new Vector2(0, 5) }))

        // let a = new RigidBody(new Rectangle(1, 1))
        // let b = new RigidBody(new Rectangle(1, 1))
        // let c = new RigidBody(new Rectangle(1, 1))
        // let d = new RigidBody(new Rectangle(1, 1))
        // this.addEntity(new Entity([a, new Constraint(2, a, b), new Constraint(Math.sqrt(8), a, c)], { position: new Vector2(-5, 2) }))
        // this.addEntity(new Entity([b, new Constraint(2, b, c), new Constraint(Math.sqrt(8), b, d)], { position: new Vector2(-5, 4) }))
        // this.addEntity(new Entity([c, new Constraint(2, c, d)], { position: new Vector2(-3, 4) }))
        // this.addEntity(new Entity([d, new Constraint(2, d, a)], { position: new Vector2(-3, 2) }))

        let start = new RigidBody(new Rectangle(0.5, 0.5), { type: BodyType.Static })
        let chain: RigidBody<Shape>[] = []
        for (let i = 0; i < 8; i++)
        {
            let body = new RigidBody(new Rectangle(0.2, 0.5))
            chain.push(body)
        }

        let y = 4
        this.addEntity(new Entity([start, new Constraint(0.5, start, chain[0], { pointA: Vector2.ZERO, pointB: Vector2.UP.mul(0.15) })], { position: new Vector2(4, y) }))
        for (let i = 0; i < chain.length - 1; i++)
        {
            let a = chain[i], b = chain[i + 1]
            y -= 0.6

            this.addEntity(new Entity([a, new Constraint(0.25, a, b, { pointA: Vector2.DOWN.mul(0.15), pointB: Vector2.UP.mul(0.15) })], { position: new Vector2(4, y) }))
        }
        this.addEntity(new Entity([chain[chain.length - 1]], { position: new Vector2(4, y - 0.6) }))
    }

}
