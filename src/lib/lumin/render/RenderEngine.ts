// TODO: Draw call to render pass conversion

export default class RenderEngine
{

    public constructor(canvas: HTMLCanvasElement)
    {
        let width = window.innerWidth, height = window.innerHeight
        let ratio = window.devicePixelRatio

        canvas.width = width * ratio
        canvas.height = height * ratio
    }

}
