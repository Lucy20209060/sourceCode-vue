v-show 功能很简单 就是控制元素是否显示 v-show 的实现也比较简单 走的完全是自定义指令的一套 它内置在 Vue.option.directives 上

所以要看 v-show 的实现 其实就是看它各个钩子函数的实现 代码见 src/platforms/web/runtimes/directives/show.js

```javascript
  bind (el: any, { value }: VNodeDirective, vnode: VNodeWithData) {
    vnode = locateNode(vnode)
    const transition = vnode.data && vnode.data.transition
    const originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display
    if (value && transition) {
      vnode.data.show = true
      enter(vnode, () => {
        el.style.display = originalDisplay
      })
    } else {
      el.style.display = value ? originalDisplay : 'none'
    }
  }
  ```

locateNode 是对自定义组件的 vnode 进行处理 获取真实dom元素的 vnode 如果当前元素包裹在 transition 组件中 说明我们添加了过渡的动画 此时 transition 值不为空

vnode.data.show是一个标示，用于在过渡中对v-show的特殊处理。

el.__vOriginalDisplay是保存元素显示时display的值是什么。如果value返回true（说明显示）且有动画且非IE9（IE9不支持动画），则执行显示动画，后设置el.style.display值。

否则，直接通过value的值，设置它的展现还是隐藏。

update

```javascript
update (el: any, { value, oldValue }: VNodeDirective, vnode: VNodeWithData) {
    if (value === oldValue) return
    vnode = locateNode(vnode)
    const transition = vnode.data && vnode.data.transition
    if (transition && !isIE9) {
      vnode.data.show = true
      if (value) {
        enter(vnode, () => {
          el.style.display = el.__vOriginalDisplay
        })
      } else {
        leave(vnode, () => {
          el.style.display = 'none'
        })
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none'
    }
  }
```

update是在页面diff之后调用，大体上的流程和bind类似，只不过这里多了一个消失时的动画处理。

unbind

```javascript
unbind (
  el: any,
  binding: VNodeDirective,
  vnode: VNodeWithData,
  oldVnode: VNodeWithData,
  isDestroy: boolean
) {
  if (!isDestroy) {
    el.style.display = el.__vOriginalDisplay
  }
}
```

unbind中只做了一个处理，如果isDestroy返回false，说明我们当前的dom元素并没有真实销毁（diff过程中被复用），只是vnode中没有v-show的指令，这时，设置el.style.display等于初始值。这个地方为什么这样做，主要是为了解决一个bug，整个bug的缘由，里面已经表述的很清晰。