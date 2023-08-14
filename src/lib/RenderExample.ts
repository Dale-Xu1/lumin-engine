import * as Lumin from "./lumin/Lumin"
import { Color4, Entity, Quaternion, Vector2, Vector3 } from "./lumin/Lumin"
import { Material, Mesh, MeshRenderer } from "./lumin/render/RenderEngine"
import { Buffer, BufferFormat, Sampler, Texture } from "./lumin/render/Resource"

import test from "./lumin/render/shaders/Test.wgsl?raw"
import image from "./eiffel.png"

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

        let device = this.scene.renderer.device
        mesh.setAttribute("uv", new Buffer(device, BufferFormat.F32, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 8))
        mesh.write("uv",
        [
            new Vector2(0, 1),
            new Vector2(1, 1),
            new Vector2(1, 0),
            new Vector2(0, 0)
        ])

        let renderer = new MeshRenderer(mesh, material)
        renderer.setUniform("textureSampler", new Sampler(device))

        let texture = await Texture.fromFile(device, image)
        renderer.setUniform("texture", texture)

        this.entity.addComponent(renderer)
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
