struct VertexInput
{
    @location(0) pos: vec3f,
};

struct VertexOutput
{
    @builtin(position) pos: vec4f,
}

@vertex
fn vs(input: VertexInput) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = vec4f(input.pos.x * 0.5, input.pos.y * 0.5, 0, 1);

    return output;
}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f
{
    return vec4f(1, 1, 1, 1);
}
