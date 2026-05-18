// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

export interface IQuickItemEx<T> extends vscode.QuickPickItem {
    value: T;
}

export enum UserStatus {
    SignedIn = 1,
    SignedOut = 2,
}

export const loginArgsMapping: Map<string, string> = new Map([
    ["LeetCode", "-l"],
    ["Cookie", "-c"],
    ["GitHub", "-g"],
    ["LinkedIn", "-i"],
]);

export const languages: string[] = [
    "bash",
    "c",
    "cpp",
    "csharp",
    "golang",
    "java",
    "javascript",
    "kotlin",
    "mysql",
    "php",
    "python",
    "python3",
    "ruby",
    "rust",
    "scala",
    "swift",
    "typescript",
];

export const langExt: Map<string, string> = new Map([
    ["bash", "sh"],
    ["c", "c"],
    ["cpp", "cpp"],
    ["csharp", "cs"],
    ["golang", "go"],
    ["java", "java"],
    ["javascript", "js"],
    ["kotlin", "kt"],
    ["mysql", "sql"],
    ["php", "php"],
    ["python", "py"],
    ["python3", "py"],
    ["ruby", "rb"],
    ["rust", "rs"],
    ["scala", "scala"],
    ["swift", "swift"],
    ["typescript", "ts"],
]);

export enum ProblemState {
    AC = 1,
    NotAC = 2,
    Unknown = 3,
    Locked = 4,
}

export enum Endpoint {
    LeetCode = "leetcode",
    LeetCodeCN = "leetcode-cn",
}

export interface IProblem {
    isFavorite: boolean;
    locked: boolean;
    state: ProblemState;
    id: string;
    name: string;
    difficulty: string;
    passRate: string;
    companies: string[];
    tags: string[];
}

export const defaultProblem: IProblem = {
    isFavorite: false,
    locked: false,
    state: ProblemState.Unknown,
    id: "",
    name: "",
    difficulty: "",
    passRate: "",
    companies: [] as string[],
    tags: [] as string[],
};

export enum Category {
    All = "All",
    Difficulty = "Difficulty",
    Tag = "Tag",
    Company = "Company",
    Favorite = "Favorite",
}

export const supportedPlugins: string[] = ["company", "solution.discuss", "leetcode.cn"];

export enum DescriptionConfiguration {
    InWebView = "In Webview",
    InFileComment = "In File Comment",
    Both = "Both",
    None = "None",
}

export const leetcodeHasInited: string = "leetcode.hasInited";

export enum SortingStrategy {
    None = "None",
    AcceptanceRateAsc = "Acceptance Rate (Ascending)",
    AcceptanceRateDesc = "Acceptance Rate (Descending)",
    FrequencyAsc = "Frequency (Ascending)",
    FrequencyDesc = "Frequency (Descending)",
}

export const PREMIUM_URL_CN = "https://leetcode.cn/premium-payment/?source=vscode";
export const PREMIUM_URL_GLOBAL = "https://leetcode.com/subscribe/?ref=lp_pl&source=vscode";

const protocol = vscode.env.appName.includes('Insiders') ? "vscode-insiders" : "vscode"

export const urls = {
    // base urls
    base: "https://leetcode.com",
    graphql: "https://leetcode.com/graphql",
    userGraphql: "https://leetcode.com/graphql",
    login: "https://leetcode.com/accounts/login/",
    authLoginUrl: `https://leetcode.com/authorize-login/${protocol}/?path=leetcode.vscode-leetcode`,
};

export const urlsCn = {
    // base urls
    base: "https://leetcode.cn",
    graphql: "https://leetcode.cn/graphql",
    userGraphql: "https://leetcode.cn/graphql/",
    login: "https://leetcode.cn/accounts/login/",
    authLoginUrl: `https://leetcode.cn/authorize-login/${protocol}/?path=leetcode.vscode-leetcode`,
};

export const getUrl = (key: string) => {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    const point = leetCodeConfig.get<string>("endpoint", Endpoint.LeetCode);
    switch (point) {
        case Endpoint.LeetCodeCN:
            return urlsCn[key];
        case Endpoint.LeetCode:
        default:
            return urls[key];
    }
};
