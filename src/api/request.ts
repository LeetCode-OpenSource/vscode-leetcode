// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { globalState } from "../globalState";
import { getUrl } from "../shared";
import { IGraphQLRequest } from "./client";

export function getLeetCodeRequest(): IGraphQLRequest {
    const endpoint: string = getUrl("graphql");
    return {
        endpoint,
        origin: endpoint.replace(/\/graphql\/?$/, ""),
        cookie: globalState.getCookie() || "",
    };
}
