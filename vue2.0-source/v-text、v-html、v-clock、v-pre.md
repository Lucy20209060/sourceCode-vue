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

