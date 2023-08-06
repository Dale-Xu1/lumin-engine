import Engine, { type Scene } from "./Engine"
import type { Camera } from "./Entity"

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

export let engine: Engine = new Engine()
export let camera: Camera

export function init(c: Camera) { camera = c }

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

export { default as Engine } from "./Engine"
export { Input, Key, MouseButton, Scene } from "./Engine"
export { default as Entity } from "./Entity"
export { Component, Camera } from "./Entity"
export { Vector2, Vector3 } from "./Math"

export { default as PhysicsEngine } from "./physics/PhysicsEngine"
export type { PhysicsParams } from "./physics/PhysicsEngine"
export { default as RigidBody } from "./physics/RigidBody"
export { type BodyParams, BodyType, } from "./physics/RigidBody"
export { default as Shape } from "./physics/Shape"
export { Bounds, Circle, Polygon, Ray, Rectangle } from "./physics/Shape"
export { RayIntersection } from "./physics/Collision"
export { default as Constraint } from "./physics/Constraint"
export type { ConstraintParams } from "./physics/Constraint"
