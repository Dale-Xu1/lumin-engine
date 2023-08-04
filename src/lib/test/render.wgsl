struct VertexInput
{
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32
};

struct VertexOutput
{
    @builtin(position) pos: vec4f,
    @location(0) cell: vec2f
}

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> state: array<u32>;

@vertex
fn vertex(input: VertexInput) -> VertexOutput
{
    let i = f32(input.instance);
    let cell = vec2f(i % grid.x, floor(i / grid.x));
    let state = f32(state[input.instance]);

    let p = (input.pos * state + 1) / grid - 1 + cell / grid * 2;

    var output: VertexOutput;
    output.pos =  vec4f(p, 0, 1);
    output.cell = cell;

    return output;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f
{
    let c = input.cell / grid;
    return vec4f(c, 1 - c.x, 1);
}
