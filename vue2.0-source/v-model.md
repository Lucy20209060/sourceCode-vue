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

select

```html
<div id="app">
  <select v-model="value">
    <option>1</option>
    <option>2</option>
    <option>3</option>
  </select>
  <p>{{value}}</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      value: 3
    }
  }).$mount('#app');
</script>
```

select绑定 v-model 的例子 从上面的例子可以看到是调用 genSelect 处理的

```javascript
function genSelect (
    el: ASTElement,
    value: string,
    modifiers: ?ASTModifiers
) {
  const number = modifiers && modifiers.number
  const selectedVal = `Array.prototype.filter` +
    `.call($event.target.options,function(o){return o.selected})` +
    `.map(function(o){var val = "_value" in o ? o._value : o.value;` +
    `return ${number ? '_n(val)' : 'val'}})`

  const assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]'
  let code = `var $$selectedVal = ${selectedVal};`
  code = `${code} ${genAssignmentCode(value, assignment)}`
  addHandler(el, 'change', code, null, true)
}
```
有 number修饰符 表示要作为数字来处理 _n函数其实就是把val转换成数字 selectedVal中的含义是先获取 options 中的 selected 的元素

然后依次获取 _value || value 的值 如果下拉列表是多选的 assignment值为数组 否则就是单个val

这里有一个比较重要的函数 genAssignmentCode 所有情况的过程中 都用到了它

```javascript
export function genAssignmentCode (
  value: string,
  assignment: string
): string {
  const modelRs = parseModel(value)
  if (modelRs.idx === null) {
    return `${value}=${assignment}`
  } else {
    return `var $$exp = ${modelRs.exp}, $$idx = ${modelRs.idx};` +
      `if (!Array.isArray($$exp)){` +
        `${value}=${assignment}}` +
      `else{$$exp.splice($$idx, 1, ${assignment})}`
  }
}
```

parseModel是解析value 因为我们绑定value可以有多种情况 比如value,value.a,value['a'],value[0]等

```javascript
export function parseModel (val: string): Object {
  str = val
  len = str.length
  index = expressionPos = expressionEndPos = 0
  // 没有中括号或不是以中括号结尾的
  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
    return {
      exp: val,
      idx: null
    }
  }

  while (!eof()) {
    chr = next()
    /* istanbul ignore if */
    if (isStringStart(chr)) {
      parseString(chr)
    } else if (chr === 0x5B) {
      parseBracket(chr)
    }
  }

  return {
    exp: val.substring(0, expressionPos),
    idx: val.substring(expressionPos + 1, expressionEndPos)
  }
}
```

如果有中括号 且是以中括号结尾 则会执行一个while循环 大体的过程是遍历每一个字符 最终找到与最后一个]对应的[ 
  
然后把[之前的内容放到exp中 中括号中间的内容放到idx中 例如 value 值为value[0] 最终解析之后返回的值为 {exp:"value",idx:"0"}

回到 genAssignmentCode 如果 modelRs.idx为null 则直接给value赋值 这时就会直接触发模板的更新 否则如果exp 不是数组 也直接赋值 如果exp是数组 则会直接删除之前的值 并在原来的位置插入新值

genSelect的最后 会通过 addHandler 方法(在事件处理中讲过事件处理的整体流程) 把生成的回调函数内容 添加到元素的change事件中 所有改变下拉框的值时 会触发change事件 进而修改value的值 触发模板的整体更新

我们上面的例子 最终生成的render函数字符串如下

"with(this){return _c('div',{attrs:{"id":"app"}},[_c('select',{directives:[{name:"model",rawName:"v-model",value:(value),expression:"value"}],on:{"change":function($event){var $$selectedVal = Array.prototype.filter.call($event.target.options,function(o){return o.selected}).map(function(o){var val = "_value" in o ? o._value : o.value;return val}); value=$event.target.multiple ? $$selectedVal : $$selectedVal[0]}}},[_c('option',[_v("1")]),_v(" "),_c('option',[_v("2")]),_v(" "),_c('option',[_v("3")])]),_v(" "),_c('p',[_v(_s(value))])])}"

整体比较长 我们注意到 select的data的directives中包含了我们的v-model指令 并且on中有一个change事件 对应的函数体就是刚才我们讲过的处理操作