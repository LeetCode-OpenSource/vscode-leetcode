import { IProblem } from "../shared";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";

export async function supplantTpl(tpl: string, node: IProblem, selectedLanguage: string): Promise<string | undefined> {
  const reg: RegExp = /[^{][a-zA-Z0-9]+(?=\})/g;
  const matchResults: RegExpMatchArray = tpl.match(reg) || [];
  let str: string = "";
  for (const token of matchResults) {
    str += await getFiledValue(token, node, selectedLanguage);
  }

  return str;
}

async function getFiledValue(value: string, node: IProblem, selectedLanguage: string): Promise<string | undefined> {
  switch (value) {
    case "id":
      return node.id;
    case "name":
      return node.name;
    case "language":
      return selectedLanguage;
    case "difficulty":
      return node.difficulty;
    case "tag":
      if (node.tags.length === 1) {
        return node.tags[0];
      }
      return await vscode.window.showQuickPick(node.tags, {
        matchOnDetail: true,
        placeHolder: "Multiple tags available, please select one",
        ignoreFocusOut: true,
      });
    case "company":
      if (node.companies.length === 1) {
        return node.companies[0];
      }
      return await vscode.window.showQuickPick(node.companies, {
        matchOnDetail: true,
        placeHolder: "Multiple companies available, please select one",
        ignoreFocusOut: true,
      });
    default:
      const errorMsg: string = `The config '${value}' is not supported.`;
      leetCodeChannel.appendLine(errorMsg);
      throw new Error(errorMsg);
  }
}
