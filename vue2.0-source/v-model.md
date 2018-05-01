v-model 也是内置指令 实现最复杂的一个 它涉及到 select input textarea 等多个标签

input又分为checkout radio等多种类型 

ast生成的处理流程，和其他普通指令都差不多，唯一不同的是，这里多了一个校验处理。

```javascript
function processAttrs (el) {
  ...
  addDirective(el, name, rawName, value, arg, modifiers)
  if (process.env.NODE_ENV !== 'production' && name === 'model'){
    checkForAliasModel(el, value)
  }
  ...
}
function checkForAliasModel (el, value) {
  let _el = el
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
        `You are binding v-model directly to a v-for iteration alias. ` +
        `This will not be able to modify the v-for source array because ` +
        `writing to the alias is like modifying a function local variable. ` +
        `Consider using an array of objects and use v-model on an object property instead.`
      )
    }
    _el = _el.parent
  }
}
```

上面的校验告诉我们 不能用for循环的值来作为value 如下例子会报错

```html
<div id="app">
  <p v-for="item in value">
    <input v-model="item"/>
  </p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      value: ['test','test1']
    }
  }).$mount('#app');
</script>
```

类似于 v-text v-html 等指令 在函数生成时 platformDirectives中内置了对 v-model 的处理

```javascript
export default function model (
  el: ASTElement,
  dir: ASTDirective,
  _warn: Function
): ?boolean {
  warn = _warn
  const value = dir.value
  const modifiers = dir.modifiers
  const tag = el.tag
  const type = el.attrsMap.type
  // input的type不支持动态绑定
  // file类型是只读的，不能用v-model
  ...
  if (tag === 'select') {
    genSelect(el, value, modifiers)
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers)
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers)
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers)
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
  } else if (process.env.NODE_ENV !== 'production') {
    ...
	// 其它标签不支持v-model
  }
  // ensure runtime directive metadata
  return true
}
```

可以看出 v-model的处理 主要分为四种情况 select checkbox radio input || textarea 以及自定义标签

只有自定义标签返回false 其他返回true 说明自定义标签不会把 v-model 指令添加到 directives 中 也就不会再patch过程中有钩子函数操作 其他情况 在patch过程中 还会有一些操作