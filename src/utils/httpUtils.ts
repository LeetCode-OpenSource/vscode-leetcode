import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { omit } from "lodash";
import { globalState } from "../globalState";

const referer = "vscode-lc-extension";

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig, cookieOverride?: string): AxiosPromise<T> {
    const cookie = cookieOverride ?? globalState.getCookie();
    if (!cookie) {
        return Promise.reject(new Error("Failed to obtain the cookie. Please log in again."));
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
