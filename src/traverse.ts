// import { v4 } from 'uuid'
/// <reference path="../typings/cocos2d/cocos2d-lib.d.ts" />

declare var uuid: any
const { v4 } = uuid
// import {
//   Animation,
//   Assets,
//   Height1,
//   Width2,
//   Id,
//   ImageName,
//   ImagePath,
//   Id1,
//   Layers1,
//   Items,
// } from '../typings/animation'

interface Options {
  createShape(
    id: string,
    parentId: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ): any
  createLayer(id: string, width?: number, height?: number): any
  createSprite(id: string, name: string): any
  setPosition(id: string, parentId: string, x: number, y: number): any
  setAnchorPoint(id: string, x: number, y: number): any
  moveTo(id: string, parentId: string, time: number, x: number, y: number): any
  setContentSize(id: string, width: number, height: number): any
  addChild(id: string, parentId: string, localZOrder?: number): any
  getNode(id: string): cc.Node
}
// type Asset =
//   | {
//       h?: Height1
//       w?: Width2
//       id?: Id
//       p?: ImageName
//       u?: ImagePath
//       [k: string]: any
//     }
//   | {
//       id?: Id1
//       layers?: Layers1
//       [k: string]: any
//     }

export function traverse(data: any, containerId: string, options: Options) {
  const getTime = (time: number) => time / data.fr
  // const getTime = (time: number) => time

  let assets: {
    [id: string]: any
  }

  function getAsset(id: string) {
    if (!assets) {
      assets = {}
      for (let asset of data.assets) {
        if (asset.id) {
          assets[asset.id] = asset
        }
      }
    }
    return assets[id]
  }

  function _traverseShape(shape: any, parentId: string, node?: cc.DrawNode) {
    switch (shape.ty) {
      case Shape.group: {
        const node = new cc.DrawNode()
        options.getNode(parentId).addChild(node)
        for (let item of shape.it) {
          _traverseShape(item, parentId, node)
        }
      }
      case Shape.stroke: {
        if (node) {
          node.setColor(cc.color(shape.c.k.map((x: number) => x * 255)))
          node.width = shape.w.k
        }
      }
      case Shape.shape: {
        // const id = cid || v4()
        const id = v4()
        const c = (x: any) => {
          const { i, o, v } = x
          for (let j = 0; j < i.length - 1; j++) {
            options.createShape(
              id,
              parentId,
              v[j + 1][0],
              v[j + 1][1],
              i[j][0],
              i[j][1],
              o[j][0],
              o[j][1],
              v[j][0],
              v[j][1]
            )
          }
          // options.createShape(
          //   id,
          //   parentId,
          //   v[i.length - 1][0],
          //   v[i.length - 1][1],
          //   o[0][0],
          //   o[0][1],
          //   i[0][0],
          //   i[0][1],
          //   v[0][0],
          //   v[0][1]
          // )
        }
        if (shape.ks) {
          if (Array.isArray(shape.ks.k)) {
            c(shape.ks.k[0].s[0])
          } else {
            c(shape.ks.k)
            // const { v: [[x0, y0], [x1, y1]] } = shape.ks.k
          }
        }
      }
    }
  }

  // const converters = {
  //   shape(data) {

  //   }
  // }
  enum Layer {
    precomp = 0,
    solid = 1,
    image = 2,
    null = 3,
    shape = 4,
    text = 5,
  }

  enum Shape {
    ellipse = 'el',
    group = 'gr',
    shape = 'sh',
    transform = 'tr',
    stroke = 'st',
  }

  enum Effect {
    slider = 0,
    angle = 1,
    color = 2,
    point = 3,
    checkbox = 4,
    group = 5,
    dropDown = 7,
  }

  function _traverseEffect(effect: any, parentId: string) {
    switch (effect.ty) {
      case Effect.group: {
        for (let item of effect.ef) {
          _traverseEffect(item, parentId)
        }
      }
      case Effect.dropDown: {
      }
    }
  }

  function _applyTransform(
    layer: any,
    id: string,
    parentId: string,
    width: number,
    height: number,
    st: number,
    options: Options
  ) {
    const delay = cc.delayTime(getTime(st))

    const parseK = (k: any[]) => {
      return k.reduceRight(
        (result, item, i) => {
          const { s, e, to, ti, t } = item
          if (s) {
            result.arr.unshift({
              s,
              e,
              to,
              ti,
              t: getTime(result.nextTime - t),
              startTime: i === 0 ? getTime(t) : 0,
            })
          } else {
            // result.allTime = t
          }
          result.nextTime = t
          return result
        },
        {
          nextTime: null,
          // allTime: null,
          arr: [],
        }
      )
    }

    // anchor
    if (layer.ks.a && layer.ks.a.k) {
      const [x, y] = layer.ks.a.k
      if (typeof x === 'number' && typeof y === 'number') {
        // let { w = 10000, h = 10000 } = layer // FIXME:
        options.setAnchorPoint(id, x / width, 1 - y / height)
      }
    }

    // position
    if (layer.ks.p) {
      if (typeof layer.ks.p.k[0] === 'number') {
        var [x, y] = layer.ks.p.k
        options.setPosition(id, parentId, x, y)
      } else if (layer.ks.p.k.length) {
        let a: any = []
        const parentHeight = options.getNode(parentId).height
        options.setPosition(id, parentId, layer.ks.p.k[0].s[0], layer.ks.p.k[0].s[1])
        parseK(layer.ks.p.k).arr.forEach((x: any) => {
          a.push(
            cc.moveTo(x.startTime, cc.p(x.s[0], parentHeight - x.s[1])),
            cc.bezierTo(x.t, [
              cc.p(x.s[0] + x.to[0], parentHeight - (x.s[1] + x.to[1])),
              cc.p(x.ti[0] + x.e[0], parentHeight - (x.ti[1] + x.e[1])),
              cc.p(x.e[0], parentHeight - x.e[1]),
            ])
          )
        })
        a.unshift(delay)
        options.getNode(id).runAction(cc.sequence(a))
      }
    }

    // rotation
    if (layer.ks.r && layer.ks.r.k) {
      if (typeof layer.ks.r.k === 'number') {
        options.getNode(id).setRotation(layer.ks.r.k)
      } else if (typeof layer.ks.r.k[0] === 'number') {
        options.getNode(id).setRotation(layer.ks.r.k[0])
      } else {
        // console.log(layer.ks.r.k)
        let a: any = []
        options.getNode(id).setRotation(layer.ks.r.k[0].s[0])
        parseK(layer.ks.r.k).arr.forEach((x: any) => {
          a.push(cc.rotateTo(x.startTime, x.s[0]), cc.rotateTo(x.t, x.e[0]))
        })
        a.unshift(delay)
        options.getNode(id).runAction(cc.sequence(a))
      }
    }

    // scale
    if (layer.ks.s) {
      if (typeof layer.ks.s.k[0] === 'number') {
        options.getNode(id).setScale(layer.ks.s.k[0] / 100, layer.ks.s.k[1] / 100)
      } else {
        let a: any = []
        options.getNode(id).setScale(layer.ks.s.k[0].s[0] / 100, layer.ks.s.k[0].s[1] / 100)
        parseK(layer.ks.s.k).arr.forEach((x: any) => {
          a.push(
            cc.scaleTo(x.startTime, x.s[0] / 100, x.s[1] / 100),
            cc.scaleTo(x.t, x.e[0] / 100, x.e[1] / 100)
          )
        })
        a.unshift(delay)
        options.getNode(id).runAction(cc.sequence(a))
      }
    }
  }

  function _traverseLayer(layer: any, parentId: string, options: Options, st: number) {
    // console.log(layer.nm)
    // options.createLayer(id)

    switch (layer.ty) {
      case Layer.shape: {
        // const id = v4()
        // options.createLayer(id, 0, 0)
        // options.setPosition(id, parentId, layer.ks.p.k[0], layer.ks.p.k[1])
        // options.addChild(id, parentId)
        // for (let shape of layer.shapes) {
        //   _traverseShape(shape, id)
        // }
        break
      }
      case Layer.solid: {
        break
      }
      case Layer.image: {
        const id = layer.refId
        const asset = getAsset(id)
        if (!asset) break
        options.createSprite(id, asset.u + asset.p)
        options.setContentSize(id, asset.w, asset.h)
        // options.getNode(id).ignoreAnchorPointForPosition(false)
        // options.setAnchorPoint(id, layer.ks.a.k[0] / asset.w, layer.ks.a.k[1] / asset.h)
        // options.getNode(id).setPosition(layer.ks.p.k[0], layer.ks.p.k[1])
        options.addChild(id, parentId)
        _applyTransform(layer, id, parentId, asset.w, asset.h, st, options)

        break
      }
      case Layer.precomp: {
        const id = layer.refId
        const asset = getAsset(id)

        if (!asset) break

        // precomp
        options.createLayer(id, layer.w, layer.h)

        // size
        // options.setContentSize(id, layer.w || asset.w, layer.h || asset.h)

        if (layer.ks.s && layer.ks.s.k) {
          const [x, y] = layer.ks.s.k
          if (typeof x === 'number' && typeof y === 'number') {
          }
        }

        if (layer.ks.o) {
        }

        _applyTransform(layer, id, parentId, layer.w, layer.h, st, options)

        // effects
        if (layer.ef) {
          for (let item of layer.ef) {
            _traverseEffect(item, parentId)
          }
        }

        if (asset.layers) {
          for (let l of asset.layers) {
            _traverseLayer(l, id, options, st + (layer.st || 0))
          }
        }

        options.addChild(id, parentId)
        break
      }
    }
  }

  function _traverse(item: any, parentId: string, options: Options) {
    for (let layer of item.layers) {
      _traverseLayer(layer, parentId, options, 0)
    }
  }

  _traverse(data, containerId, options)
}
