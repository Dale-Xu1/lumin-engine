import Engine, { type Scene } from "./Engine"
import type RenderEngine from "./render/RenderEngine"

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

export let engine: Engine = new Engine()
export let renderer: RenderEngine

export function init(r: RenderEngine) { renderer = r }

let stack: Scene[] = []
function current() { return stack[stack.length - 1] ?? null }

export function enter(scene: Scene)
{
    stack.push(scene)
    engine.scene = scene
}

export function exit(): Scene | null
{
    let scene = stack.pop()
    engine.scene = current()

    return scene ?? null
} 

export { default as Engine } from "./Engine"
export { Component, Entity, type EntityParams, Input, Key, MouseButton, Scene } from "./Engine"
export { Color4, Matrix2, Matrix4, Quaternion, Vector2, Vector3 } from "./Math"

export { default as RenderEngine } from "./render/RenderEngine"
export { Camera } from "./render/RenderEngine"

export { default as PhysicsEngine } from "./physics/PhysicsEngine"
export type { PhysicsParams } from "./physics/PhysicsEngine"
export { default as RigidBody } from "./physics/RigidBody"
export { type BodyParams, BodyType, } from "./physics/RigidBody"
export type { default as Shape } from "./physics/Shape"
export { Bounds, Circle, Polygon, Ray, Rectangle } from "./physics/Shape"
export { RayIntersection } from "./physics/Collision"
export { default as Constraint } from "./physics/Constraint"
export type { ConstraintParams } from "./physics/Constraint"
