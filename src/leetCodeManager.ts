// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { UserStatus } from "./shared";
import { createEnvOption } from "./utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";
import * as session from "./commands/session";


class LeetCodeManager extends EventEmitter {
    private currentUser: string | undefined;
    private activeSession: string | undefined;
    private userStatus: UserStatus;
    private sessionTrackTimer: NodeJS.Timer | undefined;

    constructor() {
        super();
        this.currentUser = undefined;
        this.activeSession = undefined;
        this.userStatus = UserStatus.SignedOut;
        this.sessionTrackTimer = undefined;
    }

    public async getLoginStatus(): Promise<void> {
        try {
            const result: string = await leetCodeExecutor.getUserInfo();
            this.currentUser = this.tryParseUserName(result);
            this.userStatus = UserStatus.SignedIn;
            await this.trackActiveSession();
        } catch (error) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
        } finally {
            this.emit("statusChanged");
        }
    }

    public async signIn(): Promise<void> {
        try {
            const userName: string | undefined = await new Promise(async (resolve: (res: string | undefined) => void, reject: (e: Error) => void): Promise<void> => {
                let result: string = "";

                const leetCodeBinaryPath: string = await leetCodeExecutor.getLeetCodeBinaryPath();

                const childProc: cp.ChildProcess = wsl.useWsl()
                    ? cp.spawn("wsl", [leetCodeExecutor.node, leetCodeBinaryPath, "user", "-l"], { shell: true })
                    : cp.spawn(leetCodeExecutor.node, [leetCodeBinaryPath, "user", "-l"], {
                        shell: true,
                        env: createEnvOption(),
                    });

                childProc.stdout.on("data", (data: string | Buffer) => {
                    data = data.toString();
                    result = result.concat(data);
                    leetCodeChannel.append(data);
                });

                childProc.stderr.on("data", (data: string | Buffer) => leetCodeChannel.append(data.toString()));

                childProc.on("error", reject);
                const name: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter username or E-mail.",
                    validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "The input must not be empty",
                });
                if (!name) {
                    childProc.kill();
                    return resolve(undefined);
                }
                childProc.stdin.write(`${name}\n`);
                const pwd: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter password.",
                    password: true,
                    validateInput: (s: string): string | undefined => s ? undefined : "Password must not be empty",
                });
                if (!pwd) {
                    childProc.kill();
                    return resolve(undefined);
                }
                childProc.stdin.write(`${pwd}\n`);
                childProc.stdin.end();
                childProc.on("close", () => {
                    const match: RegExpMatchArray | null = result.match(/(?:.*) Successfully login as (.*)/i);
                    if (match && match[1]) {
                        resolve(match[1]);
                    } else {
                        reject(new Error("Failed to sign in."));
                    }
                });
            });
            if (userName) {
                vscode.window.showInformationMessage("Successfully signed in.");
                this.currentUser = userName;
                this.userStatus = UserStatus.SignedIn;
                this.trackActiveSession();
                this.emit("statusChanged");
            }
        } catch (error) {
            promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details", DialogType.error);
        }

    }

    async trackActiveSession(): Promise<void> {
        if (this.sessionTrackTimer === undefined) {
            this.sessionTrackTimer = setInterval(() => {
                this.updateActiveSession();
            }, 10 * 1000);
            setTimeout(() => {
                this.updateActiveSession();
            }, 2000);
        }
    }

    async untrackActiveSession(): Promise<void> {
        if (this.sessionTrackTimer) {
            clearInterval(this.sessionTrackTimer);
            this.sessionTrackTimer = undefined;
        }
    }



    async updateActiveSession(): Promise<void> {
        const activeSessionInfo: session.ISession | void = await session.getActiveSession();
        if (activeSessionInfo !== undefined) {
            this.activeSession = activeSessionInfo.name;
            this.emit("sessionChanged");
        }
    }

    public async signOut(): Promise<void> {
        try {
            await leetCodeExecutor.signOut();
            vscode.window.showInformationMessage("Successfully signed out.");
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            this.activeSession = undefined;
            this.untrackActiveSession();
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

    public getActiveSession(): string | undefined {
        return this.activeSession;
    }

    private tryParseUserName(output: string): string {
        const reg: RegExp = /^\s*.\s*(.+?)\s*https:\/\/leetcode/m;
        const match: RegExpMatchArray | null = output.match(reg);
        if (match && match.length === 2) {
            return match[1].trim();
        }

        return "Unknown";
    }
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
