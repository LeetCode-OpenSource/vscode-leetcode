import kebabCase = require('lodash.kebabcase');
import { IProblem, langExt } from '../shared';
import * as vscode from 'vscode';
import { supplantTpl } from './templateUtils';

const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('leetcode');
let fileNameTpl: string = leetCodeConfig.get<string>('fileName') || '';

export function genFileExt(language: string): string {
  const ext: string | undefined = langExt.get(language);
  if (!ext) {
    throw new Error(`The language "${language}" is not supported.`);
  }
  return ext;
}

export async function genFileName(node: IProblem, language: string): Promise<string> {
  const slug: string = kebabCase(node.name);
  const ext: string = genFileExt(language);
  let name = `${node.id}.${slug}.${ext}`;
  if (!fileNameTpl) {
    return name;
  } else {
    return `${await supplantTpl(fileNameTpl, node, language)}.${ext}` || name;
  }
}
