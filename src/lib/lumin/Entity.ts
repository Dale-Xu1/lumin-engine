import type Vector2 from "../math/Vector2"
import type { Scene } from "./LuminEngine"

interface Constructor<T> { new(...args: any[]): T }

export default class Entity
{

    public scene!: Scene

    public constructor(public position: Vector2, public angle: number, public readonly components: Component[])
    {
        // Register components to this entity
        for (let component of components) component.entity = this
    }


    public getComponent<T>(type: Constructor<T>): T | null
    {
        for (let component of this.components) if (component instanceof type) return component
        return null
    }

    public addComponent(component: Component)
    {
        component.entity = this
        this.components.push(component)
    }

    public init() { for (let component of this.components) component.init() }
    public update(delta: number) { for (let component of this.components) component.update(delta) }

    public render(c: CanvasRenderingContext2D, alpha: number)
    {
        // Apply transformations
        c.save()
        c.translate(this.position.x, this.position.y)
        c.rotate(this.angle)

        for (let component of this.components) component.render(c, alpha)
        c.restore()
    }

}

export abstract class Component
{

    public entity!: Entity
    public get scene(): Scene { return this.entity.scene }

    protected getComponent<T>(type: Constructor<T>): T | null { return this.entity.getComponent(type) }


    public init() { }
    public update(delta: number) { }
    public render(c: CanvasRenderingContext2D, alpha: number) { }

}

export class Camera extends Component
{

    public readonly canvas: HTMLCanvasElement
    public readonly context: CanvasRenderingContext2D

    public get position(): Vector2 { return this.entity.position }
    public get angle(): number { return this.entity.angle }

    public width!: number
    public height!: number

    public size: number

    public constructor(canvas: HTMLCanvasElement, width: number, height: number, size: number = 20)
    {
        super()
        this.canvas = canvas
        this.context = canvas.getContext("2d")!

        this.size = size
        this.resize(width, height)

        // Define custom setter "strokeWidth" that sets lineWidth relative to camera scale
        let c = this.context
        Object.defineProperty(c, "strokeWidth",
        {
            set: value => c.lineWidth = value * this.size / this.height
        })
    }


    public transform()
    {
        let c = this.context
        c.restore()
        c.save()
        c.clearRect(0, 0, this.width, this.height)

        // Center origin
        c.translate(this.width / 2, this.height / 2)

        // Apply transformations
        let position = this.position.neg()
        let scale = this.height / this.size

        c.scale(scale, -scale)
        c.rotate(-this.angle)
        c.translate(position.x, position.y)
    }

    public resize(width: number, height: number)
    {
        this.width = width
        this.height = height

        let ratio = window.devicePixelRatio

        this.canvas.width = width * ratio
        this.canvas.height = height * ratio

        let c = this.context
        c.scale(ratio, ratio)
    }

}
