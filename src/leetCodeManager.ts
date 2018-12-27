// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { UserStatus } from "./shared";
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
            this.currentUser = result.slice("You are now login as".length).trim();
            this.userStatus = UserStatus.SignedIn;
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
                    ? cp.spawn("wsl", ["node", leetCodeBinaryPath, "user", "-l"], { shell: true })
                    : cp.spawn("node", [leetCodeBinaryPath, "user", "-l"], { shell: true });

                childProc.stdout.on("data", (data: string | Buffer) => {
                    data = data.toString();
                    result = result.concat(data);
                    leetCodeChannel.append(data);
                });

                childProc.stderr.on("data", (data: string | Buffer) => leetCodeChannel.append(data.toString()));

                childProc.on("error", reject);
                const name: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter user name.",
                    validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "User name must not be empty",
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
                        reject(new Error("Failed to sigin in."));
                    }
                });
            });
            if (userName) {
                vscode.window.showInformationMessage("Successfully signed in.");
                this.currentUser = userName;
                this.userStatus = UserStatus.SignedIn;
                this.emit("statusChanged");
            }
        } catch (error) {
            promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details", DialogType.error);
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
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
