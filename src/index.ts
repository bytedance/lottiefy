import {
  Actions,
  LayerType,
  Shape,
  Effect,
  ArrayColor,
  Keyframe,
  Point,
  BezierPoints,
  PositionAnimationData,
  SimpleKeyframe,
  SimpleAnimationData,
  BezierShape,
  ArrayPoint,
  ShapeKeyframe,
  ShapeAnimationData,
  AnimationData,
  Asset,
  Layer,
  ImageAsset,
  PrecompAsset,
} from './types'
import { getId } from './utils'

export type Options = {
  /**
   * JSON data exported by Bodymovin
   */
  data: AnimationData
  /**
   * Id of container to render
   */
  containerId: string
  actions: Actions
  reverseY: boolean
  /**
   * Play speed
   */
  speed: number
  /**
   * Custom id generate function
   */
  generateId: () => string

  layerFilter: (layer: Layer) => boolean
}

export default class LottieRenderer {
  private data: AnimationData
  private containerId: string // Container
  private actions: Actions
  private assets: { [key: string]: Asset }
  private generateId: Options['generateId']
  private layerFilter: Options['layerFilter']
  speed: number

  /**
   * Some engine like Cocos2dx's Y coordinate
   */
  private reverseY: boolean

  constructor({
    data,
    containerId,
    actions,
    reverseY = false,
    generateId = getId,
    speed = 1,
    layerFilter = () => true,
  }: Options) {
    this.data = data
    this.assets = {}
    // Convert assets to a map for easily accessing
    for (let asset of data.assets) {
      this.assets[asset.id] = asset
    }

    this.containerId = containerId
    this.actions = actions
    this.reverseY = reverseY
    this.generateId = generateId
    this.speed = speed
    this.layerFilter = layerFilter
  }

  private _getCorrectY(y: number, parentHeight: number) {
    return this.reverseY ? parentHeight - y : y
  }

  private _getTime(frame: number) {
    return frame / this.data.fr / this.speed
  }

  setSpeed(speed: number) {
    this.speed = speed
  }

  generateAnimations() {
    for (let layer of this.data.layers) {
      this._traverseLayer(layer, this.containerId, 0, this.data.w, this.data.h)
    }
  }

  // TODO: Effects
  // _traverseEffect(data: any, parentId: string, node: cc.DrawNode) {
  //   switch (data.ty) {
  //     case Effect.group: {
  //       if (data.mn === 'ADBE Gaussian Blur 2') {
  //       }
  //       for (let item of data.ef) {
  //         this._traverseEffect(item, parentId, node)
  //       }
  //     }
  //     case Effect.dropDown: {
  //     }
  //   }
  // }

  // TODO: Shapes
  // private _traverseShape(
  //   data: any,
  //   parentId: string,
  //   parentWidth: number,
  //   parentHeight: number,
  //   id?: string,
  //   payload?: any,
  // ) {
  //   switch (data.ty) {
  //     case Shape.group: {
  //       const id = this.generateId()
  //       const payload: {
  //         id: string
  //         stroke: { width: number; color: Color }
  //         shape: BezierPoints[]
  //         shapeKeyframes: ShapeAnimationData[]
  //         ellipse: any
  //         transform: any
  //       } = {
  //         id,
  //         stroke: { width: 0, color: [0, 0, 0, 0] },
  //         shape: [],
  //         shapeKeyframes: [],
  //         ellipse: null,
  //         transform: null,
  //       }
  //       for (let item of data.it) {
  //         this._traverseShape(item, parentId, parentWidth, parentHeight, id, payload)
  //       }
  //       this.actions.createShape(id, payload.stroke.width)
  //       this.actions.appendChild(id, parentId)
  //       payload.shape.forEach(item => {
  //         this.actions.drawCubicBezier(id, item, payload.stroke.width, payload.stroke.color)
  //       })
  //       payload.shapeKeyframes.forEach(item => {
  //         this.actions.drawCubicBezierAnimation(
  //           id,
  //           item,
  //           payload.stroke.width,
  //           payload.stroke.color,
  //         )
  //       })
  //       // if (payload.ellipse) {
  //       //   let [x, y] = payload.transform.p.k
  //       //   const center = { x, y: -y }
  //       //   const [rx, ry] = payload.ellipse.s.k
  //       //   this.actions.drawEllipse(
  //       //     id,
  //       //     center,
  //       //     rx,
  //       //     ry,
  //       //     0,
  //       //     100,
  //       //     true,
  //       //     payload.stroke.width,
  //       //     payload.stroke.color,
  //       //     payload.fill.color,
  //       //   )
  //       // }

  //       break
  //       // options.curveAnimate(id, 10, { r: 255, g: 0, b: 0, a: 255 }, d.data)
  //     }
  //     case Shape.stroke: {
  //       if (id) {
  //         payload.stroke = {
  //           width: data.w.k,
  //           color: convertColor(data.c.k),
  //         }
  //       }
  //       break
  //     }
  //     case Shape.shape: {
  //       if (id && payload && data.ks) {
  //         if (Array.isArray(data.ks.k)) {
  //           const keyframes = data.ks.k as ShapeKeyframe[]
  //           let d: ShapeAnimationData[] = []
  //           keyframes.slice(0, -1).forEach((keyframe, i) => {
  //             d.push({
  //               delay: i === 0 ? this._getTime(keyframe.t) : 0,
  //               duration: this._getTime(keyframes[i + 1].t - keyframe.t),
  //               start: this._convertBezierShapeToPoints(keyframe.s[0], parentHeight),
  //               end: this._convertBezierShapeToPoints(keyframe.e[0], parentHeight),
  //             })
  //           })
  //           payload.shapeKeyframes = d
  //         } else {
  //           const x = data.ks.k as BezierShape
  //           payload.shape = this._convertBezierShapeToPoints(x, parentHeight)
  //         }
  //       }
  //       break
  //     }
  //     case Shape.transform:
  //       payload.transform = data
  //       break
  //     case Shape.ellipse:
  //       payload.ellipse = data
  //       break
  //     case Shape.fill:
  //       payload.fill = {
  //         color: convertColor(data.c.k),
  //         opacity: data.o.k,
  //       }
  //       break
  //     case Shape.merge:
  //       break
  //     default:
  //     // console.log(data.ty)
  //   }
  // }

  private _convertBezierShapeToPoints(
    bezierShape: BezierShape,
    parentHeight: number,
  ) {
    const result: BezierPoints[] = []
    for (let j = 0; j < bezierShape.v.length - 1; j++) {
      result.push(
        this._convertBezierArray(
          [
            bezierShape.v[j],
            bezierShape.o[j],
            bezierShape.i[j + 1],
            bezierShape.v[j + 1],
          ],
          parentHeight,
        ),
      )
    }
    return result
  }

  /**
   * Convert bezier points coordinate to absolute
   */
  private _convertBezierArray(
    points: [ArrayPoint, ArrayPoint, ArrayPoint, ArrayPoint],
    parentHeight: number,
  ): BezierPoints {
    return [
      {
        x: points[0][0],
        y: this._getCorrectY(points[0][1], parentHeight),
      },
      {
        x: points[0][0] + points[1][0],
        y: this._getCorrectY(points[0][1] + points[1][1], parentHeight),
      },
      {
        x: points[2][0] + points[3][0],
        y: this._getCorrectY(points[2][1] + points[3][1], parentHeight),
      },
      { x: points[3][0], y: this._getCorrectY(points[3][1], parentHeight) },
    ]
  }

  /**
   * Simple keyframe, like opacity, anchor and scale
   * @param keyframes
   */
  private _parseSimpleKeyframe(
    keyframes: SimpleKeyframe[],
    startFrame: number,
  ): SimpleAnimationData[] {
    let data: SimpleAnimationData[] = []
    keyframes.slice(0, -1).forEach((keyframe, i) => {
      data.push({
        delay: i === 0 ? this._getTime(keyframe.t + startFrame) : 0,
        duration: this._getTime(keyframes[i + 1].t - keyframe.t),
        start: keyframe.s,
        end: keyframe.e,
      })
    })
    return data
  }

  /**
   * Position keyframe, calculated with Bezier curve
   * @param keyframes
   * @param parentHeight
   */
  private _parsePositionKeyframe(
    keyframes: Keyframe[],
    startFrame: number,
    parentHeight: number,
  ): PositionAnimationData[] {
    let data: PositionAnimationData[] = []
    keyframes.slice(0, -1).forEach((keyframe, i) => {
      data.push({
        delay: i === 0 ? this._getTime(keyframe.t + startFrame) : 0,
        duration: this._getTime(keyframes[i + 1].t - keyframe.t),
        points: this._convertBezierArray(
          [keyframe.s, keyframe.to, keyframe.ti, keyframe.e],
          parentHeight,
        ),
      })
    })
    return data
  }

  private _applyTransform(
    layer: Layer,
    id: string,
    parentId: string,
    width: number,
    height: number,
    parentWidth: number,
    parentHeight: number,
    startFrame: number,
  ) {
    this.actions.delayShow(id, this._getTime(layer.st))

    // Opacity
    // if (layer.ks.o) {
    const { k } = layer.ks.o
    // as SimpleKeyframe[]
    if (typeof k === 'number') {
      this.actions.setOpacity(id, { opacity: k })
    } else if (k.length) {
      this.actions.setOpacity(id, { opacity: k[0].s[0] })
      this.actions.setOpacityAnimation(
        id,
        this._parseSimpleKeyframe(k, startFrame),
      )
    }
    // }

    // Anchor
    // if (layer.ks.a && layer.ks.a.k) {
    const [x, y] = layer.ks.a.k
    if (typeof x === 'number' && typeof y === 'number') {
      this.actions.setAnchor(id, {
        x: x / width,
        y: this._getCorrectY(y, height) / height,
        ax: x,
        ay: this._getCorrectY(y, height),
      })
    } else {
      console.log('Anchor error: ', id, layer.ks.a)
    }
    // }

    // Position
    if (layer.ks.p) {
      const { k } = layer.ks.p
      if (typeof k[0] === 'number') {
        this.actions.setPosition(id, {
          x: k[0],
          y: this._getCorrectY(k[1], parentHeight),
        })
      } else if (k.length) {
        this.actions.setPosition(id, {
          x: k[0].s[0],
          y: this._getCorrectY(k[0].s[1], parentHeight),
        })
        this.actions.setPositionAnimation(
          id,
          this._parsePositionKeyframe(k, startFrame, parentHeight),
        )
      }
    }

    // Rotation
    if (layer.ks.r && layer.ks.r.k) {
      const { k } = layer.ks.r
      if (typeof k === 'number') {
        this.actions.setRotation(id, { rotation: k })
      } else if (typeof k[0] === 'number') {
        this.actions.setRotation(id, { rotation: k[0] })
      } else {
        this.actions.setRotation(id, { rotation: k[0].s[0] })
        this.actions.setRotationAnimatation(
          id,
          this._parseSimpleKeyframe(k, startFrame),
        )
      }
    }

    // Scale
    if (layer.ks.s) {
      const { k } = layer.ks.s
      if (typeof k[0] === 'number') {
        const [x, y] = k
        this.actions.setScale(id, { x, y })
      } else {
        const [x, y] = k[0].s
        this.actions.setScale(id, { x, y })
        this.actions.setScaleAnimatation(
          id,
          this._parseSimpleKeyframe(k, startFrame),
        )
      }
    }
  }

  private _traverseLayer(
    layer: Layer,
    parentId: string,
    startFrame: number,
    parentWidth: number,
    parentHeight: number,
  ) {
    if (!this.layerFilter(layer)) return

    switch (layer.ty) {
      case LayerType.shape: {
        // const id = this.generateId()
        // same width and height as parent
        // options.createLayer(id, parentWidth, parentHeight)
        // this.actions.createPrecomp(id, { width: 0, height: 0 })
        // this._applyTransform(
        //   layer,
        //   id,
        //   parentId,
        //   parentWidth,
        //   parentHeight,
        //   parentWidth,
        //   parentHeight,
        //   startFrame,
        // )
        // this.actions.appendChild(id, parentId)
        // TODO: Shape parser is not ready
        // for (let shape of layer.shapes) {
        //   this._traverseShape(shape, id, parentWidth, parentHeight)
        // }
        break
      }
      case LayerType.solid:
        break
      case LayerType.image: {
        const id = this.generateId()
        layer.xid = id
        const asset = this.assets[layer.refId] as ImageAsset
        // if (!asset) break
        this.actions.createImage(id, {
          path: asset.u,
          name: asset.p,
          width: asset.w,
          height: asset.h,
        })
        this.actions.hide(id)
        this.actions.appendChild(id, parentId)
        this._applyTransform(
          layer,
          id,
          parentId,
          asset.w,
          asset.h,
          parentWidth,
          parentHeight,
          startFrame,
        )

        break
      }
      case LayerType.null:
      case LayerType.precomp: {
        const id = this.generateId()
        layer.xid = id
        const getLayerWidthAndHeight = (l: any) => {
          if (l.ty === LayerType.null) {
            // FIXME: Assume null layer's width and height
            return l.ks.a.k.map((x: number) => x * 2)
          } else {
            if (!l.w) return [0, 0]
            return [l.w, l.h]
          }
        }
        const [width, height] = getLayerWidthAndHeight(layer)
        this.actions.createPrecomp(id, { width, height })
        this.actions.hide(id)

        this._applyTransform(
          layer,
          id,
          parentId,
          width,
          height,
          parentWidth,
          parentHeight,
          startFrame,
        )

        // TODO: Effects is not ready
        // if (layer.ef) {
        //   for (let item of layer.ef) {
        //     this._traverseEffect(item, parentId)
        //   }
        // }

        const asset = this.assets[layer.refId] as PrecompAsset
        if (asset && asset.layers) {
          // Need
          // FIXME: parent before child
          const sortedLayers = []
          const indexIdMapping: any = {}
          for (let l of asset.layers) {
            if (l.parent) {
              sortedLayers.push(l)
            } else {
              sortedLayers.unshift(l)
            }
            if (l.ind) {
              indexIdMapping[l.ind] = l
            }
          }

          for (let l of sortedLayers) {
            let correctId, parentWidth, parentHeight
            if (l.parent) {
              const parent = indexIdMapping[l.parent]
              correctId = parent.xid
              ;[parentWidth, parentHeight] = getLayerWidthAndHeight(parent)
            } else {
              correctId = id
              parentWidth = width
              parentHeight = height
            }

            this._traverseLayer(
              l,
              correctId,
              startFrame + layer.st,
              parentWidth,
              parentHeight,
            )
          }
        }

        if (!parentId) {
          console.log(layer)
        }
        this.actions.appendChild(id, parentId)
        break
      }
    }
  }
}
