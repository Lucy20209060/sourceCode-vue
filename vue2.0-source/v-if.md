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

