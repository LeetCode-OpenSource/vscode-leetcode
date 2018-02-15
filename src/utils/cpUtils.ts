"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";

export async function executeCommand(channel: vscode.OutputChannel, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    return new Promise((resolve: (res: string) => void, reject: (e: Error) => void): void => {
        let result: string = "";
        const childProc: cp.ChildProcess = cp.spawn(command, args, options);

        childProc.stdout.on("data", (data: string | Buffer) => {
            data = data.toString();
            result = result.concat(data);
            channel.append(data);
        });

        childProc.stderr.on("data", (data: string | Buffer) => channel.append(data.toString()));

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
