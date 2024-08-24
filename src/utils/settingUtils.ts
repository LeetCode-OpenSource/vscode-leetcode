// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { workspace, WorkspaceConfiguration } from "vscode";
import { DescriptionConfiguration } from "../shared";

export function getWorkspaceConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("leetcode");
}

export function shouldHideSolvedProblem(): boolean {
    return getWorkspaceConfiguration().get<boolean>("hideSolved", false);
}

export function getWorkspaceFolder(): string {
    return getWorkspaceConfiguration().get<string>("workspaceFolder", "");
}

export function getEditorShortcuts(): string[] {
    return getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
}

export function hasStarShortcut(): boolean {
    const shortcuts: string[] = getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
    return shortcuts.indexOf("star") >= 0;
}

export function shouldUseEndpointTranslation(): boolean {
    return getWorkspaceConfiguration().get<boolean>("useEndpointTranslation", true);
}

export function getDescriptionConfiguration(): IDescriptionConfiguration {
    const setting: string = getWorkspaceConfiguration().get<string>("showDescription", DescriptionConfiguration.InWebView);
    const config: IDescriptionConfiguration = {
        showInComment: false,
        showInWebview: true,
    };
    switch (setting) {
        case DescriptionConfiguration.Both:
            config.showInComment = true;
            config.showInWebview = true;
            break;
        case DescriptionConfiguration.None:
            config.showInComment = false;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InFileComment:
            config.showInComment = true;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InWebView:
            config.showInComment = false;
            config.showInWebview = true;
            break;
    }

    // To be compatible with the deprecated setting:
    if (getWorkspaceConfiguration().get<boolean>("showCommentDescription")) {
        config.showInComment = true;
    }

    return config;
}

const defaultPreambles = {
    "cpp": `
#ifndef _GLIBCXX_NO_ASSERT
#include <cassert>
#endif
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <ciso646>
#include <climits>
#include <clocale>
#include <cmath>
#include <csetjmp>
#include <csignal>
#include <cstdarg>
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>

#if __cplusplus >= 201103L
#include <ccomplex>
#include <cfenv>
#include <cinttypes>
#include <cstdalign>
#include <cstdbool>
#include <cstdint>
#include <ctgmath>
#include <cwchar>
#include <cwctype>
#endif

// C++
#include <algorithm>
#include <bitset>
#include <complex>
#include <deque>
#include <exception>
#include <fstream>
#include <functional>
#include <iomanip>
#include <ios>
#include <iosfwd>
#include <iostream>
#include <istream>
#include <iterator>
#include <limits>
#include <list>
#include <locale>
#include <map>
#include <memory>
#include <new>
#include <numeric>
#include <ostream>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <streambuf>
#include <string>
#include <typeinfo>
#include <utility>
#include <valarray>
#include <vector>

#if __cplusplus >= 201103L
#include <array>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <forward_list>
#include <future>
#include <initializer_list>
#include <mutex>
#include <random>
#include <ratio>
#include <regex>
#include <scoped_allocator>
#include <system_error>
#include <thread>
#include <tuple>
#include <typeindex>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#endif
using namespace std;
    `
}

/**
 * ## About
 *
 * Code preamble is a short code snippet adding to the beginning of the program. A typical one is:
 *
 *
 * ```
 * #include <iostream>
 * using namespace std;
 * ```
 *
 * This feature is useful. Maybe inserting header files is interesting for the first several times,
 * it is dreadful if we need to add tons of it each time we do the problems, especially for a dreadful
 * language like C/C++
 *
 * ## Configuration
 *
 * To add a preamble for one language, the user will follow this schema:
 *
 * ```
 * "leetcode.language.preamble" = {
 *      "cpp" : "#include <iostream>",
 * }
 * ```
 *
 * @param language
 */
export function getCodePreamble(language: string): string {
    const preambles = getWorkspaceConfiguration().get<Record<string, string>>("language.preamble");
    return preambles?.[language] ?? defaultPreambles?.[language] ?? "";
}

export interface IDescriptionConfiguration {
    showInComment: boolean;
    showInWebview: boolean;
}
