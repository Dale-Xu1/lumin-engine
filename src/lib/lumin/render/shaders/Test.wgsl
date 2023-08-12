struct VertexInput
{
    @location(0) pos: vec3f
};

struct FragmentInput
{
    @builtin(position) pos: vec4f
};

@group(0) @binding(0) var<uniform> view: mat4x4f;

@vertex
fn vs(input: VertexInput) -> FragmentInput
{
    var output: FragmentInput;
    output.pos = view * vec4f(input.pos, 1);

    return output;
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f
{
    return vec4f(1, 1, 1, 1);
}
