"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";
import { leetcodeChannel } from "../leetCodeChannel";
import { leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogOptions, DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function getSignedInAccount(): Promise<string | undefined> {
    try {
        const result = await executeCommand("node", [leetCodeBinaryPath, "user"]);
        return result.slice("You are now login as".length).trim();
    } catch (error) {
        const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
            "[LeetCode] Would you like to sign in?",
            DialogOptions.yes,
            DialogOptions.no,
        );
        if (choice === DialogOptions.yes) {
            // sign in
        }
        return undefined;
    }
}

export async function signIn(): Promise<void> {
    // work around for interactive login
    try {
        await new Promise(async (resolve: (res: string) => void, reject: (e: Error) => void): Promise<void> => {
            let result: string = "";
            const childProc: cp.ChildProcess = cp.spawn("node", [leetCodeBinaryPath, "user", "-l"]);
            childProc.stdout.on("data", (data: string | Buffer) => {
                data = data.toString();
                result = result.concat(data);
                leetcodeChannel.append(data);
            });

            childProc.stderr.on("data", (data: string | Buffer) => leetcodeChannel.append(data.toString()));

            childProc.on("error", reject);
            childProc.on("exit", (code: number) => {
                if (code !== 0 || result.indexOf("ERROR") > -1) {
                    reject(new Error("Login failed"));
                } else {
                    resolve(result);
                }
            });
            const user: string | undefined = await vscode.window.showInputBox({
                prompt: "Enter user name.",
                validateInput: (s: string) => s ? undefined : "User name must not be empty",
            });
            if (!user) {
                childProc.kill();
                reject(new Error("Login Cancelled"));
            }
            childProc.stdin.write(`${user}\n`);
            const pwd: string | undefined = await vscode.window.showInputBox({
                prompt: "Enter user name.",
                password: true,
                validateInput: (s: string) => s ? undefined : "Password must not be empty",
            });
            if (!pwd) {
                childProc.kill();
                reject(new Error("Login Cancelled"));
            }
            childProc.stdin.write(`${pwd}\n`);
            childProc.stdin.end();
        });
        vscode.window.showInformationMessage("Successfully signed in.");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details", DialogType.error);
    }
}

export async function signOut(): Promise<void> {
    try {
        await executeCommand("node", [leetCodeBinaryPath, "user", "-L"]);
        vscode.window.showInformationMessage("Successfully signed out.");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign out. Please open the output channel for details", DialogType.error);
    }
}
