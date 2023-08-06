@group(0) @binding(0) var<uniform> grid: vec2u;

@group(0) @binding(1) var input: texture_2d<u32>;
@group(0) @binding(2) var output: texture_storage_2d<r32uint, write>;

fn wrap(id: vec2u) -> vec2u { return id % grid; }
fn alive(x: u32, y: u32) -> u32 { return textureLoad(input, wrap(vec2u(x, y)), 0).x; }

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u)
{
    let neighbors =
        alive(id.x + 1, id.y + 1) +
        alive(id.x + 1, id.y    ) +
        alive(id.x + 1, id.y - 1) +
        alive(id.x    , id.y - 1) +
        alive(id.x - 1, id.y - 1) +
        alive(id.x - 1, id.y    ) +
        alive(id.x - 1, id.y + 1) +
        alive(id.x    , id.y + 1);

    var result: u32;
    switch (neighbors)
    {
        case 2: { result = alive(id.x, id.y); }
        case 3: { result = 1; }
        default: { result = 0; }
    }

    textureStore(output, id.xy, vec4u(result));
}
