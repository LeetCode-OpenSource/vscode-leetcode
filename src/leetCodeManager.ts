// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { Endpoint, IQuickItemEx, loginArgsMapping, urls, urlsCn, UserStatus } from "./shared";
import { createEnvOption } from "./utils/cpUtils";
import { DialogType, openUrl, promptForOpenOutputChannel } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";
import { getLeetCodeEndpoint } from "./commands/plugin";
import { globalState } from "./globalState";
import { queryUserData } from "./request/query-user-data";
import { parseQuery } from "./utils/toolUtils";
import { tryParseUserName } from "./utils/parseUtils";

/** How long to wait for the CLI to confirm a login before giving up. */
const LOGIN_TIMEOUT_MS: number = 30 * 1000;
/** A prompt repeating past this means the CLI is rejecting our input in a loop. */
const MAX_PROMPT_REPEATS: number = 3;

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
            const name: string = tryParseUserName(result);
            if (!name) {
                // A half-written CLI record prints the literal "undefined" here.
                // Treating that as a signed-in user wedged the extension permanently.
                throw new Error("The LeetCode CLI did not report a usable user.");
            }
            this.currentUser = name;
            this.userStatus = UserStatus.SignedIn;
        } catch (error) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            globalState.removeAll();
        } finally {
            this.emit("statusChanged");
        }
    }

    private async updateUserStatusWithCookie(cookie: string): Promise<void> {
        if (!cookie || !cookie.trim()) {
            throw new Error("Cookie must not be empty.");
        }

        globalState.setCookie(cookie);

        const data = await queryUserData();
        // LeetCode answers HTTP 200 with an empty username for a bad cookie, so
        // this must be checked explicitly. Handing an empty name to the CLI used
        // to spin its `login:` prompt forever with no error ever shown.
        if (!data || !data.isSignedIn || !data.username) {
            globalState.removeAll();
            throw new Error(
                "LeetCode rejected this cookie. It is invalid or expired. " +
                "Copy a fresh cookie (it must include both LEETCODE_SESSION and csrftoken) from your browser and try again.",
            );
        }

        globalState.setUserStatus(data);
        await this.setCookieToCli(cookie, data.username);

        vscode.window.showInformationMessage(`Successfully signed in as ${data.username}.`);
        this.currentUser = data.username;
        this.userStatus = UserStatus.SignedIn;
        this.emit("statusChanged");
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

                await this.updateUserStatusWithCookie(cookie)

            });
        } catch (error) {
            leetCodeChannel.appendLine(`${error}`);
            const detail: string = error instanceof Error ? error.message : `${error}`;
            promptForOpenOutputChannel(`Failed to sign in: ${detail}`, DialogType.error);
        }
    }

    public async handleInputCookieSignIn(): Promise<void> {
        const cookie: string | undefined = await vscode.window.showInputBox({
            prompt: 'Enter LeetCode Cookie',
            password: true,
            ignoreFocusOut: true,
            validateInput: (s: string): string | undefined =>
                s ? undefined : 'Cookie must not be empty',
        })

        await this.updateUserStatusWithCookie(cookie || '')
    }

    public async signIn(): Promise<void> {
        const picks: Array<IQuickItemEx<string>> = []
        picks.push(
            {
                label: 'Web Authorization',
                detail: 'Open browser to authorize login on the website',
                value: 'WebAuth',
                description: '[Recommended]'
            },
            {
                label: 'LeetCode Cookie',
                detail: 'Use LeetCode cookie copied from browser to login',
                value: 'Cookie',
            }
        )

        const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks)
        if (!choice) {
            return
        }
        const loginMethod: string = choice.value

        if (loginMethod === 'WebAuth') {
            openUrl(this.getAuthLoginUrl())
            return
        }

        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Fetching user data..." }, async () => {
                await this.handleInputCookieSignIn()
            });
        } catch (error) {
            leetCodeChannel.appendLine(`${error}`);
            const detail: string = error instanceof Error ? error.message : `${error}`;
            promptForOpenOutputChannel(`Failed to sign in: ${detail}`, DialogType.error);
        }
    }

    public async signOut(): Promise<void> {
        try {
            await leetCodeExecutor.signOut();
        } catch (error) {
            // The CLI may already be signed out. Log it, but still clear our own
            // state below so the user is never left half signed in.
            leetCodeChannel.appendLine(`Sign out via the LeetCode CLI failed, clearing local state anyway: ${error}`);
        }
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
        globalState.removeAll();
        vscode.window.showInformationMessage("Successfully signed out.");
        this.emit("statusChanged");
    }

    public getStatus(): UserStatus {
        return this.userStatus;
    }

    public getUser(): string | undefined {
        return this.currentUser;
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
        return new Promise((resolve: (res: void) => void, reject: (e: Error) => void): void => {
            void (async () => {
                const leetCodeBinaryPath: string = await leetCodeExecutor.getLeetCodeBinaryPath();

                const childProc: cp.ChildProcess = wsl.useWsl()
                    ? cp.spawn("wsl", [leetCodeExecutor.node, leetCodeBinaryPath, "user", loginArgsMapping.get("Cookie") ?? ""], {
                          env: createEnvOption(),
                      })
                    : cp.spawn(leetCodeExecutor.node, [leetCodeBinaryPath, "user", loginArgsMapping.get("Cookie") ?? ""], {
                          env: createEnvOption(),
                      });

                // The promise used to be settleable only from a stdout match, so an
                // invalid cookie left it pending forever: the CLI either re-prompted
                // in a tight loop or crashed outright, and the user saw a progress
                // notification that never ended and no error at all.
                let settled: boolean = false;
                let buffered: string = "";
                let loginPrompts: number = 0;
                let cookiePrompts: number = 0;

                const timer: NodeJS.Timeout = setTimeout(() => {
                    finish(() => reject(new Error(
                        "Timed out after 30s waiting for the LeetCode CLI to confirm the login.",
                    )));
                }, LOGIN_TIMEOUT_MS);

                function finish(action: () => void): void {
                    if (settled) {
                        return;
                    }
                    settled = true;
                    clearTimeout(timer);
                    action();
                }

                function failWith(reason: string): void {
                    finish(() => reject(new Error(`${reason}${buffered.trim() ? ` CLI output: ${buffered.trim().slice(-500)}` : ""}`)));
                }

                childProc.stdout?.setEncoding("utf8");
                childProc.stderr?.setEncoding("utf8");

                childProc.stdout?.on("data", (data: string | Buffer) => {
                    const chunk: string = data.toString();
                    leetCodeChannel.append(chunk);
                    buffered = buffered.concat(chunk);

                    // Match against accumulated output: a prompt or the success
                    // line can straddle two chunks.
                    if (this.successRegex.test(buffered)) {
                        childProc.stdin?.end();
                        finish(() => resolve());
                        return;
                    }
                    if (this.failRegex.test(buffered)) {
                        childProc.stdin?.end();
                        failWith("The LeetCode CLI rejected the login.");
                        return;
                    }
                    if (/login: /.test(chunk)) {
                        loginPrompts += 1;
                        if (loginPrompts > MAX_PROMPT_REPEATS) {
                            childProc.stdin?.end();
                            failWith("The LeetCode CLI kept re-asking for the user name, which means it rejected the credentials.");
                            return;
                        }
                        childProc.stdin?.write(`${name}\n`);
                    } else if (/cookie: /.test(chunk)) {
                        cookiePrompts += 1;
                        if (cookiePrompts > MAX_PROMPT_REPEATS) {
                            childProc.stdin?.end();
                            failWith("The LeetCode CLI kept re-asking for the cookie, which means it rejected it.");
                            return;
                        }
                        childProc.stdin?.write(`${cookie}\n`);
                    }
                });

                childProc.stderr?.on("data", (data: string | Buffer) => {
                    const chunk: string = data.toString();
                    leetCodeChannel.append(chunk);
                    buffered = buffered.concat(chunk);
                    // The CLI validates prompt input on stderr, e.g.
                    // "error: Invalid input for login". That used to be ignored.
                    if (/Invalid input for/i.test(chunk)) {
                        childProc.stdin?.end();
                        failWith("The LeetCode CLI rejected the sign-in input.");
                    }
                });

                childProc.on("error", (e: Error) => finish(() => reject(e)));

                // "error" only fires when the process cannot be spawned. Without a
                // "close" handler a child that starts and then dies never settles.
                childProc.on("close", (code: number) => {
                    failWith(`The LeetCode CLI exited with code ${code} without confirming the login.`);
                });
            })().catch((e: Error) => reject(e));
        });
    }
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
