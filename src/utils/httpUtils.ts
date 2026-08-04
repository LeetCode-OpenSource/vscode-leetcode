import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { omit } from "lodash";
import { globalState } from "../globalState";
import { DialogType, promptForOpenOutputChannel } from "./uiUtils";
import { t } from "../i18n";

const referer = "vscode-lc-extension";

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig): AxiosPromise<T> {
    const cookie = globalState.getCookie();
    if (!cookie) {
        promptForOpenOutputChannel(
            t("failed_to_obtain_cookie"),
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
