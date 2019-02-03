# LeetCode

> 在 VS Code 中练习 LeetCode

<p align="center">
  <img src="https://github.com/jdneo/vscode-leetcode/blob/master/resources/LeetCode.png" alt="">
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

- [English Document](#Requirements)
- [中文文档](https://github.com/jdneo/vscode-leetcode/blob/master/docs/README_zh-CN.md)

## 运行条件
- [Node.js 8+](https://nodejs.org)
    > 注意：请确保`Node`在`PATH`环境变量中，您可以通过执行：`node -v`进行查看。

## 快速开始

![demo](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/gifs/demo.gif)

## 功能

### 登入登出
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/sign_in.png" alt="Sign in" />
</p>

- 点击 `LeetCode Explorer` 中的 `Sign in to LeetCode` 即可登入。

- 你也可以使用下来命令登入或登出:
  - **LeetCode: Sign in**
  - **LeetCode: Sign out**

---

### 切换 LeetCode 版本
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/endpoint.png" alt="Switch Endpoint" />
</p>

- LeetCode 目前有**英文版**和**中文版**两种版本。点击 `LeetCode Explorer` 导航栏中的 ![btn_endpoint](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/btn_endpoint.png) 按钮可切换版本。

- 目前可切换的版本有:
  - **leetcode.com**
  - **leetcode-cn.com**

  > 注意：两种版本的 LeetCode 账户并**不通用**，请确保当前激活的版本是正确的。插件默认激活的是**英文版**。

---

### 选择题目
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/pick_problem.png" alt="Pick a problem" />
</p>

- 在 `LeetCode Explorer` 中**右键**题目并选择 `Show Problem` 进行答题。

  > 注意：若当前 VS Code 没有已打开的文件夹，则生成的题目文件会存储于 **$HOME/.leetcode/** 目录下。

---

### 提交答案
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/submit.png" alt="Switch Endpoint" />
</p>

- 通过点击文件最下方的 `🙏 Submit to LeetCode` 可提交答案。 你也可以触发 **LeetCode: Submit to LeetCode** 命令将**当前**文件作为答案进行提交。

---

### 测试答案
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/test.png" alt="Switch Endpoint" />
</p>

- 在编辑区内右键并选择 `Test in LeetCode`，可对**当前**答案进行测试。

- 有下列三种测试集来源：
  - **默认测试集**：Test with the default cases
  - **在输入框内输入测试集**：Write test cases in input box
  - **提供自定义测试集文件**：Test with the writen cases in file

---

### 通过关键字搜索题目
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/search.png" alt="Switch Endpoint" />
</p>

- 点击 `LeetCode Explorer` 导航栏中的 ![btn_search](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/btn_search.png) 按钮可按照关键字搜索题目。

---

### 管理存档
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/session.png" alt="Switch Endpoint" />
</p>

- 点击位于 VS Code 底部状态栏的 `LeetCode: ***` 管理 `LeetCode 存档`。你可以**切换**存档或者**创建**新的存档。


## 插件配置项
| 配置项名称 | 描述 | 默认值 |
|---|---|---|
| `leetcode.hideSolved` | 指定是否要隐藏已解决的问题 | `false` |
| `leetcode.showLocked` | 指定是否显示付费题目，只有付费账户才可以打开付费题目 | `false` |
| `leetcode.defaultLanguage` | 指定答题时使用的默认语言，可选语言有：`bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `python`,`python3`,`ruby`,`scala`,`swift` | `N/A` |
| `leetcode.useWsl` | 指定是否启用 WSL | `false` |
| `leetcode.endpoint` | 指定使用的终端，可用终端有：`leetcode`, `leetcode-cn` | `leetcode` |

## 更新日志

请参考[更新日志](https://github.com/jdneo/vscode-leetcode/blob/master/CHANGELOG.md)

## 鸣谢

- 本插件基于[@skygragon](https://github.com/skygragon)的[leetcode-cli](https://github.com/skygragon/leetcode-cli)开源项目制作。
- 特别鸣谢这些[贡献者们](https://github.com/jdneo/vscode-leetcode/blob/master/ACKNOWLEDGEMENTS.md)。
