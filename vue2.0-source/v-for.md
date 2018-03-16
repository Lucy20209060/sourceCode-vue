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
