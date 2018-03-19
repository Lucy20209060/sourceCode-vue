v-if 指令

```html
<div id="app">
  <p v-if="value == 1">v-if块的内容</p>
  <p v-else-if="value == 2">v-else-if块的内容</p>
  <p v-else>v-else块的内容</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
	el: '#app',
	data: {
	  value: 2
	}
  })
</script>
```

生成ast

与其他指令类似 parse 函数中 调用了一个单独的函数来处理 v-if 指令——processIf

```javascript
function processIf (el) {
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    el.if = exp
    addIfCondition(el, {
      exp: exp,
      block: el
    })
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true
    }
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      el.elseif = elseif
    }
  }
}
```

我们这有三个 p 标签 所以会分别生成 ast 。end 和 chars 的处理就略过了 我们只看 start 中的处理

1.v-if

第一 p 便签 在执行 processIf 函数时 exp = getAndRemoveAttr(el,'v-if') 结果返回 value == 1 所以走到 if 块

```javascript
function addIfCondition (el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}
```

addIfCondition 会给 el 添加一个 ifConditions 来保存当前 v-if 相关元素