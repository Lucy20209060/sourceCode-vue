几个内置指令

    v-text

v-text的用法很简单

```html
<span v-text="msg"></span>
<span>{{msg}}</span>
```

和左右普通指令一样 在生成 ast 时 v-text 会被解析到 el.directives 中 但在生成 render 函数的过程中 在解析属性时 我们会首要分析指令

genDirectives 方法中有如下一段代码

```javascript
const gen: DirectiveFunction = platformDirectives[dir.name] || baseDirectives[dir.name]
if (gen) {
  // compile-time directive that manipulates AST.
  // returns true if it also needs a runtime counterpart.
  needRuntime = !!gen(el, dir, warn)
}
if (needRuntime) {
  hasRuntime = true
  res += `...`
}
```

directives概述中 我们提到 platformDirectives 和 baseDirectives 会对部分指令进行处理 v-text 就是其中之一

最终的 gen 函数如下所示

```javascript
export default function text (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    addProp(el, 'textContent', `_s(${dir.value})`)
  }
}
```

该函数返回的是 undefined 所以 needRuntime 最终是 false 所以该结果不会添加到 res 上

addProp 的定义如下

```javascript
export function addProp (el: ASTElement, name: string, value: string) {
  (el.props || (el.props = [])).push({ name, value })
}
```

它会给 el.props 数组中添加一个对象 对象里保存的 name 和 value

```javascript
// DOM props
if (el.props) {
  data += `domProps:{${genProps(el.props)}},`
}
```

最终 会添加到 domProps 对应的数组中 上面例子中的 span 最终生成的 render 函数如下

    _c('span',{domProps:{"textContent":_s(msg)}})

在 patch 过程中的处理 和其他 data 中的数据一样 是通过钩子函数处理的

```javascript
function updateDOMProps (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.domProps && !vnode.data.domProps) {
    return
  }
  let key, cur
  const elm: any = vnode.elm
  const oldProps = oldVnode.data.domProps || {}
  let props = vnode.data.domProps || {}
  // clone observed objects, as the user probably wants to mutate it
  if (props.__ob__) {
    props = vnode.data.domProps = extend({}, props)
  }

  for (key in oldProps) {
    if (props[key] == null) {
      elm[key] = ''
    }
  }
  for (key in props) {
    cur = props[key]
    if (key === 'textContent' || key === 'innerHTML') {
      if (vnode.children) vnode.children.length = 0
      if (cur === oldProps[key]) continue
    }

    if (key === 'value') {
      // store value as _value as well since
      // non-string values will be stringified
      elm._value = cur
      // avoid resetting cursor position when value is the same
      const strCur = cur == null ? '' : String(cur)
      if (shouldUpdateValue(elm, vnode, strCur)) {
        elm.value = strCur
      }
    } else {
      elm[key] = cur
    }
  }
}
```

