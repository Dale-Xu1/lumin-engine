# Lumin Engine

## Overview

This is a realtime 2D rigid body physics engine intended for applications such as games. The engine has an impulse-based collision resolver as well as includes a constraint solver for linkages. The repository also contains an entity component system (ECS) which has integration with the physics engine to make creating scenes simple and scalable.

## Setup

The engine is initialized with the following code:

Note that `CustomScene` is defined by the user; code showing how to initialize an example scene can be found in `ExampleScene.ts`.

```javascript
import * as Lumin from "./lumin/Lumin"

Lumin.init(new Lumin.RenderEngine(canvas, width, height))

Lumin.engine.enter(new CustomScene())
Lumin.engine.start()
```

![](https://github.com/Dale-Xu1/lumin-engine/assets/69087617/d663cf42-a2e8-432b-a56d-828f512a9dbc)
