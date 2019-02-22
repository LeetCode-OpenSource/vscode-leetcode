import kebabCase = require("lodash.kebabcase");
import { IProblem, langExt } from "../shared";

export function genFileName(node: IProblem, language: string): string {
    const name: string = kebabCase(node.name);
    const ext: string | undefined = langExt.get(language);
    return `${node.id}.${name}.${ext}`;
}
