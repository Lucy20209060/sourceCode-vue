Vue 中 有三个内置的抽象组件 分别为 keep-alive transition 和 transition-group,他们都有一个共同的特点 就是自身不会渲染为一个DOM元素 也不会出现在父组件链中 

keep-alive 的作用 是包裹动态组件中 会缓存不活动的组件实例 而不是销毁它们 

该组件的定义 是在 src/core/components/keep-alive.js 文件中 它会在Vue初始化时 添加在Vue.option.components上 所以在所有组件中 都可以直接使用

```javascript
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    ...
  },

  created () {
    this.cache = Object.create(null)
  },

  destroyed () {
   ...
  },

  watch: {
    ...
  },

  render () {
    ...
  }
}
```