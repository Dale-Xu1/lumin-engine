@group(0) @binding(0) var<uniform> grid: vec2f;

@group(0) @binding(1) var<storage> input: array<u32>;
@group(0) @binding(2) var<storage, read_write> output: array<u32>;

fn index(id: vec2u) -> u32 { return (id.y % u32(grid.y)) * u32(grid.x) + (id.x % u32(grid.x)); }
fn alive(x: u32, y: u32) -> u32 { return input[index(vec2u(x, y))]; }

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

    let i = index(id.xy);
    switch (neighbors)
    {
        case 2: { output[i] = input[i]; }
        case 3: { output[i] = 1; }
        default: { output[i] = 0; }
    }
}
