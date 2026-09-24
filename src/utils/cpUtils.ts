// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";
import { containsCliError } from "./parseUtils";

interface IExecError extends Error {
    result?: string;
    stderr?: string;
}

export async function executeCommand(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    return new Promise((resolve: (res: string) => void, reject: (e: Error) => void): void => {
        let result: string = "";

        let stderrText: string = "";

        const childProc: cp.ChildProcess = cp.spawn(command, args, { ...options, env: createEnvOption() });

        // Decode as UTF-8 on the stream itself. Calling toString() per raw chunk
        // corrupts any multi-byte character that straddles a chunk boundary,
        // which mangles non-ASCII problem titles on leetcode.cn.
        childProc.stdout?.setEncoding("utf8");
        childProc.stderr?.setEncoding("utf8");

        childProc.stdout?.on("data", (data: string | Buffer) => {
            const text: string = data.toString();
            result = result.concat(text);
            leetCodeChannel.append(text);
        });

        childProc.stderr?.on("data", (data: string | Buffer) => {
            const text: string = data.toString();
            stderrText = stderrText.concat(text);
            leetCodeChannel.append(text);
        });

        childProc.on("error", reject);

        childProc.on("close", (code: number) => {
            // The CLI reports real failures with a "[ERROR]" tag at the start of a
            // line. Matching the bare substring "ERROR" anywhere used to turn
            // ordinary judge output and problem text into fake failures.
            if (code !== 0 || containsCliError(result)) {
                const error: IExecError = new Error(`Command "${command} ${args.toString()}" failed with exit code "${code}".`);
                if (result) {
                    error.result = result; // leetcode-cli may print useful content by exit with error code
                }
                if (stderrText) {
                    error.stderr = stderrText;
                }
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export async function executeCommandWithProgress(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    let result: string = "";
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (p: vscode.Progress<{}>) => {
        return new Promise<void>(async (resolve: () => void, reject: (e: Error) => void): Promise<void> => {
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

// clone process.env, add the http proxy, and force colourless child output.
export function createEnvOption(): {} {
    // Own properties only. Object.create(process.env) puts the real environment
    // on the prototype chain, where child_process does not see it.
    const env: { [key: string]: string | undefined } = { ...process.env };

    // The CLI colourises when these are set, and ANSI escapes break every
    // regex that parses its output.
    env.NO_COLOR = "1";
    env.FORCE_COLOR = "0";
    delete env.CLICOLOR_FORCE;

    const proxy: string | undefined = getHttpAgent();
    if (proxy) {
        env.http_proxy = proxy;
    }
    return env;
}

function getHttpAgent(): string | undefined {
    return vscode.workspace.getConfiguration("http").get<string>("proxy");
}
