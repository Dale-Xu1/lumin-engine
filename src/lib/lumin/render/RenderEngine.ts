import { Component } from "../Engine"
import type { Vector3 } from "../Math"

export default class RenderEngine
{

    public readonly context: CanvasRenderingContext2D
    public camera!: Camera

    public width!: number
    public height!: number

    public constructor(public readonly canvas: HTMLCanvasElement, width: number, height: number)
    {
        // Define custom setter "strokeWidth" that sets lineWidth relative to camera scale
        this.context = canvas.getContext("2d")!
        Object.defineProperty(this.context, "strokeWidth",
        {
            set: value => this.context.lineWidth = value * this.camera.size / this.height
        })

        this.resize(width, height)
    }

    public resize(width: number, height: number)
    {
        this.width = width
        this.height = height

        let ratio = window.devicePixelRatio

        this.canvas.width = width * ratio
        this.canvas.height = height * ratio

        this.context.scale(ratio, ratio)
    }


    // public toWorldSpace(screen: Vector2): Vector2
    // {
    //     let dimensions = new Vector2(this.width / 2, this.height / 2)

    //     let world = screen.sub(dimensions).div(this.height / this.camera.size)
    //     return new Vector2(world.x, -world.y).sub(this.camera.position.cast())
    // }

    // public toScreenSpace(world: Vector2): Vector2
    // {
    //     let dimensions = new Vector2(this.width / 2, this.height / 2)

    //     let screen = world.add(this.camera.position.cast())
    //     return new Vector2(screen.x, -screen.y).mul(this.height / this.camera.size).add(dimensions)
    // }

    public init(): CanvasRenderingContext2D
    {
        let c = this.context
        c.restore()
        c.save()
        c.clearRect(0, 0, this.width, this.height)

        // Center origin
        c.translate(this.width / 2, this.height / 2)

        // Apply transformations
        let position = this.camera.position.neg()
        let scale = this.height / this.camera.size

        c.scale(scale, -scale)
        c.rotate(-this.camera.angle)
        c.translate(position.x, position.y)

        return this.context
    }

    // TODO: Draw call to render pass conversion

}

export class Camera extends Component
{

    public get position(): Vector3 { return this.entity.position }
    public get angle(): number { return 0 } // TODO: Projection matrix

    public size: number

    public constructor(size: number = 20)
    {
        super()
        this.size = size
    }

    public override init() { this.scene.renderer.camera = this } // Attach to renderer

}

export class Mesh extends Component
{

}
