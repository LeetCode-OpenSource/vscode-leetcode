# Change Log
All notable changes to the "leetcode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.18.0]
### Added
- Add `star` command in shortcuts [PR#601](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/601)
- Add an option to disable endpoint translation [#389](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/389)

### Changed
- LeetCode actions are moved into sub-menu: `LeetCode` in the editor context menu. [PR#712](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/712)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.18.0+is%3Aclosed+label%3Abug)

## [0.17.0]
### Added
- Add TypeScript support [#560](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/560)

### Changed
- Update the UI resources [PR#561](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/561)

## [0.16.2]
### Added
- New Category: `Concurrency` [CLI#42](https://github.com/leetcode-tools/leetcode-cli/pull/42)
- New configuration to better configure how to show the description [#310](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/310)

### Removed
- Removed the deprecated setting `leetcode.enableShortcuts` [PR#520](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/520)
- Removed the deprecated setting `leetcode.outputFolder` [PR#521](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/521)

## [0.16.1]
### Added
- Can show the problem in current workspace even if it's not a LeetCode workspace [#373](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/373)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.16.1+is%3Aclosed+label%3Abug)

## [0.16.0]
### Added
- Support GitHub login and LinkedIn login [PR#496](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/496)

## [0.15.8]
### Added
- Add a new command `Sign In by Cookie` to workaround the issue that [users cannot login to LeetCode](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/478). Please check the [workaround steps](https://github.com/LeetCode-OpenSource/vscode-leetcode/tree/master#%EF%B8%8F-attention-%EF%B8%8F--workaround-to-login-to-leetcode-endpoint) for more details!

### Changed
- Update the explorer icons to be align with the VS Code design [#460](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/460)

## [0.15.7]
### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.7+is%3Aclosed+label%3Abug)

## [0.15.6]
### Added
- Add a link to the solution page [#424](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/424)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.6+is%3Aclosed+label%3Abug)

## [0.15.5]
### Added
- Add a link to the discussion page [#420](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/420)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.5+is%3Aclosed+label%3Abug)

## [0.15.4]
### Added
- Add a new setting `leetcode.filePath`. Now users can use this setting to dynamicly specify the relative folder name and file name. [#PR380](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/380)

### Fixed
- Missing language `Rust` in the supported language list. [#PR412](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/412)
- Cannot show output when the answer is wrong. [#414](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/414)

## [0.15.3]
### Added
- Support `Pick One` [#263](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/263)
- Support toggling the favorite problems [#378](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/378)

### Changed
- Update the activity bar icon [#395](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/263)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.3+is%3Aclosed+label%3Abug)

## [0.15.2]
### Added
- Prompt to open the workspace for LeetCode [#130](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/130)
- Support deleting sessions [#198](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/130)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.2+is%3Aclosed+label%3Abug)

## [0.15.1]
### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.1+is%3Aclosed+label%3Abug)

## [0.15.0]
### Added
- Auto refresh the explorer after submitting [#91](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/91)
- Add a editor shortcut `Description` to show the problem description [#286](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/286)
- Support customizing the shortcuts in editor [#335](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/335)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.15.0+is%3Aclosed+label%3Abug)

## [0.14.3]
### Added
- Support interpolation for `leetcode.outputFolder` settings [#151](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/151)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+is%3Aclosed+milestone%3A0.14.3+label%3Abug)

## [0.14.2]
### Added
- Add the `All` category in the LeetCode Explorer [#184](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/184)
- Add shortcuts for `Show top voted solution` [#269](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/269)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+is%3Aclosed+label%3Abug+milestone%3A0.14.2)

## [0.14.1]
### Added
- Add setting `leetcode.showCommentDescription` to specify whether including the problem description in comments or not [#287](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/287)

## [0.14.0]
### Added
- Add setting `leetcode.enableShortcuts` to specify whether to show the submit/test shortcuts in editor [#146](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/146)
- Add `Like` and `Dislike` counts in the problem description [#267](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/267)

### Changed
- Improve the `Preview`, `Result` and `Solution` views

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+label%3Abug+is%3Aclosed+milestone%3A0.14.0)

## [0.13.3]
### Fixed
- Fix the bug that the extension cannot be activated

## [0.13.2]
### Added
- Add a setting `leetcode.enableStatusBar` to specify whether the LeetCode status bar will be shown or not [#156](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/156)
- Add a setting `leetcode.nodePath` to specify the `Node.js` executable path [#227](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/227)

### Changed
- Update the activity bar icon, See: [#225](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/225)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.13.2+is%3Aclosed+label%3Abug)

## [0.13.1]
### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+milestone%3A0.13.1+is%3Aclosed+label%3Abug)

## [0.13.0]
### Added
- Preview the problem description [#131](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/131)
- Show top voted solution [#193](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/193)
- Add `collapse all` for the explorer [#197](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/197)

### Fixed
[Bugs fixed](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues?q=is%3Aissue+is%3Aclosed+milestone%3A0.13.0+label%3Abug)

## [0.12.0]
### Added
- Add new command `LeetCode: Switch Default Language` to support switching the default language [#115](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/115)
- Support `PHP` and `Rust` ([#83](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/83), [#103](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/103))

### Fixed
- Cannot retrieve time and memory result [#105](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/105)
- Power operator displays in a wrong way [#74](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/74)

## [0.11.0]
### Added
- Add new setting: `leetcode.outputFolder` to customize the sub-directory to save the files generated by 'Show Problem' [#119](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/119)
- Add tooltips for sub-category nodes in LeetCode Explorer [#143](https://github.com/LeetCode-OpenSource/vscode-leetcode/pull/143)

### Changed
- Now when triggering 'Show Problem', the extension will not generate a new file if it already exists [#59](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/59)

### Fixed
- Log in timeout when proxy is enabled [#117](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/117)

## [0.10.2]
### Fixed
- Test cases cannot have double quotes [#60](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/60)

## [0.10.1]
### Changed
- Refine the README page.

## [0.10.0]
### Added
- Add an extension setting to hide solved problems [#95](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/95)
- Support categorize problems by company, tag, difficulty and favorite [#67](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/67)

## [0.9.0]
### Changed
- Improve the experience of switching endpoint [#85](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/85)
- Use web view to show the result page [#76](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/76)


## [0.8.2]
### Added
- Add Code Lens for submitting the answer to LeetCode

### Fixed
- Fix the bug that the extension could not automatically sign in [#72](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/72)

## [0.8.1]
### Changed
- Upgrade LeetCode CLI to v2.6.1

## [0.8.0]
### Added
- Support LeetCode CN [#50](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/50)
- Support Windows Subsystem for Linux [#47](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/47)

## [0.7.0]
### Added
- Add spinner when submitting code [#43](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/43)

## [0.6.1]
### Added
- Add Sign in action into LeetCode Explorer title area [#25](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/25)

## [0.6.0]
### Changed
- Move LeetCode explorer into activity bar [#39](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/39)

### Added
- Support trigger test & submit in the editor [#37](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/37)

### Fixed
- Fix the bug that cannot show problem [#41](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/41)

## [0.5.1]
### Fixed
- Fix the bug when user's path contains white spaces [#34](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/34)

## [0.5.0]
### Added
- Support submit and test solution files from the file explorer in VS Code ([#24](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/24), [#26](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/26))

## [0.4.0]
### Added
- Support locked problem [#20](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/20)

### Changed
- Simplify the command 'LeetCode: Test Current File' to 'LeetCode: Test' [#18](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/18)
- Will automatically save current file when 'LeetCode: Test' command is triggered [#17](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/17)

## [0.3.0]
### Added
- Test current solution file [#15](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/15)

## [0.2.1]
### Fixed
- Fix the wrong icon bug in LeetCode Explorer [#9](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/9)
- Fix the switch session bug when login session is expired [#12](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/12)

## [0.2.0]
### Added
- Support setting the default language to solve problems [#5](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/5)

### Fixed
- When user cancels login, no further actions will happen [#10](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/10)

## [0.1.2]
### Fixed
- Fix the duplicated nodes in LeetCode Explorer bug [#6](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/6)

## [0.1.1]
### Fixed
- Fix a bug in LeetCode Explorer [#3](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/3)
- Remove the show problem command from command palette [#4](https://github.com/LeetCode-OpenSource/vscode-leetcode/issues/4)

## [0.1.0]
### Added
- Sign in/out to LeetCode
- Switch and create session
- Show problems in explorer
- Search problems by keywords
- Submit solutions to LeetCode
