import * as Lumin from "./lumin/Lumin"
import { Entity, Quaternion, Vector3 } from "./lumin/Lumin"
import { Material, Mesh, MeshRenderer } from "./lumin/render/RenderEngine"

import test from "./lumin/render/shaders/Test.wgsl?raw"

class TestComponent extends Lumin.Component
{

    public override async init()
    {
        let material = new Material(Lumin.renderer, test)
        let mesh = new Mesh(Lumin.renderer,
        [
            new Vector3(-1, -1, 0),
            new Vector3( 1, -1, 0),
            new Vector3( 1,  1, 0),
            new Vector3(-1,  1, 0)
        ], [0, 1, 2, 0, 2, 3])

        this.entity.addComponent(new MeshRenderer(mesh, material))
    }

    private q: Quaternion = Quaternion.rotate(0.02, new Vector3(Math.random(), Math.random(), Math.random()).normalize())
    public override update()
    {
        this.entity.rotation = this.entity.rotation.mul(this.q)
    }

}

export default class RenderExample extends Lumin.Scene
{

    public constructor()
    {
        super(Lumin.renderer, new Lumin.PhysicsEngine())

        this.addEntity(new Entity([new Lumin.Camera(5)]))
        this.addEntity(new Entity([new TestComponent()], { position: new Vector3(0, 0, 10) }))
    }

}
