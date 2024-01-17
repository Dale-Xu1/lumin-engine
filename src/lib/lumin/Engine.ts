import { browser } from "$app/environment"

import { Matrix2, Vector2 } from "./Math"
import type PhysicsEngine from "./physics/PhysicsEngine"

const MAX_DELAY = 200

export default class Engine
{

    private readonly stack: Scene[] = []
    private get scene(): Scene { return this.stack[this.stack.length - 1] }

    public constructor(private readonly renderer: RenderEngine, private readonly delta: number = 0.02)
    {
        this.delta = delta
        this.frame = this.frame.bind(this)
    }


    private previous!: number
    private accumulated: number = 0

    private timer!: number
    public start()
    {
        if (this.stack.length < 1) throw new Error("Engine scene must be set to start")
        this.timer = window.requestAnimationFrame(now =>
        {
            this.previous = now
            this.frame(now)
        })
    }
    public stop() { window.cancelAnimationFrame(this.timer) }

    private frame(now: number)
    {
        window.requestAnimationFrame(this.frame)
        let delay = this.delta * 1000 // Convert to milliseconds

        // Accumulate lagged time
        this.accumulated += now - this.previous
        this.previous = now

        if (this.accumulated > MAX_DELAY) this.accumulated = MAX_DELAY // Prevent spiral of death
        while (this.accumulated > delay)
        {
            this.accumulated -= delay

            this.scene.start()
            this.scene.update(this.delta)
        }

        // Calculate alpha for interpolation
        let alpha = this.accumulated / delay
        this.scene.render(this.renderer, alpha)
    }

    private changeScene() { this.renderer.setCamera(this.scene.camera) } // Maintain renderer reference to camera
    public enter(scene: Scene)
    {
        this.stack.push(scene)
        this.changeScene()
    }

    public exit(): Scene
    {
        if (this.stack.length <= 1) throw new Error("Cannot exit scene")
        let scene = this.stack.pop()!

        this.changeScene()
        return scene
    }

}

export class RenderEngine
{

    public context: CanvasRenderingContext2D

    public get width(): number  { return this.canvas.width }
    public get height(): number { return this.canvas.height }

    public constructor(public readonly canvas: HTMLCanvasElement, width: number, height: number)
    {
        this.resize(width, height)
        let ratio = window.devicePixelRatio

        this.context = canvas.getContext("2d")!
        Object.defineProperty(this.context, "strokeWidth",
        {
            set: value => this.context.lineWidth = value * ratio * this.camera.size / this.height
        })
    }


    public camera!: Camera
    public setCamera(camera: Camera) { this.camera = camera }

    public resize(width: number, height: number)
    {
        let ratio = window.devicePixelRatio

        this.canvas.width = width * ratio
        this.canvas.height = height * ratio
    }

    public toWorldSpace(screen: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(this.width / 2, this.height / 2)

        let world = screen.sub(dimensions).div(this.height / camera.size)
        let rotation = Matrix2.rotate(camera.entity.rotation)

        return rotation.vmul(new Vector2(world.x, -world.y)).add(camera.entity.position)
    }

    public toScreenSpace(world: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(this.width / 2, this.height / 2)

        let rotation = Matrix2.rotate(-camera.entity.rotation)
        let screen = rotation.vmul(world.sub(camera.entity.position))

        return new Vector2(screen.x, -screen.y).mul(this.height / camera.size).add(dimensions)
    }

    public render()
    {
        let c = this.context
        c.restore()
        c.save()
        c.clearRect(0, 0, this.width, this.height)

        // Center origin
        c.translate(this.width / 2, this.height / 2)

        // Apply transformations
        let position = this.camera.entity.position.neg()
        let scale = this.height / this.camera.size

        c.scale(scale, -scale)
        c.rotate(-this.camera.entity.rotation)
        c.translate(position.x, position.y)
    }

}

export class Scene
{

    public readonly entities: Entity[] = []

    public constructor(public readonly physics: PhysicsEngine) { }


    private newEntities: Entity[] = []
    public addEntity(entity: Entity)
    {
        if (entity.scene) throw new Error("Entity is already attached to a scene")
        entity.scene = this

        this.newEntities.push(entity) // Defer init call to start of update cycle
    }

    public get camera(): Camera
    {
        for (let entity of this.newEntities.concat(this.entities))
        {
            let camera = entity.getComponent(Camera)
            if (camera) return camera
        }

        throw new Error("Scene does not have a camera")
    }

    public removeEntity(entity: Entity)
    {
        let index = this.entities.indexOf(entity)
        if (index >= 0)
        {
            let entity = this.entities[index]
            this.entities.splice(index, 1)

            entity.destroy()
        }
    }

    public destroy() { for (let entity of this.entities) entity.destroy() }
    public start()
    {
        for (let entity of this.newEntities) this.entities.push(entity), entity.init()
        this.newEntities = []

        for (let entity of this.entities) entity.start() // Initialize new components
        if (this.newEntities.length > 0) this.start() // Recurse because of possibility a component added a new entity
    }

    public update(delta: number)
    {
        for (let entity of this.entities) entity.fixedUpdate(delta)
        this.physics.update(delta)
    }

    public render(renderer: RenderEngine, alpha: number)
    {
        let c = renderer.context
        for (let entity of this.entities) entity.update(alpha)

        renderer.render()
        this.physics.render(c)

        for (let entity of this.entities) entity.render(c)
    }

}

interface Constructor<T> { new(...args: any[]): T }
export interface EntityParams
{

    position?: Vector2
    rotation?: number

}

export class Entity
{

    public scene!: Scene

    public position: Vector2
    public rotation: number

    public constructor(private readonly components: Component[],
        { position = Vector2.ZERO, rotation = 0 }: EntityParams = {})
    {
        // Register components to this entity
        for (let component of components) component.entity = this

        this.position = position
        this.rotation = rotation
    }


    public getComponent<T>(type: Constructor<T>): T | null
    {
        for (let component of this.components) if (component instanceof type) return component
        return null
    }

    private newComponents: Component[] = []
    public addComponent(component: Component)
    {
        if (component.entity) throw new Error("Component is already attached to an entity")
        component.entity = this

        this.newComponents.push(component)
    }

    public removeComponent(component: Component)
    {
        let index = this.components.indexOf(component)
        if (index >= 0)
        {
            let component = this.components[index]
            this.components.splice(index, 1)

            component.destroy()
        }
    }

    // Entity lifecycle
    public init() { for (let component of this.components) component.init() }
    public start()
    {
        for (let component of this.newComponents) this.components.push(component), component.init()
        this.newComponents = []
    }

    public destroy() { for (let component of this.components) component.destroy() }

    public fixedUpdate(delta: number) { for (let component of this.components) component.fixedUpdate(delta) }
    public update(alpha: number)      { for (let component of this.components) component.update(alpha) }

    public render(c: CanvasRenderingContext2D)
    {
        // Apply transformations
        c.save()
        c.translate(this.position.x, this.position.y)
        c.rotate(this.rotation)

        for (let component of this.components) component.render(c)
        c.restore()
    }

}

export abstract class Component
{

    public entity!: Entity
    protected get scene(): Scene { return this.entity.scene }

    protected getComponent<T>(type: Constructor<T>): T | null { return this.entity.getComponent(type) }


    public init() { }
    public destroy() { }

    public fixedUpdate(delta: number) { }
    public update(alpha: number) { }

    public render(c: CanvasRenderingContext2D) { }

}

export class Camera extends Component
{

    public constructor(public size: number = 20) { super() }

}

export namespace Input
{

    export let mouse: Vector2
    export let button: [boolean, boolean, boolean] = [false, false, false]

    let codes: Set<string> = new Set()


    export function key(code: Key | string): boolean { return codes.has(code) }

    function keydown(e: KeyboardEvent) { codes.add(e.code) }
    function keyup(e: KeyboardEvent) { codes.delete(e.code) }

    function disable(e: MouseEvent) { e.preventDefault() }
    function mousemove(e: MouseEvent) { mouse = new Vector2(e.clientX, e.clientY).mul(window.devicePixelRatio) }

    function mousedown(e: MouseEvent)
    {
        button[e.button] = true
        if (e.button === MouseButton.MIDDLE) e.preventDefault()
    }

    function mouseup(e: MouseEvent) { button[e.button] = false }

    // Don't register events if code is being run for SSR
    if (browser)
    {
        window.addEventListener("keydown", keydown)
        window.addEventListener("keyup", keyup)

        window.addEventListener("contextmenu", disable)
        window.addEventListener("mousemove", mousemove)
        window.addEventListener("mousedown", mousedown)
        window.addEventListener("mouseup", mouseup)
    }

}

export const enum MouseButton { LEFT, MIDDLE, RIGHT }
export const enum Key
{
    SPACE     = "Space",
    L_CTRL    = "ControlLeft", R_CTRL  = "ControlRight",
    L_SHIFT   = "ShiftLeft",   R_SHIFT = "ShiftRight",
    L_ALT     = "AltLeft",     R_ALT   = "AltRight",
    ESC       = "Escape",
    ENTER     = "Enter",
    TAB       = "Tab",
    DELETE    = "Delete",
    BACKSPACE = "Backspace",

    DOWN  = "ArrowDown",
    LEFT  = "ArrowLeft",
    RIGHT = "ArrowRight",
    UP    = "ArrowUp",

    A = "KeyA",
    B = "KeyB",
    C = "KeyC",
    D = "KeyD",
    E = "KeyE",
    F = "KeyF",
    G = "KeyG",
    H = "KeyH",
    I = "KeyI",
    J = "KeyJ",
    K = "KeyK",
    L = "KeyL",
    M = "KeyM",
    N = "KeyN",
    O = "KeyO",
    P = "KeyP",
    Q = "KeyQ",
    R = "KeyR",
    S = "KeyS",
    T = "KeyT",
    U = "KeyU",
    V = "KeyV",
    W = "KeyW",
    X = "KeyX",
    Y = "KeyY",
    Z = "KeyZ",

    ZERO  = "Digit0",
    ONE   = "Digit1",
    TWO   = "Digit2",
    THREE = "Digit3",
    FOUR  = "Digit4",
    FIVE  = "Digit5",
    SIX   = "Digit6",
    SEVEN = "Digit7",
    EIGHT = "Digit8",
    NINE  = "Digit9"
}
