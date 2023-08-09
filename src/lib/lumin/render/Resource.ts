import type Device from "./Device"

export default interface Resource
{

    getBinding(): GPUBindingResource

}

type BufferData = Int32Array | Uint32Array | Float32Array
export class Buffer implements Resource
{

    private readonly device: GPUDevice
    public readonly buffer: GPUBuffer

    public readonly length: number

    public constructor(device: Device, usage: GPUBufferUsageFlags, length: number)
    public constructor(device: Device, buffer: GPUBuffer)
    public constructor({ device }: Device, buffer: GPUBuffer | GPUBufferUsageFlags, length?: number)
    {
        const ELEMENT_SIZE = 4

        this.device = device
        if (typeof(buffer) === "number")
        {
            let usage = buffer

            this.length = length!
            this.buffer = device.createBuffer({ size: ELEMENT_SIZE * this.length, usage })
        }
        else
        {
            this.buffer = buffer
            this.length = buffer.size / ELEMENT_SIZE
        }
    }

    public write(data: BufferData, offset: number = 0)
    {
        this.device.queue.writeBuffer(this.buffer, offset, data)
    }

    public getBinding(): GPUBindingResource { return { buffer: this.buffer } }

}

export const enum TextureFormat
{
    R_UNORM  = "r8unorm",  RG_UNORM  = "rg8unorm",  RGBA_UNORM  = "rgba8unorm",
    R_SNORM  = "r8snorm",  RG_SNORM  = "rg8snorm",  RGBA_SNORM  = "rgba8snorm",
    R_U8     = "r8uint",   RG_U8     = "rg8uint",   RGBA_U8     = "rgba8uint",
    R_I8     = "r8sint",   RG_I8     = "rg8sint",   RGBA_I8     = "rgba8sint",

    R_U16    = "r16uint",  RG_U16    = "rg16uint",  RGBA_U16    = "rgba16uint",
    R_I16    = "r16sint",  RG_I16    = "rg16sint",  RGBA_I16    = "rgba16sint",
    R_F16    = "r16float", RG_F16    = "rg16float", RGBA_F16    = "rgba16float",

    R_U32    = "r32uint",  RG_U32    = "rg32uint",  RGBA_U32    = "rgba32uint",
    R_I32    = "r32sint",  RG_I32    = "rg32sint",  RGBA_I32    = "rgba32sint",
    R_F32    = "r32float", RG_F32    = "rg32float", RGBA_F32    = "rgba32float",

    DEPTH24 = "depth24plus", DEPTH32 = "depth32float", DEPTH24_STENCIL8 = "depth24plus-stencil8"
}

type TextureData =
    | Int8Array  | Uint8Array
    | Int16Array | Uint16Array
    | Int32Array | Uint32Array | Float32Array
export class Texture implements Resource
{

    private static getBytes(format: TextureFormat): number
    {
        switch (format)
        {
            case TextureFormat.R_UNORM:    case TextureFormat.R_SNORM:
            case TextureFormat.R_U8:       case TextureFormat.R_I8:
                return 1

            case TextureFormat.RG_UNORM:   case TextureFormat.RG_SNORM:
            case TextureFormat.RG_U8:      case TextureFormat.RG_I8:
            case TextureFormat.R_U16:      case TextureFormat.R_I16:    case TextureFormat.R_F16:
                return 2

            case TextureFormat.RGBA_UNORM: case TextureFormat.RGBA_SNORM:
            case TextureFormat.RGBA_U8:    case TextureFormat.RGBA_I8:
            case TextureFormat.RG_U16:     case TextureFormat.RG_I16:   case TextureFormat.RG_F16:
            case TextureFormat.R_U32:      case TextureFormat.R_I32:    case TextureFormat.R_F32:
            case TextureFormat.DEPTH24:    case TextureFormat.DEPTH32:  case TextureFormat.DEPTH24_STENCIL8:
                return 4

            case TextureFormat.RGBA_U16:   case TextureFormat.RGBA_I16: case TextureFormat.RGBA_F16:
            case TextureFormat.RG_U32:     case TextureFormat.RG_I32:   case TextureFormat.RG_F32:
                return 8

            case TextureFormat.RGBA_U32:   case TextureFormat.RGBA_I32: case TextureFormat.RGBA_F32:
                return 16
        }
    }


    private readonly device: GPUDevice
    public readonly texture: GPUTexture

    public readonly size: [number, number, number]

    public get format(): TextureFormat { return this.texture.format as TextureFormat }
    public get view(): GPUTextureView { return this.texture.createView() }

    public constructor(device: Device, texture: GPUTexture)
    public constructor(device: Device, format: TextureFormat, usage: GPUTextureUsageFlags,
        size: [number, number?, number?], samples?: number)
    public constructor({ device }: Device, texture: GPUTexture | TextureFormat,
        usage?: GPUTextureUsageFlags, size?: [number, number?, number?], samples?: number)
    {
        this.device = device
        if (typeof(texture) === "string")
        {
            let format = texture, [x, y = 1, z = 1] = size!

            this.size = [x, y, z]
            this.texture = device.createTexture({ size: this.size, format, usage: usage!, sampleCount: samples })
        }
        else
        {
            this.texture = texture
            this.size = [texture.width, texture.height, texture.depthOrArrayLayers]
        }
    }

    public write(data: TextureData)
    {
        let width = this.size[0] * Texture.getBytes(this.format)
        this.device.queue.writeTexture({ texture: this.texture }, data, { bytesPerRow: width }, this.size)
    }

    public getBinding(): GPUBindingResource { return this.view }

}

export const enum SamplerAddressMode { REPEAT = "repeat", MIRROR_REPEAT = "mirror-repeat", CLAMP = "clamp-to-edge" }
export const enum SamplerFilterMode { NEAREST = "nearest", LINEAR = "linear" }

export interface SamplerParams
{

    addressU?: SamplerAddressMode
    addressV?: SamplerAddressMode
    addressW?: SamplerAddressMode

    mag?: SamplerFilterMode
    min?: SamplerFilterMode
    mipmap?: SamplerFilterMode

}

export class Sampler implements Resource
{
    
    private readonly sampler: GPUSampler

    public constructor({ device }: Device,
    {
        addressU = SamplerAddressMode.CLAMP,
        addressV = SamplerAddressMode.CLAMP,
        addressW = SamplerAddressMode.CLAMP,

        mag = SamplerFilterMode.NEAREST,
        min = SamplerFilterMode.NEAREST,
        mipmap = SamplerFilterMode.NEAREST
    }: SamplerParams = {})
    {
        this.sampler = device.createSampler(
        {
            addressModeU: addressU, addressModeV: addressV, addressModeW: addressW,
            magFilter: mag, minFilter: min, mipmapFilter: mipmap
        })
    }

    public getBinding(): GPUBindingResource { return this.sampler }

}
