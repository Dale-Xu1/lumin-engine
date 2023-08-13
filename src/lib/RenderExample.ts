import * as Lumin from "./lumin/Lumin"
import { Entity, Quaternion } from "./lumin/Lumin"

class TestComponent extends Lumin.Component
{

    public override update()
    {
        this.entity.rotation = this.entity.rotation.mul(Quaternion.rotate(0.01))
    }

    public override render()
    {
        // c.fillRect(0, 0, 1, 1)
    }

}

export default class RenderExample extends Lumin.Scene
{

    public constructor()
    {
        super(Lumin.renderer, new Lumin.PhysicsEngine())

        this.addEntity(new Entity([new Lumin.Camera(), new Lumin.RigidBody(new Lumin.Circle(0.5))]))
        this.addEntity(new Entity([new TestComponent()]))

        this.addEntity(new Entity([new Lumin.RigidBody(new Lumin.Rectangle(10, 1), { type: Lumin.BodyType.Static })],
            { position: new Lumin.Vector3(0, -10, 0) }))
    }

}
