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

1. v-if

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

2. v-else-if

第二个 p 标签 同样会在 processIf 函数中进行处理 这次会走 else 并使得 el.elseif = "value == 2"

接着往下执行 会走到如下判断条件

```javascript
if (currentParent && !element.forbidden) {
  if (element.elseif || element.else) {
    processIfConditions(element, currentParent)
  } else if (element.slotScope) { // scoped slot
    ...
  } else {
    currentParent.children.push(element)
    element.parent = currentParent
  }
}
```

如果当前标签是 elseif 或 else,如果我们自己实现 首先想到的是从当前元素往前 找到第一个有 v-if 的标签 Vue中其实也是这样

```javascript
function processIfConditions (el, parent) {
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    })
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
      `used on element <${el.tag}> without corresponding v-if.`
    )
  }
}
function findPrevElement (children: Array<any>): ASTElement | void {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn(
          `text "${children[i].text.trim()}" between v-if and v-else(-if) ` +
          `will be ignored.`
        )
      }
      children.pop()
    }
  }
}
```

findPrevElement 会先拿到当前元素前面的兄弟节点 然后从后往前寻找第一个标签元素 夹在当前元素之间的文本节点会被删除 并在开发环境给予提示

如果 prev 元素存在且 prev.if 存在 则把当前元素和条件添加到 prev 的 ifConditions 数组中

从上面的代码可以看出 如果 element.elseif || element.else 返回 true 是不会走到 else 块 也就是说不会建立当前元素和 currentParent 元素的父子关系 我们的例子中 div 的 children 中会有 v-if 的标签

