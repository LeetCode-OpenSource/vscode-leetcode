// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { EventEmitter } from "events";
import * as vscode from "vscode";
import { invalidateProblemCache } from "./api/problems";
import { normalizeCookie, validateCookie } from "./auth/cookie";
import { leetCodeChannel } from "./leetCodeChannel";
import { Endpoint, getUrl, IQuickItemEx, urls, urlsCn, UserStatus } from "./shared";
import { DialogType, openUrl, promptForOpenOutputChannel } from "./utils/uiUtils";
import { getLeetCodeEndpoint } from "./commands/plugin";
import { globalState } from "./globalState";
import { queryUserData } from "./request/query-user-data";
import { parseQuery } from "./utils/toolUtils";

class LeetCodeManager extends EventEmitter {
    private currentUser: string | undefined;
    private userStatus: UserStatus;

    constructor() {
        super();
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
        this.handleUriSignIn = this.handleUriSignIn.bind(this);
    }

    public async getLoginStatus(): Promise<void> {
        invalidateProblemCache();
        try {
            const storedCookie: string | undefined = globalState.getCookie();
            if (storedCookie) {
                try {
                    const data = await queryUserData(storedCookie);
                    if (data.isSignedIn && data.username) {
                        this.currentUser = data.username;
                        this.userStatus = UserStatus.SignedIn;
                        await globalState.setUserStatus(data);
                        await globalState.saveProfile(globalState.getActiveProfile() || data.username, data.username, storedCookie);
                        return;
                    }
                } catch (error) {
                    leetCodeChannel.appendLine(`[WARN] Failed to validate the stored cookie: ${error}`);
                }
            }

            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
            await globalState.removeAll();
        } finally {
            this.emit("statusChanged");
        }
    }

    private async updateUserStatusWithCookie(cookie: string): Promise<void> {
        const validationError: string | undefined = validateCookie(cookie);
        if (validationError) {
            throw new Error(validationError);
        }
        const normalizedCookie: string = normalizeCookie(cookie);
        const endpoint: string = getUrl("userGraphql");
        leetCodeChannel.appendLine(`[INFO] Validating cookie against ${endpoint}`);

        const data = await queryUserData(normalizedCookie);
        leetCodeChannel.appendLine(`[INFO] Sign-in result: signedIn=${data.isSignedIn}, username=${data.username ? "present" : "missing"}`);
        if (!data.isSignedIn || !data.username) {
            throw new Error(`The cookie is not signed in for ${endpoint}. Check that leetcode.endpoint matches the cookie's site, then copy a fresh cookie.`);
        }

        invalidateProblemCache();
        await globalState.saveProfile(data.username, data.username, normalizedCookie);
        await globalState.setUserStatus(data);
        this.currentUser = data.username;
        this.userStatus = UserStatus.SignedIn;

        this.emit("statusChanged");
        vscode.window.showInformationMessage(vscode.l10n.t("Successfully signed in as {0}.", data.username));
    }

    public async handleUriSignIn(uri: vscode.Uri): Promise<void> {
        let queryParams: { [key: string]: string };
        try {
            queryParams = parseQuery(uri.query);
        } catch (error) {
            leetCodeChannel.appendLine(`[ERROR] Invalid sign-in callback: ${error}`);
            await promptForOpenOutputChannel("Failed to parse the sign-in callback. Please sign in again.", DialogType.error);
            return;
        }

        const cookie: string | undefined = queryParams["cookie"];
        if (!cookie) {
            leetCodeChannel.appendLine("[ERROR] The sign-in callback did not include a cookie.");
            await promptForOpenOutputChannel("Failed to get the cookie. Please sign in again.", DialogType.error);
            return;
        }

        try {
            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: "Signing in to LeetCode..." },
                async (progress) => {
                    progress.report({ message: "Validating cookie..." });
                    await this.updateUserStatusWithCookie(cookie);
                },
            );
        } catch (error) {
            leetCodeChannel.appendLine(`[ERROR] URI sign-in failed: ${error}`);
            const detail: string = error instanceof Error ? error.message : String(error);
            await promptForOpenOutputChannel(`Failed to log in: ${detail}`, DialogType.error);
        }
    }

    public async handleInputCookieSignIn(): Promise<void> {
        const cookie: string | undefined = await vscode.window.showInputBox({
            prompt: vscode.l10n.t("Paste the Cookie header copied from leetcode.cn"),
            placeHolder: "LEETCODE_SESSION=...; csrftoken=...",
            password: true,
            ignoreFocusOut: true,
            validateInput: (value: string): string | undefined => validateCookie(value),
        });
        if (!cookie) {
            return;
        }

        await this.updateUserStatusWithCookie(cookie);
    }

    public async signIn(): Promise<void> {
        const picks: Array<IQuickItemEx<string>> = [
            {
                label: vscode.l10n.t("LeetCode Cookie"),
                detail: vscode.l10n.t("Paste the Cookie header copied from browser DevTools"),
                value: "Cookie",
                description: "[Recommended]",
            },
            {
                label: vscode.l10n.t("Web Authorization"),
                detail: vscode.l10n.t("Open the browser to authorize login on the website"),
                value: "WebAuth",
            },
        ];

        const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
        if (!choice) {
            return;
        }

        if (choice.value === "WebAuth") {
            openUrl(this.getAuthLoginUrl());
            return;
        }

        try {
            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: "Signing in to LeetCode..." },
                async () => {
                    await this.handleInputCookieSignIn();
                },
            );
        } catch (error) {
            leetCodeChannel.appendLine(`[ERROR] Cookie sign-in failed: ${error}`);
            const detail: string = error instanceof Error ? error.message : String(error);
            await promptForOpenOutputChannel(`Failed to log in: ${detail}`, DialogType.error);
        }
    }

    public async signOut(): Promise<void> {
        this.currentUser = undefined;
        this.userStatus = UserStatus.SignedOut;
        await globalState.removeAll();
        invalidateProblemCache();
        this.emit("statusChanged");
        vscode.window.showInformationMessage(vscode.l10n.t("Successfully signed out."));
    }

    public async switchProfile(name: string): Promise<void> {
        const cookie: string = await globalState.activateProfile(name);
        const data = await queryUserData(cookie);
        if (!data.isSignedIn || !data.username) {
            throw new Error("The selected session is no longer signed in.");
        }
        invalidateProblemCache();
        await globalState.setUserStatus(data);
        this.currentUser = data.username;
        this.userStatus = UserStatus.SignedIn;
        this.emit("statusChanged");
        vscode.window.showInformationMessage(vscode.l10n.t("Switched to session \"{0}\".", name));
    }

    public async createProfile(name: string, cookie: string): Promise<void> {
        const validationError: string | undefined = validateCookie(cookie);
        if (validationError) {
            throw new Error(validationError);
        }
        const normalizedCookie: string = normalizeCookie(cookie);
        const data = await queryUserData(normalizedCookie);
        if (!data.isSignedIn || !data.username) {
            throw new Error("The cookie is not signed in. Please sign in on leetcode.cn and copy a fresh cookie.");
        }
        invalidateProblemCache();
        await globalState.saveProfile(name, data.username, normalizedCookie);
        await globalState.setUserStatus(data);
        this.currentUser = data.username;
        this.userStatus = UserStatus.SignedIn;
        this.emit("statusChanged");
        vscode.window.showInformationMessage(vscode.l10n.t("Session \"{0}\" is ready.", name));
    }

    public async deleteProfile(name: string): Promise<void> {
        await globalState.deleteProfile(name);
        invalidateProblemCache();
        if (!globalState.getCookie()) {
            this.currentUser = undefined;
            this.userStatus = UserStatus.SignedOut;
        }
        this.emit("statusChanged");
        vscode.window.showInformationMessage(vscode.l10n.t("Session \"{0}\" deleted.", name));
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
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
