// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { Endpoint, loginArgsMapping, urls, urlsCn, UserStatus } from "./shared";
import { createEnvOption } from "./utils/cpUtils";
import { DialogType, openUrl, promptForOpenOutputChannel } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";
import { getLeetCodeEndpoint } from "./commands/plugin";
import { globalState } from "./globalState";
import { queryUserData } from "./request/query-user-data";
import { parseQuery, sleep } from "./utils/toolUtils";

class LeetCodeManager extends EventEmitter {
    private currentUser: string | undefined;
    private userStatus: UserStatus;
    private readonly successRegex: RegExp = /(?:.*)Successfully .*login as (.*)/i;
    private readonly failRegex: RegExp = /.*\[ERROR\].*/i;

    constructor() {
        super();
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
        this.handleUriSignIn = this.handleUriSignIn.bind(this);
    }

    public async getLoginStatus(): Promise<void> {
        try {
            const result: string = await leetCodeExecutor.getUserInfo();
            this.currentUser = this.tryParseUserName(result);
            this.userStatus = UserStatus.SignedIn;
        } catch (error) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            globalState.removeAll();
        } finally {
            this.emit("statusChanged");
        }
    }

    public async handleUriSignIn(uri: vscode.Uri): Promise<void> {
        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress: vscode.Progress<{}>) => {
                progress.report({ message: "Fetching user data..." });
                const queryParams = parseQuery(uri.query);
                const cookie = queryParams["cookie"];
                if (!cookie) {
                    promptForOpenOutputChannel(`Failed to get cookie. Please log in again`, DialogType.error);
                    return;
                }
                globalState.setCookie(cookie);
                const data = await queryUserData();
                globalState.setUserStatus(data);
                await this.setCookieToCli(cookie, data.username);
                if (data.username) {
                    vscode.window.showInformationMessage(`Successfully ${data.username}.`);
                    this.currentUser = data.username;
                    this.userStatus = UserStatus.SignedIn;
                    this.emit("statusChanged");
                }
            });
        } catch (error) {
            promptForOpenOutputChannel(`Failed to log in. Please open the output channel for details`, DialogType.error);
        }
    }

    public async signIn(): Promise<void> {
        openUrl(this.getAuthLoginUrl());
    }

    public async signOut(): Promise<void> {
        try {
            await leetCodeExecutor.signOut();
            vscode.window.showInformationMessage("Successfully signed out.");
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            globalState.removeAll();
            this.emit("statusChanged");
        } catch (error) {
            // swallow the error when sign out.
        }
    }

    public getStatus(): UserStatus {
        return this.userStatus;
    }

    public getUser(): string | undefined {
        return this.currentUser;
    }

    private tryParseUserName(output: string): string {
        const reg: RegExp = /^\s*.\s*(.+?)\s*https:\/\/leetcode/m;
        const match: RegExpMatchArray | null = output.match(reg);
        if (match && match.length === 2) {
            return match[1].trim();
        }

        return "Unknown";
    }

    public getAuthLoginUrl(): string {
        switch (getLeetCodeEndpoint()) {
            case Endpoint.LeetCodeCN:
                return urlsCn.authLoginUrl;
            case Endpoint.LeetCode:
            default:
                return urls.authLoginUrl;
        }
    }

    public setCookieToCli(cookie: string, name: string): Promise<void> {
        return new Promise(async (resolve: (res: void) => void, reject: (e: Error) => void) => {
            const leetCodeBinaryPath: string = await leetCodeExecutor.getLeetCodeBinaryPath();

            const childProc: cp.ChildProcess = wsl.useWsl()
                ? cp.spawn("wsl", [leetCodeExecutor.node, leetCodeBinaryPath, "user", loginArgsMapping.get("Cookie") ?? ""], {
                      shell: true,
                  })
                : cp.spawn(leetCodeExecutor.node, [leetCodeBinaryPath, "user", loginArgsMapping.get("Cookie") ?? ""], {
                      shell: true,
                      env: createEnvOption(),
                  });

            childProc.stdout?.on("data", async (data: string | Buffer) => {
                data = data.toString();
                leetCodeChannel.append(data);
                const successMatch: RegExpMatchArray | null = data.match(this.successRegex);
                if (successMatch && successMatch[1]) {
                    childProc.stdin?.end();
                    return resolve();
                } else if (data.match(this.failRegex)) {
                    childProc.stdin?.end();
                    return reject(new Error("Faile to login"));
                }
            });

            childProc.stderr?.on("data", (data: string | Buffer) => leetCodeChannel.append(data.toString()));

            childProc.on("error", reject);
            childProc.stdin?.write(`${name}\n`);
            await sleep(800);
            childProc.stdin?.write(`${cookie}\n`);
        });
    }
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
