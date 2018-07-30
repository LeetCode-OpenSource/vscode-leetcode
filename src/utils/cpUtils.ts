"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";
import * as wsl from "./wslUtils";

export async function executeCommand(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    return new Promise((resolve: (res: string) => void, reject: (e: Error) => void): void => {
        let result: string = "";

        const childProc: cp.ChildProcess = wsl.useWsl()
            ? cp.spawn("wsl", [command].concat(args), options)
            : cp.spawn(command, args, options);

        childProc.stdout.on("data", (data: string | Buffer) => {
            data = data.toString();
            result = result.concat(data);
            leetCodeChannel.append(data);
        });

        childProc.stderr.on("data", (data: string | Buffer) => leetCodeChannel.append(data.toString()));

        childProc.on("error", reject);
        childProc.on("close", (code: number) => {
            if (code !== 0 || result.indexOf("ERROR") > -1) {
                reject(new Error(`Command "${command} ${args.toString()}" failed with exit code "${code}".`));
            } else {
                resolve(result);
            }
        });
    });
}

export async function executeCommandWithProgress(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    let result: string = "";
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async (p: vscode.Progress<{}>) => {
        return new Promise(async (resolve: () => void, reject: (e: Error) => void): Promise<void> => {
            p.report({ message });
            try {
                result = await executeCommand(command, args, options);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    });
    return result;
}
