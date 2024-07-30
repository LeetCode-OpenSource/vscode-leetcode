import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { omit } from "lodash";
import { globalState } from "../globalState";
import { DialogType, promptForOpenOutputChannel } from "./uiUtils";

const referer = "vscode-lc-extension";

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig): AxiosPromise<T> {
    const cookie = globalState.getCookie();
    if (!cookie) {
        promptForOpenOutputChannel(
            `Failed to obtain the cookie. Please log in again.`,
            DialogType.error
        );
        return Promise.reject("Failed to obtain the cookie.");
    }
    return axios(path, {
        headers: {
            referer,
            "content-type": "application/json",
            cookie,
            ...(settings && settings.headers),
        },
        xsrfCookieName: "csrftoken",
        xsrfHeaderName: "X-CSRFToken",
        ...(settings && omit(settings, "headers")),
    });
}
