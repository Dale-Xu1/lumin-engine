import * as Lumin from "./lumin/Lumin"
import { Entity, Vector3 } from "./lumin/Lumin"

class TestComponent extends Lumin.Component
{

    public override render(c: CanvasRenderingContext2D, alpha: number)
    {
        c.fillRect(0, 0, 1, 1)
    }

}

export default class RenderExample extends Lumin.Scene
{

    public constructor()
    {
        super(Lumin.renderer, new Lumin.PhysicsEngine())

        this.addEntity(new Entity(Vector3.ZERO, 0, [new Lumin.Camera()]))
        this.addEntity(new Entity(Vector3.ZERO, 0, [new TestComponent()]))
    }

}
