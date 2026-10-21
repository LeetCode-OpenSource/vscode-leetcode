// Copyright (c) leo.zhao. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

const CookieKey = "leetcode-cookie";
const UserStatusKey = "leetcode-user-status";
const ProfilesKey = "leetcode-profiles";
const ActiveProfileKey = "leetcode-active-profile";

export interface IProfileInfo {
    name: string;
    username: string;
    updatedAt: number;
}

function profileCookieKey(name: string): string {
    return `${CookieKey}:${name}`;
}

export type UserDataType = {
    isSignedIn: boolean;
    isPremium: boolean;
    username: string;
    avatar: string;
    isVerified?: boolean;
};

class GlobalState {
    private context: vscode.ExtensionContext | undefined;
    private _state: vscode.Memento | undefined;
    private _cookie: string | undefined;
    private _userStatus: UserDataType | undefined;
    private _profiles: IProfileInfo[] = [];
    private _activeProfile: string | undefined;

    /**
     * Loads the cookie from SecretStorage and migrates a legacy cookie that was
     * previously stored in globalState.
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        this.context = context;
        this._state = context.globalState;

        this._profiles = this._state.get<IProfileInfo[]>(ProfilesKey) || [];
        this._activeProfile = this._state.get<string>(ActiveProfileKey);
        if (this._activeProfile) {
            this._cookie = await context.secrets.get(profileCookieKey(this._activeProfile));
        }
        if (!this._cookie) {
            this._cookie = await context.secrets.get(CookieKey);
        }
        if (this._cookie) {
            return;
        }

        const legacyCookie: string | undefined = this._state.get<string>(CookieKey);
        if (legacyCookie) {
            this._cookie = legacyCookie;
            await context.secrets.store(CookieKey, legacyCookie);
            await this._state.update(CookieKey, undefined);
        }
    }

    public async setCookie(cookie: string): Promise<void> {
        if (!this.context) {
            throw new Error("GlobalState is not initialized.");
        }
        this._cookie = cookie;
        await this.context.secrets.store(CookieKey, cookie);
    }

    public getCookie(): string | undefined {
        return this._cookie;
    }

    public getProfiles(): IProfileInfo[] {
        return this._profiles.slice();
    }

    public getActiveProfile(): string | undefined {
        return this._activeProfile;
    }

    public async saveProfile(name: string, username: string, cookie: string): Promise<void> {
        if (!this.context || !this._state) {
            throw new Error("GlobalState is not initialized.");
        }
        const info: IProfileInfo = { name, username, updatedAt: Date.now() };
        const index: number = this._profiles.findIndex((profile: IProfileInfo) => profile.name === name);
        if (index >= 0) {
            this._profiles[index] = info;
        } else {
            this._profiles.push(info);
        }
        this._cookie = cookie;
        this._activeProfile = name;
        await this.context.secrets.store(profileCookieKey(name), cookie);
        await this.context.secrets.store(CookieKey, cookie);
        await this._state.update(ProfilesKey, this._profiles);
        await this._state.update(ActiveProfileKey, name);
    }

    public async activateProfile(name: string): Promise<string> {
        if (!this.context || !this._state) {
            throw new Error("GlobalState is not initialized.");
        }
        if (!this._profiles.some((profile: IProfileInfo) => profile.name === name)) {
            throw new Error(`Profile not found: ${name}`);
        }
        const cookie: string | undefined = await this.context.secrets.get(profileCookieKey(name));
        if (!cookie) {
            throw new Error(`The cookie for profile "${name}" is missing.`);
        }
        this._cookie = cookie;
        this._activeProfile = name;
        await this.context.secrets.store(CookieKey, cookie);
        await this._state.update(ActiveProfileKey, name);
        return cookie;
    }

    public async deleteProfile(name: string): Promise<void> {
        if (!this.context || !this._state) {
            throw new Error("GlobalState is not initialized.");
        }
        this._profiles = this._profiles.filter((profile: IProfileInfo) => profile.name !== name);
        await this.context.secrets.delete(profileCookieKey(name));
        if (this._activeProfile === name) {
            this._cookie = undefined;
            this._activeProfile = undefined;
            await this.context.secrets.delete(CookieKey);
            await this._state.update(ActiveProfileKey, undefined);
        }
        await this._state.update(ProfilesKey, this._profiles);
    }

    public async setUserStatus(userStatus: UserDataType): Promise<void> {
        this._userStatus = userStatus;
        await this._state?.update(UserStatusKey, userStatus);
    }

    public getUserStatus(): UserDataType | undefined {
        return this._userStatus ?? this._state?.get<UserDataType>(UserStatusKey);
    }

    public async removeCookie(): Promise<void> {
        this._cookie = undefined;
        await this.context?.secrets.delete(CookieKey);
    }

    public async removeAll(): Promise<void> {
        this._cookie = undefined;
        this._userStatus = undefined;
        this._activeProfile = undefined;
        await this.context?.secrets.delete(CookieKey);
        await this._state?.update(CookieKey, undefined);
        await this._state?.update(UserStatusKey, undefined);
        await this._state?.update(ActiveProfileKey, undefined);
    }
}

export const globalState: GlobalState = new GlobalState();
