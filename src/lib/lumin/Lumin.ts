import Engine, { type RenderEngine } from "./Engine"

declare global
{
    interface CanvasRenderingContext2D
    {
        set strokeWidth(value: number)
    }
}

export let engine: Engine
export let renderer: RenderEngine

export function init(r: RenderEngine)
{
    renderer = r
    engine = new Engine(renderer)
}

export { default as Engine } from "./Engine"
export { Camera, Component, Entity, type EntityParams, Input, Key, MouseButton, RenderEngine, Scene } from "./Engine"
export { Color4, Matrix2, Matrix4, Quaternion, Vector2, Vector3 } from "./Math"

export { default as PhysicsEngine } from "./physics/PhysicsEngine"
export type { PhysicsParams } from "./physics/PhysicsEngine"
export { default as RigidBody } from "./physics/RigidBody"
export { type BodyParams, BodyType, } from "./physics/RigidBody"
export type { default as Shape } from "./physics/Shape"
export { Bounds, Circle, Polygon, Ray, Rectangle } from "./physics/Shape"
export { RayIntersection } from "./physics/Collision"
export { default as Constraint } from "./physics/Constraint"
export type { ConstraintParams } from "./physics/Constraint"
