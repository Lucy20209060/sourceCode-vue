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

  