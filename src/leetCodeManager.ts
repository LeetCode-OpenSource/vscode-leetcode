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

class LeetCodeManager extends EventEmitter {
    private currentUser: string | undefined;
    private userStatus: UserStatus;

    constructor() {
        super();
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
    }

    public async getLoginStatus(): Promise<void> {
        try {
            const result: string = await leetCodeExecutor.getUserInfo();
            this.currentUser = this.tryParseUserName(result);
            this.userStatus = UserStatus.SignedIn;
        } catch (error) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
        } finally {
            this.emit("statusChanged");
        }
    }

    public async signIn(isByCookie: boolean = false): Promise<void> {
        const loginArg: string = "-l";
        const cookieArg: string = "-c";
        const commandArg: string = isByCookie ? cookieArg : loginArg;
        const inMessage: string = isByCookie ? "sign in by cookie" : "sign in";
        try {
            const userName: string | undefined = await new Promise(async (resolve: (res: string | undefined) => void, reject: (e: Error) => void): Promise<void> => {
                let result: string = "";

                const leetCodeBinaryPath: string = await leetCodeExecutor.getLeetCodeBinaryPath();

                const childProc: cp.ChildProcess = wsl.useWsl()
                    ? cp.spawn("wsl", [leetCodeExecutor.node, leetCodeBinaryPath, "user", commandArg], { shell: true })
                    : cp.spawn(leetCodeExecutor.node, [leetCodeBinaryPath, "user", commandArg], {
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
                    prompt: isByCookie ? "Enter cookie" : "Enter password.",
                    password: true,
                    validateInput: (s: string): string | undefined => s ? undefined : isByCookie ? "Cookie must not be empty" : "Password must not be empty",
                });
                if (!pwd) {
                    childProc.kill();
                    return resolve(undefined);
                }
                childProc.stdin.write(`${pwd}\n`);
                childProc.stdin.end();
                childProc.on("close", () => {
                    const match: RegExpMatchArray | null = result.match(/(?:.*) Successfully (login|cookie login) as (.*)/i);
                    if (match && match[2]) {
                        resolve(match[2]);
                    } else {
                        reject(new Error(`Failed to ${inMessage}.`));
                    }
                });
            });
            if (userName) {
                vscode.window.showInformationMessage(`Successfully ${inMessage}.`);
                this.currentUser = userName;
                this.userStatus = UserStatus.SignedIn;
                this.emit("statusChanged");
            }
        } catch (error) {
            promptForOpenOutputChannel(`Failed to ${inMessage}. Please open the output channel for details`, DialogType.error);
        }

    }

    public async signOut(): Promise<void> {
        try {
            await leetCodeExecutor.signOut();
            vscode.window.showInformationMessage("Successfully signed out.");
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
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
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
