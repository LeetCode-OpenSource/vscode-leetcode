import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { omit } from "lodash";
import { globalState } from "../globalState";
import { getUrl } from "../shared";
import { DialogType, promptForOpenOutputChannel } from "./uiUtils";

function extractCsrfToken(cookie: string): string {
    const match = cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
}

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig): AxiosPromise<T> {
    const cookie = globalState.getCookie();
    if (!cookie) {
        promptForOpenOutputChannel(
            `Failed to obtain the cookie. Please log in again.`,
            DialogType.error
        );
        return Promise.reject("Failed to obtain the cookie.");
    }

    const baseUrl = getUrl("base");
    const csrfToken = extractCsrfToken(cookie);

    return axios(path, {
        headers: {
            "Origin": baseUrl,
            "Referer": baseUrl,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "content-type": "application/json",
            "cookie": cookie,
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
            ...(settings && settings.headers),
        },
        ...(settings && omit(settings, "headers")),
    });
}
