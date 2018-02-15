"use strict";

import * as cp from "child_process";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { UserStatus } from "./shared";
import { leetCodeBinaryPath } from "./shared";
import { executeCommand } from "./utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";

export interface ILeetCodeManager extends EventEmitter {
    getLoginStatus(channel: vscode.OutputChannel): void;
    getStatus(): UserStatus;
    getUser(): string | undefined;
    signIn(channel: vscode.OutputChannel): void;
    signOut(channel: vscode.OutputChannel): void;
}

class LeetCodeManager extends EventEmitter implements ILeetCodeManager {
    private currentUser: string | undefined;
    private userStatus: UserStatus;

    constructor() {
        super();
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
    }

    public async getLoginStatus(channel: vscode.OutputChannel): Promise<void> {
        try {
            const result = await executeCommand(channel, "node", [leetCodeBinaryPath, "user"]);
            this.currentUser = result.slice("You are now login as".length).trim();
            this.userStatus = UserStatus.SignedIn;
        } catch (error) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
        } finally {
            this.emit("statusChanged");
        }
    }

    public async signIn(channel: vscode.OutputChannel): Promise<void> {
        try {
            const userName: string | undefined = await new Promise(async (resolve: (res: string | undefined) => void, reject: (e: Error) => void): Promise<void> => {
                let result: string = "";
                const childProc: cp.ChildProcess = cp.spawn("node", [leetCodeBinaryPath, "user", "-l"]);
                childProc.stdout.on("data", (data: string | Buffer) => {
                    data = data.toString();
                    result = result.concat(data);
                    channel.append(data);
                });

                childProc.stderr.on("data", (data: string | Buffer) => channel.append(data.toString()));

                childProc.on("error", reject);
                const name: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter user name.",
                    validateInput: (s: string) => s.trim() ? undefined : "User name must not be empty",
                });
                if (!name) {
                    childProc.kill();
                    resolve(undefined);
                }
                childProc.stdin.write(`${name}\n`);
                const pwd: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter password.",
                    password: true,
                    validateInput: (s: string) => s ? undefined : "Password must not be empty",
                });
                if (!pwd) {
                    childProc.kill();
                    resolve(undefined);
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
            promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details", DialogType.error, channel);
        }

    }

    public async signOut(channel: vscode.OutputChannel): Promise<void> {
        try {
            await executeCommand(channel, "node", [leetCodeBinaryPath, "user", "-L"]);
            vscode.window.showInformationMessage("Successfully signed out.");
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            this.emit("statusChanged");
        } catch (error) {
            promptForOpenOutputChannel("Failed to sign out. Please open the output channel for details", DialogType.error, channel);
        }
    }

    public getStatus(): UserStatus {
        return this.userStatus;
    }

    public getUser(): string | undefined {
        return this.currentUser;
    }
}

export const leetCodeManager: ILeetCodeManager = new LeetCodeManager();
