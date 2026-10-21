// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

const REQUIRED_COOKIES: string[] = ["LEETCODE_SESSION", "csrftoken"];

/**
 * Keeps only the cookies required by the extension and the bundled CLI.
 * Extra cookies from a full browser header are intentionally dropped.
 */
export function normalizeCookie(raw: string): string {
    const text: string = raw.trim().replace(/^cookie\s*:/i, "").replace(/\r?\n/g, " ");
    const pairs: Map<string, string> = new Map<string, string>();

    for (const part of text.split(";")) {
        const item: string = part.trim();
        const equalsIndex: number = item.indexOf("=");
        if (equalsIndex <= 0) {
            continue;
        }
        const name: string = item.slice(0, equalsIndex).trim();
        if (REQUIRED_COOKIES.indexOf(name) < 0) {
            continue;
        }
        pairs.set(name, item.slice(equalsIndex + 1).trim());
    }

    return REQUIRED_COOKIES
        .filter((name: string) => Boolean(pairs.get(name)))
        .map((name: string) => `${name}=${pairs.get(name)}`)
        .join("; ");
}

export function validateCookie(raw: string): string | undefined {
    if (!raw || !raw.trim()) {
        return "Cookie must not be empty.";
    }

    const normalized: string = normalizeCookie(raw);
    if (!normalized) {
        return "Cookie must contain LEETCODE_SESSION and csrftoken.";
    }
    if (!/(?:^|;\s*)LEETCODE_SESSION=/.test(normalized)) {
        return "Cookie must contain LEETCODE_SESSION.";
    }
    if (!/(?:^|;\s*)csrftoken=/.test(normalized)) {
        return "Cookie must contain csrftoken.";
    }
    return undefined;
}
