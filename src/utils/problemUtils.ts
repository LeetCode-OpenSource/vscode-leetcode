// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { IProblem, langExt } from "../shared";

export function genFileExt(language: string): string {
    const ext: string | undefined = langExt.get(language);
    if (!ext) {
        throw new Error(`The language "${language}" is not supported.`);
    }
    return ext;
}

export function genFileName(node: IProblem, language: string): string {
    const slug: string = _.kebabCase(node.name);
    const ext: string = genFileExt(language);
    return `${node.id}.${slug}.${ext}`;
}

export async function getNodeIdFromFile(fsPath: string): Promise<string> {
    const fileContent: string = await fse.readFile(fsPath, "utf8");
    let id: string = "";
    const matchResults: RegExpMatchArray | null = fileContent.match(/@lc.+id=(.+?) /);
    if (matchResults && matchResults.length === 2) {
        id = matchResults[1];
    }
    // Try to get id from file name if getting from comments failed
    if (!id) {
        id = path.basename(fsPath).split(".")[0];
    }

    return id;
}
