import { browser } from "$app/environment"

import Vector2 from "./Vector2"
import Entity, { Camera } from "./Entity"
import type PhysicsEngine from "./physics/PhysicsEngine"

const DEBUG = true
const MAX_DELAY = 200

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

export class Engine
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

namespace Lumin
{

    export let engine: Engine = new Engine()
    export let camera: Camera

    let stack: Scene[] = []
    function current() { return stack[stack.length - 1] ?? null }

    export function enter(scene: Scene)
    {
        stack.push(scene)
        engine.scene = scene
    }

    export function exit(): Scene | null
    {
        let scene = stack.pop() ?? null
        engine.scene = current()

        return scene
    }


}
export default Lumin

export class Scene
{

    public readonly camera: Camera
    public readonly entities: Entity[] = []

    public constructor(camera: Entity, public readonly physics: PhysicsEngine)
    {
        this.addEntity(camera)

        let component = camera.getComponent(Camera)
        if (component === null) throw new Error("Entity must have Camera component")

        this.camera = component
    }


    public addEntity(entity: Entity)
    {
        entity.scene = this
        this.entities.push(entity)

        entity.init()
    }

    public removeEntity(entity: Entity)
    {
        let index = this.entities.indexOf(entity)
        if (index >= 0) this.entities.splice(index, 1)
    }

    public toWorldSpace(screen: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(camera.width / 2, camera.height / 2)

        let world = screen.sub(dimensions).div(camera.height / camera.size)
        return new Vector2(world.x, -world.y).sub(camera.position)
    }

    public toScreenSpace(world: Vector2): Vector2
    {
        let camera = this.camera
        let dimensions = new Vector2(camera.width / 2, camera.height / 2)

        let screen = world.add(camera.position)
        return new Vector2(screen.x, -screen.y).mul(camera.height / camera.size).add(dimensions)
    }

    public update(delta: number)
    {
        for (let entity of this.entities) entity.update(delta)
        this.physics.update(delta)
    }

    public render(alpha: number)
    {
        this.physics.preRender(alpha)
        this.camera.reset()

        let c = this.camera.context
        for (let entity of this.entities) entity.render(c, alpha)

        if (DEBUG) this.physics.debug(c)
    }

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
