struct VertexInput
{
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32
};

struct VertexOutput
{
    @builtin(position) pos: vec4f,
    @location(0) @interpolate(flat) cell: vec2u
}

@group(0) @binding(0) var<uniform> grid: vec2u;
@group(0) @binding(1) var state: texture_2d<u32>;

@vertex
fn vertex(input: VertexInput) -> VertexOutput
{
    let cell = vec2u(input.instance % grid.x, input.instance / grid.x);
    let state = vec2f(textureLoad(state, cell, 0).xx);

    let g = vec2f(grid);
    let p = (input.pos * state + 1) / g - 1 + vec2f(cell) / g * 2;

    var output: VertexOutput;
    output.pos =  vec4f(p, 0, 1);
    output.cell = cell;

    return output;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f
{
    let c = vec2f(input.cell) / vec2f(grid);
    return vec4f(c, 1 - c.x, 1);
}
