```html
<div id="app">
  <p>{{message}}</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      message: '第一个vue实例'
    }
  })
</script>
```

创建对象 先从构造函数看起 构造函数在 src/core/install/index.js 中

```javascript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

首先判断是不是通过new关键字创建 然后调用了this._init(options) _init函数是在 src/core/instance/init.js中添加的

this._init

```javascript
Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
  ```

一进来 给当前的vm添加一个唯一的_uid 然后vm._isVue设为true(监听对象变化时用于过滤vm)

_isComponent是内部创建子组件时才会添加为true的属性 我们的例子直接走进else里面mergeOptions用于合并两个对象 不同于Object.assign的简单合并 它还对数据做了一系列的操作 且源码中多次用到该方法 所以后面会详细讲解该方法

resolveConstructorOptions方法在Vue.extend中做了详细的解释 它的作用是合并构造器及构造器父级上定义的options

```javascript
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 有super属性 说明Ctor是通过Vue.extend()方法创建的子类
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
```

这里的Ctor就是vm.constructor 也就是vue对象 在上一篇中 我们提到 在 /src/core/global-api/index 中

我们给Vue添加了一些全局的属性或方法

```javascript
Vue.options = Object.create(null)
ASSET_TYPES.forEach(type => {
  Vue.options[type + 's'] = Object.create(null)
})

// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue

extend(Vue.options.components, builtInComponents)
```

所以这里打印Ctor.options 如下所示

```javascript
Ctor.options = {
  components: {
    KeepAlive,
    Transition,
    TransitionGroup
  },
  directives: {
    model,
    show
  },
  filters: {},
  _base: Vue
}
```

Ctor.super是在调用Vue.extend时 才会添加的属性 这里先直接跳过

所以mergeOptions的第一个参数就是上面的Ctor.options 第二个参数是我们传入的options 第三个参数是当前对象vm

mergeOptions

mergeOptions是Vue中处理属性的合并策略的地方

```javascript
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
  	// 如果有options.components，则判断是否组件名是否合法
    checkComponents(child)
  }
  // 格式化child的props
  normalizeProps(child)
  // 格式化child的directives
  normalizeDirectives(child)
  // options.extends
  const extendsFrom = child.extends 
  if (extendsFrom) {
    parent = typeof extendsFrom === 'function'
      ? mergeOptions(parent, extendsFrom.options, vm)
      : mergeOptions(parent, extendsFrom, vm)
  }
  // options.mixins
  if (child.mixins) { 
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      let mixin = child.mixins[i]
      if (mixin.prototype instanceof Vue) {
        mixin = mixin.options
      }
      parent = mergeOptions(parent, mixin, vm)
    }
  }
  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

前面和compoment props directives extends minxins相关的内容我们暂且忽略 optionMergeStrategies对象 来让我们手动去控制属性的合并策略 这里的starts[key]就是key属性的合并方法

```javascript
function mergeAssets (parentVal: ?Object, childVal: ?Object): Object {
  const res = Object.create(parentVal || null)
  return childVal
    ? extend(res, childVal)
    : res
}

config._assetTypes.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})
```

_assetTypes就是component diretives filters 这三个的合并策略都一样 这里我们都返回了parentVal的一个子对象

data属性的合并策略 也是Vue内置 如下