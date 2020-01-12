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

- English Document | [中文文档](https://github.com/jdneo/vscode-leetcode/blob/master/docs/README_zh-CN.md)

## ❗️ Attention ❗️- Workaround to login to LeetCode endpoint
> Note: If you are using `leetcode-cn.com`, you can just ignore this section.

Recently we observed that [the extension cannot login to leetcode.com endpoint anymore](https://github.com/jdneo/vscode-leetcode/issues/478). The root cause of this issue is that leetcode.com changed its login mechanism and so far there is no ideal way to fix that issue.

Thanks for [@yihong0618](https://github.com/yihong0618) provided a workaround which can somehow mitigate this. Now you can simply click the `Sign In` button and then select `Third Party` login or `Cookie` login.

> Note: If you want to use third-party login(**Recommended**), please make sure your account has been connected to the thrid-party. If you want to use `Cookie` login, click [here](https://github.com/jdneo/vscode-leetcode/issues/478#issuecomment-564757098) to see the steps.

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

  > Note：You can specify the path of the workspace folder to store the problem files by updating the setting `leetcode.workspaceFolder`. The default value is：**$HOME/.leetcode/**.

  > You can specify whether including the problem description in comments or not by updating the setting `leetcode.showCommentDescription`.

  > You can switch the default language by triggering the command: `LeetCode: Switch Default Language`.

---

### Editor Shortcuts
<p align="center">
  <img src="https://raw.githubusercontent.com/jdneo/vscode-leetcode/master/docs/imgs/shortcuts.png" alt="Editor Shortcuts" />
</p>

- The extension supports 4 editor shortcuts (aka Code Lens):
  - `Submit`: Submit your answer to LeetCode.
  - `Test`: Test your answer with customized test cases.
  - `Solution`: Show the top voted solution for the current problem.
  - `Description`: Show the problem description page.

  > Note: You can customize the shortcuts using the setting: `leetcode.editor.shortcuts`. By default, only `Submit` and `Test` shortcuts are enabled.

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

- To manage your LeetCode sessions, just clicking the `LeetCode: ***` at the bottom of the status bar. You can **switch** between sessions or **create**, **delete** a session.


## Settings
| Setting Name                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                       | Default Value      |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `leetcode.hideSolved`                                                                   | Specify to hide the solved problems or not                                                                                                                                                                                                                                                                                                                                                                                        | `false`            |
| `leetcode.showLocked`                                                                   | Specify to show the locked problems or not. Only Premium users could open the locked problems                                                                                                                                                                                                                                                                                                                                     | `false`            |
| `leetcode.defaultLanguage`                                                              | Specify the default language used to solve the problem. Supported languages are: `bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `php`, `python`,`python3`,`ruby`,`rust`, `scala`,`swift`                                                                                                                                                                                                        | `N/A`              |
| `leetcode.useWsl`                                                                       | Specify whether to use WSL or not                                                                                                                                                                                                                                                                                                                                                                                                 | `false`            |
| `leetcode.endpoint`                                                                     | Specify the active endpoint. Supported endpoints are: `leetcode`, `leetcode-cn`                                                                                                                                                                                                                                                                                                                                                   | `leetcode`         |
| `leetcode.workspaceFolder`                                                              | Specify the path of the workspace folder to store the problem files.                                                                                                                                                                                                                                                                                                                                                              | `""`               |
| `leetcode.filePath`                                                                     | Specify the relative path under the workspace and the file name to save the problem files. More details can be found [here](https://github.com/jdneo/vscode-leetcode/wiki/Customize-the-Relative-Folder-and-the-File-Name-of-the-Problem-File).                                                                                                                                                                                   |                    |
| **[Deprecated] Use `leetcode.filePath` instead** ~~`leetcode.outputFolder`~~            | ~~Specify the relative path to save the problem files. Besides using customized path, there are also several reserved words which can be used here: <ul><li>`${tag}`: Categorize the problem according to their tags.<li>`${language}`: Categorize the problem according to their language.</li><li>`${difficulty}`: Categorize the problem according to their difficulty.</li></ul>For example: `problem-${tag}-${difficulty}`~~ | ~~N/A~~            |
| `leetcode.enableStatusBar`                                                              | Specify whether the LeetCode status bar will be shown or not.                                                                                                                                                                                                                                                                                                                                                                     | `true`             |
| **[Deprecated] Use `leetcode.editor.shortcuts` instead** ~~`leetcode.enableShortcuts`~~ | ~~Specify whether the submit and test shortcuts in editor or not.~~                                                                                                                                                                                                                                                                                                                                                               | ~~`true`~~         |
| `leetcode.editor.shortcuts`                                                             | Specify the customized shorcuts in editors. Supported values are: `submit`, `test`, `solution` and `description`.                                                                                                                                                                                                                                                                                                                 | `["submit, test"]` |
| `leetcode.enableSideMode`                                                               | Specify whether `preview`, `solution` and `submission` tab should be grouped into the second editor column when solving a problem.                                                                                                                                                                                                                                                                                                | `true`             |
| `leetcode.nodePath`                                                                     | Specify the `Node.js` executable path. for example, C:\Program Files\nodejs\node.exe                                                                                                                                                                                                                                                                                                                                              | `node`             |
| `leetcode.showCommentDescription`                                                       | Specify whether to include the problem description in the comments                                                                                                                                                                                                                                                                                                                                                                | `false`            |

## Want Help?

When you meet any problem, you can check out the [Troubleshooting](https://github.com/jdneo/vscode-leetcode/wiki/Troubleshooting) and [FAQ](https://github.com/jdneo/vscode-leetcode/wiki/FAQ) first.

If your problem still cannot be addressed, feel free to reach us in the [Gitter Channel](https://gitter.im/vscode-leetcode/Lobby) or [file an issue](https://github.com/jdneo/vscode-leetcode/issues/new/choose).

## Release Notes

Refer to [CHANGELOG](https://github.com/jdneo/vscode-leetcode/blob/master/CHANGELOG.md)

## Acknowledgement

- This extension is based on [@skygragon](https://github.com/skygragon)'s [leetcode-cli](https://github.com/skygragon/leetcode-cli) open source project.
- Special thanks to our [contributors](https://github.com/jdneo/vscode-leetcode/blob/master/ACKNOWLEDGEMENTS.md).
