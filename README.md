# LeetCode
[![Travis CI](https://travis-ci.org/jdneo/vscode-leetcode.svg?branch=master)](https://travis-ci.org/jdneo/vscode-leetcode)
[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/shengchen.vscode-leetcode.svg)](https://vsmarketplacebadge.apphb.com/version-short/shengchen.vscode-leetcode.svg)

Solve LeetCode problems in VS Code.
- [中文](#中文)
- [English](#english)

# English
## Requirements
- [Node.js](https://nodejs.org)
    > NOTE: Please make sure that `Node` is in your `PATH` environment variable. You can check this by running: `node -v`.

## Features
- Sign in/out to LeetCode
- Switch and create session
- Show problems in explorer
- Search problems by keywords
- Submit solutions to LeetCode

## Commands
This extension provides several commands in the Command Palette (F1 or Ctrl + Shift + P):
- **LeetCode: Sign in** -  Sign in to LeetCode
- **LeetCode: Sign out** -  Sign out to LeetCode
- **LeetCode: Select session** -  Select one session and make it active
- **LeetCode: Create new session** -  Create a new session
- **LeetCode: Refresh** -  Refresh the LeetCode Explorer
- **LeetCode: Search Problem** -  Search for problems by keywords
- **LeetCode: Submit** -  Submit the solution to LeetCode

### Sign In and Sign Out
![SignInOut](resources/gif/signinout.gif)

### Switch and Create Session
![SwitchSession](resources/gif/switchsession.gif)

### Show Problems in Explorer
![ShowProblem](resources/gif/showproblem.gif)

### Search Problems by Keywords
![SearchProblem](resources/gif/searchproblem.gif)

### Submit Solutions to LeetCode
![SubmitSolution](resources/gif/solveproblem.gif)

## Known Issues:
- This extension will infer the current target problem according to the active editing file. Please do not change the file name.
- Currently, only unlocked problems will be listed.

## Release Notes

Refer to [CHANGELOG](CHANGELOG.md)

## Acknowledgement

This extension is based on [@skygragon](https://github.com/skygragon)'s [leetcode-cli](https://github.com/skygragon/leetcode-cli) open source project.


# 中文
## 运行条件
- [Node.js](https://nodejs.org)
    > 注意: 请确保`Node`在`PATH`环境变量中，您可以通过执行：`node -v`进行查看。

## 功能
- 登入 / 登出 LeetCode
- 切换及创建 session
- 在 Explorer 中展示题目
- 根据关键字搜索题目
- 向 LeetCode 提交答案

## 命令
该插件在命令面板（F1 或 Ctrl + Shift + P）中支持下列命令：
- **LeetCode: Sign in** -  登入 LeetCode
- **LeetCode: Sign out** -  登出 LeetCode
- **LeetCode: Select session** -  激活一个已有的答题进度存档
- **LeetCode: Create new session** -  创建一个新的答题进度存档
- **LeetCode: Refresh** -  刷新左侧题目列表视图
- **LeetCode: Search Problem** -  根据关键字搜索题目
- **LeetCode: Submit** -  提交答案到 LeetCode

### 登入及登出
![SignInOut](resources/gif/signinout.gif)

### 切换及创建 session
![SwitchSession](resources/gif/switchsession.gif)

### 在 Explorer 中展示题目
![ShowProblem](resources/gif/showproblem.gif)

### 根据关键字搜索题目
![SearchProblem](resources/gif/searchproblem.gif)

### 向 LeetCode 提交答案
![SubmitSolution](resources/gif/solveproblem.gif)

## 已知问题
- 本插件会根据文件名称推测当前的目标题目，因此建议不要改变文件名。
- 本插件目前仅会显示已解锁的问题。

## 更新日志

请参考[更新日志](CHANGELOG.md)

## 鸣谢

本插件基于[@skygragon](https://github.com/skygragon)的[leetcode-cli](https://github.com/skygragon/leetcode-cli)开源项目制作。
