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

name不用多说，abstract: true这个条件我们自己定义组件时通常不会用，它是用来标识当前的组件是一个抽象组件，它自身不会渲染一个真实的DOM元素。比如在创建两个vm实例之间的父子关系时，会跳过抽象组件的实例:

```javascript
let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
}
```

props 表示我们可以传入 include 来匹配哪些组件可以缓存 exclude 来匹配哪些组件不缓存

created 钩子函数调用时 会创建一个 this.cache 对象用户缓存他的钩子组件
