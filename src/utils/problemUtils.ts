import kebabCase = require("lodash.kebabcase");
import * as pinyin from "pinyin";
import { Endpoint, IProblem, langExt } from "../shared";

export function genFileExt(language: string): string {
    const ext: string | undefined = langExt.get(language);
    if (!ext) {
        throw new Error(`The language "${language}" is not supported.`);
    }
    return ext;
}

export function genFileSlug(node: IProblem, endpoint: Endpoint): string {
    switch (endpoint) {
        case Endpoint.LeetCodeCN:
            return kebabCase(pinyin(node.name, { style: pinyin.STYLE_NORMAL }).join(""));
        case Endpoint.LeetCode:
        default:
            return kebabCase(node.name);
    }
}

export function genFileName(node: IProblem, language: string, endpoint: Endpoint): string {
    const slug: string = genFileSlug(node, endpoint);
    const ext: string = genFileExt(language);
    return `${node.id}.${slug}.${ext}`;
}
