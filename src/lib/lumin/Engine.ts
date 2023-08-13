import { browser } from "$app/environment"

import { Matrix4, Quaternion, Vector2, Vector3 } from "./Math"
import type PhysicsEngine from "./physics/PhysicsEngine"
import type RenderEngine from "./render/RenderEngine"

const DEBUG = true
const MAX_DELAY = 200

export default class Engine
{

    public scene: Scene | null = null

    public constructor(private readonly delta: number = 0.02)
    {
        this.delta = delta
        this.frame = this.frame.bind(this)
    }


    private previous!: number
    private accumulated: number = 0

    private timer!: number
    public start()
    {
        this.timer = window.requestAnimationFrame(now =>
        {
            this.previous = now
            this.scene?.update(this.delta)

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

        this.scene?.start()
        if (this.accumulated > MAX_DELAY) this.accumulated = MAX_DELAY // Prevent spiral of death
        while (this.accumulated > delay)
        {
            this.accumulated -= delay
            this.scene?.update(this.delta)
        }

        // Calculate alpha for interpolation
        let alpha = this.accumulated / delay
        this.scene?.render(alpha)
    }

}

export class Scene
{

    private readonly entities: Entity[] = []

    public constructor(public readonly renderer: RenderEngine, public readonly physics: PhysicsEngine) { }


    private newEntities: Entity[] = []
    public addEntity(entity: Entity)
    {
        if (entity.scene) throw new Error("Entity is already attached to a scene")
        entity.scene = this

        this.entities.push(entity)
        this.newEntities.push(entity) // Defer init call to start of update cycle
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
        if (this.newEntities.length === 0) return

        for (let entity of this.newEntities) entity.init()
        this.newEntities = []

        for (let entity of this.entities) entity.start() // Initialize new components
        this.start() // Recurse because of possibility a component added a new entity
    }

    public update(delta: number)
    {
        for (let entity of this.entities) entity.fixedUpdate(delta)
        this.physics.update(delta)
    }

    public render(alpha: number)
    {
        for (let entity of this.entities) entity.update(alpha)

        for (let entity of this.entities) entity.render()
        this.renderer.render()

        // TODO: Move debug lines to new rendering engine
        // if (DEBUG) this.physics.debug(c)
    }

}

// TODO: Entity parenting

interface Constructor<T> { new(...args: any[]): T }
export interface EntityParams
{

    position?: Vector3
    rotation?: Quaternion
    scale?: Vector3

}

export class Entity
{

    public scene!: Scene

    public position: Vector3
    public rotation: Quaternion
    public scale: Vector3

    public constructor(private readonly components: Component[],
        { position = Vector3.ZERO, rotation = Quaternion.IDENTITY, scale = Vector3.ONE }: EntityParams = {})
    {
        // Register components to this entity
        for (let component of components) component.entity = this

        this.position = position
        this.rotation = rotation
        this.scale = scale
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

        this.components.push(component)
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
        for (let component of this.newComponents) component.init()
        this.newComponents = []
    }

    public destroy() { for (let component of this.components) component.destroy() }

    public fixedUpdate(delta: number) { for (let component of this.components) component.fixedUpdate(delta) }
    public update(alpha: number)      { for (let component of this.components) component.update(alpha) }

    public transform!: Matrix4
    public normal!: Matrix4

    public render()
    {
        let transform = Matrix4.translate(this.position)
        if (!this.rotation.equals(Quaternion.IDENTITY)) transform = transform.mul(Matrix4.rotate(this.rotation))
        if (!this.scale.equals(Vector3.ONE)) transform = transform.mul(Matrix4.scale(this.scale))

        this.transform = transform
        this.normal = transform.inverse().transpose()

        for (let component of this.components) component.render()
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

    public render() { }

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
    function mousemove(e: MouseEvent) { mouse = new Vector2(e.clientX, e.clientY) }

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
