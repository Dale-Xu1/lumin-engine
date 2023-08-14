struct VertexInput
{
    @location(0) position: vec3f
};

struct FragmentInput
{
    @builtin(position) position: vec4f
};

@group(0) @binding(0) var<uniform> view: mat4x4f;
@group(0) @binding(1) var<uniform> transform: mat4x4f;

@vertex
fn vs(input: VertexInput) -> FragmentInput
{
    var output: FragmentInput;
    output.position = view * transform * vec4f(input.position, 1);

    return output;
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f
{
    return vec4f(0, 0, 0, 1);
}
