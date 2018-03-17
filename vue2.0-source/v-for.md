v-for是最常用的指令之一

示例：

```html
<div id="app">
  <p v-for="(value, key, index) in object">{{ index }}. {{ key }} : {{ value }}</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      object: {
        height: '178cm',
        weight: '80kg',
        gender: 'male',
        address: 'BeiJing'
      }
    }
  })
</script>
```
从src/compiler/parse/index.js文件入手 在start函数中 对于`v-for`指令 我们通过processFor方法来进行解析

```javascript
export function processFor (el: ASTElement) {
  let exp
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    const res = parseFor(exp)
    if (res) {
      extend(el, res)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `Invalid v-for expression: ${exp}`
      )
    }
  }
}

type ForParseResult = {
  for: string;
  alias: string;
  iterator1?: string;
  iterator2?: string;
};

export function parseFor (exp: string): ?ForParseResult {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  const res = {}
  res.for = inMatch[2].trim()
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '')
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    res.alias = alias
  }
  return res
}
```

getAndRemoveAttr 功能是删除 v-for 属性 并返回该属性对应的值 这里exp的值为（value,ley,index） in object 

之前提到 forAliasRE

```javascript
export const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/
```

从正则可以知道 v-for 中 使用 in 或者 of 是完全 一致的

匹配之后 inMatch的值为`["(value,key,index) in object","(value,key,index)","object",index:0,input:"(value,key,index) in object"]`

所以 el.for 中保存的就是我们要遍历的对象或数组或数字或字符串

再来看 forIteratorRE

```javascript
export const forIteratorRE = /\((\{[^}]*\}|[^,]*),([^,]*)(?:,([^,]*))?\)/
```

v-for 可以有一下形式

    v-for="item in items"
    v-for="(item, index) in items"
    v-for="(value, key, index) in object"

value是属性值 key是属性名 index是索引值

所以经过静态内容处理后的 p 标签对应 ast 结构为

```json
{
  alias: "value",
  attrsList: [],
  attrsMap: {v-for: "(value, key, index) in object"},
  children: [{
    expression: "_s(index)+". "+_s(key)+" : "+_s(value)",
    text: "{{ index }}. {{ key }} : {{ value }}",
    type: 2,
    static: false
  }],
  for: "object",
  iterator1: "key",
  iterator2: "index",
  plain: true,
  tag: "p",
  type: 1,
  static: false,
  staticRoot: false
}
```

接着 就是根据ast结果 生成对应的render字符串

在 src/compiler/codegen/index.js文件中 找到genFor函数中

```javascript
export function genFor (
  el: any,
  state: CodegenState,
  altGen?: Function,
  altHelper?: string
): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  if (process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
      `v-for should have explicit keys. ` +
      `See https://vuejs.org/guide/list.html#key for more info.`,
      true /* tip */
    )
  }

  el.forProcessed = true // avoid recursion
  return `${altHelper || '_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${(altGen || genElement)(el, state)}` +
    '})'
}
```
这里 if 块是开发环境做一些校验 如果是自定义元素且不是 slot 和 template 则必须有 el.key

最终返回的拼接后的字符串是一个 _l 函数 其中第一个参数是 el.for 即 object 第二个参数是一个函数 函数的参数是我们的三个变量 value , key , index 

该函数返回值中再次调用 genElement 生成 p 元素的 render 字符串

最后生成的render函数字符串为：

  "_c('div',{attrs:{"id":"app"}},_l((object),function(value,key,index){return _c('p',[_v(_s(index)+". "+_s(key)+" : "+_s(value))])}))"

前面提到 _c 是创建一个 vnode 对象 _v 是创建一个 vnode文本节点 这些在 vnode 中详细讲解 这里重点说下 _l 从render.js 中 我们知道它对应的函数就是 renderList 方法

```javascript
export function renderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNode
): ?Array<VNode> {
  let ret: ?Array<VNode>, i, l, keys, key
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (typeof val === 'number') {
    ret = new Array(val)
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i)
    }
  } else if (isObject(val)) {
    keys = Object.keys(val)
    ret = new Array(keys.length)
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i]
      ret[i] = render(val[key], key, i)
    }
  }
  if (isDef(ret)) {
    (ret: any)._isVList = true
  }
  return ret
}
```