import * as Lumin from "./lumin/Lumin"
import { Entity, Quaternion, Vector3 } from "./lumin/Lumin"
import { Material, Mesh, MeshRenderer } from "./lumin/render/RenderEngine"
import { Buffer, BufferFormat } from "./lumin/render/Resource"

import test from "./lumin/render/shaders/Test.wgsl?raw"

class TestComponent extends Lumin.Component
{

    public override init()
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

    public override update()
    {
        this.entity.rotation = this.entity.rotation.mul(Quaternion.rotate(0.01))
    }

    public override render()
    {
        let renderer = this.getComponent(MeshRenderer)!
        renderer.setUniform("view", GPUBufferUsage.UNIFORM, Buffer.flatten(BufferFormat.F32,
            [this.scene.renderer.camera.view]))

        renderer.material.pipeline.start(this.scene.renderer.device.texture)
        renderer.pass.render(6)
        renderer.material.pipeline.end()
    }

}

export default class RenderExample extends Lumin.Scene
{

    public constructor()
    {
        super(Lumin.renderer, new Lumin.PhysicsEngine())

        this.addEntity(new Entity([new Lumin.Camera()]))
        this.addEntity(new Entity([new TestComponent()]))
    }

}
