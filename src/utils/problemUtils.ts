// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import kebabCase = require("lodash.kebabcase");
import { IProblem, langExt } from "../shared";

export function genFileExt(language: string): string {
    const ext: string | undefined = langExt.get(language);
    if (!ext) {
        throw new Error(`The language "${language}" is not supported.`);
    }
    return ext;
}

export function genFileName(node: IProblem, language: string): string {
    const slug: string = kebabCase(node.name);
    const ext: string = genFileExt(language);
    return `${node.id}.${slug}.${ext}`;
}
