# LeetCode

> Solve LeetCode problems in VS Code

<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/resources/LeetCode.png" alt="">
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

## Sponsor
[![coding](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/sponsor_coding.png)](https://e.coding.net/?utm_source=leetcode)

- [English Document](#Requirements)
- [中文文档](https://github.com/jdneo/vscode-leetcode/blob/master/docs/README_zh-CN.md)

## Requirements
- [VS Code 1.30.1+](https://code.visualstudio.com/)
- [Node.js 8+](https://nodejs.org)
    > NOTE: Please make sure that `Node` is in your `PATH` environment variable. You can also use the setting `leetcode.nodePath` to specify the location of your `Node.js` executable.

## Quick Start

![demo](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/gifs/demo.gif)

## Features

### Sign In/Out
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/sign_in.png" alt="Sign in" />
</p>

- Simply click `Sign in to LeetCode` in the `LeetCode Explorer` will let you **sign in** with your LeetCode account.

- You can also use the following command to sign in/out:
  - **LeetCode: Sign in**
  - **LeetCode: Sign out**

---

### Switch Endpoint
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/endpoint.png" alt="Switch Endpoint" />
</p>

- By clicking the button ![btn_endpoint](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/btn_endpoint.png) at the **explorer's navigation bar**, you can switch between different endpoints.

- The supported endpoints are:
  - **leetcode.com**
  - **leetcode-cn.com**

  > Note: The accounts of different endpoints are **not** shared. Please make sure you are using the right endpoint. The extension will use `leetcode.com` by default.

---

### Pick a Problem
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/pick_problem.png" alt="Pick a Problem" />
</p>

- Directly click on the problem or right click the problem in the `LeetCode Explorer` and select `Preview Problem` to see the problem description.
- Select `Show Problem` to directly open the file with the problem description.

  > Note: If no folder is opened in VS Code, the extension will save the problem files in **$HOME/.leetcode/**.

  > You can switch the default language by triggering the command: `LeetCode: Switch Default Language`.

---

### Show Top Voted Solution
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/solution.png" alt="Show Top Voted Solution" />
</p>

- Select `Show Top Voted Solution` will display the top voted solution for you.

---

### Submit the Answer
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/submit.png" alt="Submit the Answer" />
</p>

- You can submit the answer by clicking `Submit` at the bottom of the file. Or you can right click in the editor and select `Submit to LeetCode`.

> If you want to hide the shortcuts showing in the editor, just simply set the setting `leetcode.enableShortcuts` to false.

---

### Test the Answer
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/test.png" alt="Test the Answer" />
</p>

- You can test the answer by clicking `Test` at the bottom of the file. Or you can right click in the editor and select `Test in LeetCode`.

- There are 3 ways to test the answer:
  - **Test with the default cases**
  - **Write test cases in input box**
  - **Test with the written cases in file**

---

### Search problems by Keywords
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/search.png" alt="Search problems by Keywords" />
</p>

- By clicking the button ![btn_search](https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/btn_search.png) at the **explorer's navigation bar**, you can search the problems by keywords.

---

### Manage Session
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/session.png" alt="Manage Session" />
</p>

- To manage your LeetCode sessions, just clicking the `LeetCode: ***` at the bottom of the status bar. You can **switch** between sessions or **create** a new session.


## Settings
| Setting Name | Description | Default Value |
|---|---|---|
| `leetcode.hideSolved` | Specify to hide the solved problems or not | `false` |
| `leetcode.showLocked` | Specify to show the locked problems or not. Only Premium users could open the locked problems | `false` |
| `leetcode.defaultLanguage` | Specify the default language used to solve the problem. Supported languages are: `bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `php`, `python`,`python3`,`ruby`,`rust`, `scala`,`swift` | `N/A` |
| `leetcode.useWsl` | Specify whether to use WSL or not | `false` |
| `leetcode.endpoint` | Specify the active endpoint. Supported endpoints are: `leetcode`, `leetcode-cn` | `leetcode` |
| `leetcode.outputFolder`| Specify the relative path to save the problem files. Besides using customized path, there are also several reserved words which can be used here: <ul><li>`${tag}`: Categorize the problem according to their tags.<li>`${language}`: Categorize the problem according to their language.</li><li>`${difficulty}`: Categorize the problem according to their difficulty.</li></ul> | N/A |
| `leetcode.enableStatusBar` | Specify whether the LeetCode status bar will be shown or not. | `true` |
| `leetcode.enableShortcuts` | Specify whether the submit and test shortcuts in editor or not. | `true` |
| `leetcode.nodePath` | Specify the `Node.js` executable path. | `node` |

## Want Help?

When you meet any problem, you can check out the [Troubleshooting](https://github.com/jdneo/vscode-leetcode/wiki/Troubleshooting) and [FAQ](https://github.com/jdneo/vscode-leetcode/wiki/FAQ) first.

If your problem still cannot be addressed, feel free to reach us in the [Gitter Channel](https://gitter.im/vscode-leetcode/Lobby) or [file an issue](https://github.com/jdneo/vscode-leetcode/issues/new/choose).

## Release Notes

Refer to [CHANGELOG](https://github.com/jdneo/vscode-leetcode/blob/master/CHANGELOG.md)

## Acknowledgement

- This extension is based on [@skygragon](https://github.com/skygragon)'s [leetcode-cli](https://github.com/skygragon/leetcode-cli) open source project.
- Special thanks to our [contributors](https://github.com/jdneo/vscode-leetcode/blob/master/ACKNOWLEDGEMENTS.md).
