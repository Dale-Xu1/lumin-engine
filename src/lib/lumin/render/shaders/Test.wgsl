struct VertexInput
{
    @location(0) position: vec3f,
    @location(1) uv: vec2f
};

struct FragmentInput
{
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f
};

@group(0) @binding(0) var<uniform> view: mat4x4f;
@group(0) @binding(1) var<uniform> transform: mat4x4f;

@group(1) @binding(0) var texture: texture_2d<f32>;
@group(1) @binding(1) var textureSampler: sampler;

@vertex
fn vs(input: VertexInput) -> FragmentInput
{
    var output: FragmentInput;
    output.position = view * transform * vec4f(input.position, 1);
    output.uv = input.uv;

    return output;
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f
{
    return textureSample(texture, textureSampler, input.uv);
}
