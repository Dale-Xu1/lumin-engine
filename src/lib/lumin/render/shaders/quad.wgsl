struct VertexInput
{
    @location(0) pos: vec3f,
    @location(1) uv: vec2f
};

struct VertexOutput
{
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f
}

@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var s: sampler;

@vertex
fn vs(input: VertexInput) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = vec4f(input.pos, 1);
    output.uv = input.uv; 

    return output;
}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f
{
    return textureSample(texture, s, input.uv);
}
