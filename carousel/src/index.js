import assign from './assign'

const Slider = function (el, config) {
  this.el = el
  this.config = config
  this.sliderFl = document.querySelector(config.childSliders[0])
  this.sliderFr = document.querySelector(config.childSliders[1])
  this.sliderW = document.querySelector(el).clientWidth
  this.len = this.sliderFl.children.length - 2
  this.flW = this.sliderFl.clientWidth
  this.frW = this.sliderFr.clientWidth
  this.direction = 'left'
  this.timer = null
  this.index = 1
  this.minX = 0
  this.x = 0
  this.y = 0
  this.init()
}

Slider.prototype = {
  init() {
    const that = this
    const config = that.config

    // 滑屏时切换slider的最小偏移量
    that.minX = that.flW / config.distance

    // 因为rem和px的误差，重设容器的宽度
    that.sliderFl.parentNode.style.width = that.flW + 'px'
    that.sliderFr.parentNode.style.width = that.frW + 'px'

    // 容器内的子元素的总宽度
    that.sliderFl.style.width = ((that.len + 2) * that.flW) + 'px'
    that.sliderFr.style.width = ((that.len + 2) * that.frW) + 'px'

    // 初始化偏移到首个元素的位置
    that.sliderFl.style.webkitTransform = `translate3d(-${that.flW}px,0,0)`
    that.sliderFl.style.transform = `translate3d(-${that.flW}px,0,0)`
    that.sliderFr.style.webkitTransform = `translate3d(-${that.frW}px,0,0)`
    that.sliderFr.style.transform = `translate3d(-${that.frW}px,0,0)`

    if (config.isAutoPlay) {
      that.timer = setInterval(() => {
        that.play(config.direction)
        that.config.callback(that.index)
      }, config.interval)
    }

    that.bind()
  },
  calculatePos(e) {
    const that = this
    let x = e.changedTouches[0].clientX
    let y = e.changedTouches[0].clientY
    let xd = that.x - x
    let yd = that.y - y

    let axd = Math.abs(xd)
    let ayd = Math.abs(yd)

    return {
      deltaX: xd,
      deltaY: yd,
      absX: axd,
      absY: ayd
    }
  },
  play(dir) {
    const that = this
    const config = that.config
    const delayTime = config.delayTime
    document.querySelector(that.config.btns + ' .on').classList.remove('on')
    const btns = document.querySelectorAll(that.config.btns + ' li')
    if (dir === 'left') {
      if (that.direction === 'right') {
        that.direction = 'left'
      }
      that.translate(that.sliderFl, -(that.index + 1) * that.flW, delayTime)
      that.translate(that.sliderFr, -(that.index + 1) * that.frW, delayTime)

      const index = that.index === that.len ? 0 : that.index
      btns[index].classList.add('on')
    } else {
      that.translate(that.sliderFl, -(that.index - 1) * that.flW, delayTime)
      that.translate(that.sliderFr, -(that.index - 1) * that.frW, delayTime)

      const index = that.index === 1 ? that.len - 1 : that.index - 2
      btns[index].classList.add('on')
    }
  },
  translate(elm, dist, speed) {
    const el = elm.style
    el.webkitTransition = `-webkit-transform ${speed}ms ease-out`
    el.transition = `transform ${speed}ms ease-out`
    el.webkitTransform = `translate3d(${dist}px,0,0)`
    el.transform = `translate3d(${dist}px,0,0)`
  },
  bind() {
    const that = this
    const sliderWrap = document.querySelector(that.el)
    // 移动端事件
    const hasTouch = this.hasTouch = 'ontouchstart' in window
    const touchStart = hasTouch ? 'touchstart' : 'mousedown'
    const touchMove = hasTouch ? 'touchmove' : ''
    const touchEnd = hasTouch ? 'touchend' : 'mouseup'

    const touchEvent = {
      onStart(ev) {
        const point = that.hasTouch ? ev.touches[0] : ev
        that.x = point.clientX
        that.y = point.clientY
      },
      onMove(ev) {
        if (!that.x || !that.y || ev.touches.length > 1) {
          return
        }

        let pos = that.calculatePos(ev)
        const minDis = that.flW / that.config.distance
        if (pos.absX < minDis && pos.absY < minDis) {
          return
        }

        that.direction = pos.deltaX > 0 ? 'left' : 'right'
        if (pos.absX > pos.absY) {
          ev.preventDefault()
          if (that.config.isAutoPlay) clearInterval(that.timer)
          that.translate(that.sliderFl, -(that.index * that.flW) - (pos.deltaX * (that.flW / that.sliderW)))
          that.translate(that.sliderFr, -(that.index * that.frW) - (pos.deltaX * (that.frW / that.sliderW)))
        }
      },
      onEnd(ev) {
        ev.preventDefault()
        that.play(that.direction)
        if (that.config.isAutoPlay) {
          that.timer = setInterval(() => {
            that.play(that.config.direction)
            that.config.callback(that.index)
          }, that.config.interval)
        }
        if (that.config.callback) {
          let i = that.index
          if (that.direction === 'right') {
            if (that.index === 1) {
              i = that.len - 1
            } else {
              i = that.index - 2
            }
          }
          that.config.callback(i)
        }
      }
    }

    sliderWrap.addEventListener(touchStart, touchEvent.onStart)
    sliderWrap.addEventListener(touchMove, touchEvent.onMove)
    sliderWrap.addEventListener(touchEnd, touchEvent.onEnd)

    that.sliderFl.addEventListener('webkitTransitionEnd', () => {
      if (that.direction === 'left') {
        if (that.index <= that.len) {
          that.index++
        }
        if (that.index > that.len) {
          that.translate(that.sliderFl, -that.flW, 0)
          that.translate(that.sliderFr, -that.frW, 0)
          that.index = 1
        }
      }

      if (that.direction === 'right') {
        if (that.index === 1) {
          that.translate(that.sliderFl, -(that.len * that.flW), 0)
          that.translate(that.sliderFr, -(that.len * that.frW), 0)
          that.index = that.len
        } else {
          that.index--
        }
      }
    })
  }
}

const defaults = {
  // 轮播图DOM
  childSliders: ['.carousel-logo ul', '.carousel-news ul'],
  // 轮播图的切换小圆点DOM
  btns: '.slider-dot',
  // 是否显示切换小圆点
  isShowBtns: true,
  // 是否自动播放
  isAutoPlay: true,
  // 切换的速度
  delayTime: 500,
  // 切换一次的时间间隔
  interval: 5000,
  // 滑屏时切换slider的最小偏移量
  // 计算方式：轮播图子容器的宽度/distance
  distance: 3,
  // 自动播放的方向，默认向左
  direction: 'left',
  callback: () => {}
}

export default function slider(container, config) {
  let opts = assign({}, defaults, config)
  new Slider(container, opts)
}
