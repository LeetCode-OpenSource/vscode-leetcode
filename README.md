# LeetCode

> Solve LeetCode problems in VS Code

<p align="center">
  <img src="https://github.com/jdneo/vscode-leetcode/blob/cs/new-doc/resources/LeetCode.png" alt="">
</p>
<p align="center">
  <a href="https://travis-ci.org/jdneo/vscode-leetcode">
    <img src="https://img.shields.io/travis/jdneo/vscode-leetcode.svg?style=flat-square" alt="">
  </a>
  <a href="https://gitter.im/vscode-leetcode/Lobby">
    <img src="https://img.shields.io/gitter/room/jdneo/vscode-leetcode.svg?style=flat-square" alt="">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=shengchen.vscode-leetcode">
    <img src="https://img.shields.io/visual-studio-marketplace/d/shengchen.vscode-leetcode.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/jdneo/vscode-leetcode/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/jdneo/vscode-leetcode.svg?style=flat-square" alt="">
  </a>
</p>

## Requirements
- [Node.js 8+](https://nodejs.org)
    > NOTE: Please make sure that `Node` is in your `PATH` environment variable. You can check this by running: `node -v`.

## Quick Start

## Features
### Sign In/Out
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/sign_in.png" alt="Sign in" />
</p>

### Switch Endpoint
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/endpoint.png" alt="Switch Endpoint" />
</p>

### Pick a Problem
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/pick_problem.png" alt="Switch Endpoint" />
</p>

### Submit the Answer
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/submit.png" alt="Switch Endpoint" />
</p>

### Test the Answer
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/test.png" alt="Switch Endpoint" />
</p>

### Search problems by Keywords
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/search.png" alt="Switch Endpoint" />
</p>

### Manage Session
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/cs/new-doc/docs/imgs/session.png" alt="Switch Endpoint" />
</p>


## Settings
| Setting Name | Description | Default Value |
|---|---|---|
| `leetcode.hideSolved` | Specify to hide the solved problems or not | `false` |
| `leetcode.showLocked` | Specify to show the locked problems or not. Only Premium users could open the locked problems | `false` |
| `leetcode.defaultLanguage` | Specify the default language used to solve the problem. Supported languages are: `bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `python`,`python3`,`ruby`,`scala`,`swift` | `N/A` |
| `leetcode.useWsl` | Specify whether to use WSL or not | `false` |
| `leetcode.endpoint` | Specify the active endpoint. Supported endpoints are: `leetcode`, `leetcode-cn` | `leetcode` |

## Release Notes

Refer to [CHANGELOG](https://github.com/jdneo/vscode-leetcode/blob/master/CHANGELOG.md)

## Acknowledgement

- This extension is based on [@skygragon](https://github.com/skygragon)'s [leetcode-cli](https://github.com/skygragon/leetcode-cli) open source project.
- Special thanks to our [contributors](https://github.com/jdneo/vscode-leetcode/blob/master/ACKNOWLEDGEMENTS.md).



# 中文
## 运行条件
- [Node.js 8+](https://nodejs.org)
    > 注意: 请确保`Node`在`PATH`环境变量中，您可以通过执行：`node -v`进行查看。

## 功能
- 登入 / 登出 LeetCode
- 切换及创建 session
- 在 Explorer 中展示题目
  > 注意: 如果想要展示付费题目，您需要将 `leetcode.showLocked` 设置为 **true**
- 根据关键字搜索题目
- 用自定义测试用例测试答案
- 向 LeetCode 提交答案

### 登入及登出
![SignInOut](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/signinout.gif)

### 切换及创建 session
![SwitchSession](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/switchsession.gif)

### 在 Explorer 中展示题目 <sup>1</sup>
![ShowProblem](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/showproblem.gif)

### 根据关键字搜索题目 <sup>1</sup>
![SearchProblem](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/searchproblem.gif)

### 用自定义测试用例测试答案 <sup>2</sup>
![TestSolution](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/testsolution.gif)

### 向 LeetCode 提交答案 <sup>2</sup>
![SubmitSolution](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/gif/solveproblem.gif)

<sup>1</sup> 如果 VS Code 中没有已打开的文件夹，插件会将题目文件存储于 `$HOME/.leetcode/` 目录下。<br/>
<sup>2</sup> 如果您通过命令面板触发 `Submit to LeetCode` 和 `Test in LeetCode` 命令，本插件将会提交当前文件至 LeetCode。

## 命令
该插件在命令面板（F1 或 Ctrl + Shift + P）中支持下列命令：
- **LeetCode: Sign in** -  登入 LeetCode
- **LeetCode: Sign out** -  登出 LeetCode
- **LeetCode: Select session** -  激活一个已有的答题进度存档
- **LeetCode: Create new session** -  创建一个新的答题进度存档
- **LeetCode: Refresh** -  刷新左侧题目列表视图
- **LeetCode: Search Problem** -  根据关键字搜索题目
- **LeetCode: Test in LeetCode** - 用自定义测试用例进行测试
- **LeetCode: Submit to LeetCode** -  提交答案到 LeetCode
- **LeetCode: Switch endpoint** - 变更 LeetCode 终端（LeetCode 或 领扣）

## 插件配置项
| 配置项名称 | 描述 | 默认值 |
|---|---|---|
| `leetcode.hideSolved` | 指定是否要隐藏已解决的问题 | `false` |
| `leetcode.showLocked` | 指定是否显示付费题目，只有付费账户才可以打开付费题目 | `false` |
| `leetcode.defaultLanguage` | 指定答题时使用的默认语言，可选语言有：`bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `python`,`python3`,`ruby`,`scala`,`swift` | `N/A` |
| `leetcode.useWsl` | 指定是否启用 WSL | `false` |
| `leetcode.endpoint` | 指定使用的终端，可用终端有：`leetcode`, `leetcode-cn` | `leetcode` |

## 已知问题
- 本插件会根据文件名称推测当前的目标题目，因此建议不要改变文件名。

## 更新日志

请参考[更新日志](https://github.com/jdneo/vscode-leetcode/blob/master/CHANGELOG.md)

## 鸣谢

- 本插件基于[@skygragon](https://github.com/skygragon)的[leetcode-cli](https://github.com/skygragon/leetcode-cli)开源项目制作。
- 特别鸣谢这些[贡献者们](https://github.com/jdneo/vscode-leetcode/blob/master/ACKNOWLEDGEMENTS.md)。
