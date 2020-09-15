#!/usr/bin/env node
const shell = require('shelljs')
const fs = require('fs')
const exec = shell.exec
// 图标
const symbols = require('log-symbols') // https://www.npmjs.com/package/log-symbols
// log字体样式
const chalk = require('chalk') // https://www.npmjs.com/package/chalk
const ora = require('ora')

// 获取当前git分支
const path = './.git/HEAD'
const sign = fs.existsSync(path)
if (!sign) {
  console.log(symbols.error, chalk.red('git文件不存在'))
  return
}

const buffer = fs.readFileSync(path)
// 当前分支名称
const head = String(buffer).trim().split('/').pop()
console.log('当前分支', chalk.black.bgYellow(head))

// 获取命令中的提交信息
const message = (process.argv[2] || 'Auto-commit').trim()
console.log('commit message', chalk.black.bgYellow(message))

// console.log(message)

// console.log(symbols.error, chalk.red(message))

// console.log(symbols.success, chalk.bgGreen(213123))

// const spinner = ora('Loading unicorns').start()

// setTimeout(() => {
//   spinner.color = 'yellow'
//   spinner.text = 'Loading rainbows'
//   // spinner.fail()
//   // spinner.succeed()
//   spinner.stop()
//   console.log(symbols.error, chalk.red(message))
// }, 1000)

const gitAdd = ora(`git add \n`)
gitAdd.start()
if (exec(`git add .`).code !== 0) {
  console.log(symbols.error, chalk.red('Error: git add failed'))
  exit(1)
} else {
  gitAdd.succeed()
}

const gitCommit = ora(`git commit \n`)
gitCommit.start()
if (exec(`git commit -m "${message}"`).code !== 0) {
  console.log(symbols.error, chalk.red('Error: git commit failed'))
  exit(1)
} else {
  gitCommit.succeed()
}

const gitPull = ora(`git pull origin ${head} \n`)
gitPull.start()
if (exec(`git pull origin ${head}`).code !== 0) {
  console.log(symbols.error, chalk.red('Error: git pull failed'))
  exit(1)
} else {
  gitPull.succeed()
}

const gitPush = ora(`git push origin ${head} \n`)
gitPush.start()
if (exec(`git push origin ${head}`).code !== 0) {
  console.log(symbols.error, chalk.red('Error: git push failed'))
  exit(1)
} else {
  gitPush.succeed()
}

console.log('-----', chalk.black.bgYellow('提交成功'), '-----')

// exec(`echo git success ${message}`)

// return

// shell.exec(`git pull`)

// exit(1)

// function log({ type, message }) {
//   /**
//    * symbols
//    * info 信息 蓝色 i 符号
//    * success 绿色勾号
//    * warning 黄色感叹号
//    * error 红色 x 号
//    */

//   console.log(symbols.error, chalk.red(message))
// }
