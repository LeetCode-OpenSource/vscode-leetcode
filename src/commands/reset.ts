import * as vscode from "vscode";
import { getActiveFilePath } from "../utils/workspaceUtils";
import * as settingUtils from "../utils/settingUtils";
import { IDescriptionConfiguration } from "../utils/settingUtils";
import { langExt } from '../shared'
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";
import { leetCodeExecutor } from "../leetCodeExecutor";

const resetBtn = 'Reset';

export async function resetSolution(uri?: vscode.Uri): Promise<void> {
    try {
        const selection = await vscode.window.showInformationMessage("Are you sure to reset the default code", {
            'detail': 'If reset, your current code will be lost',
            modal: true
        } as vscode.MessageOptions, resetBtn)
        const filePath: string | undefined = await getActiveFilePath(uri);
        if (selection === resetBtn && filePath) {
            resetProblemFile(filePath)
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);

    }
}


async function resetProblemFile(finalPath): Promise<void> {
    try {
        const reg = /(\d+)\.\S+\.(\S+)/;
        const problemId = finalPath.match(reg) && finalPath.match(reg)[1]
        const fileExt = finalPath.match(reg) && finalPath.match(reg)[2]
        let language;
        for (let item of langExt) {
            if (item[1] === fileExt) {
                language = item[0]
                break;
            }
        }
        const descriptionConfig: IDescriptionConfiguration = settingUtils.getDescriptionConfiguration();
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        await leetCodeExecutor.resetProblem(problemId, language, finalPath, descriptionConfig.showInComment, needTranslation);
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : vscode.ViewColumn.One;
        await vscode.window.showTextDocument(vscode.Uri.file(finalPath), { preview: false, viewColumn: column });
    } catch (error) {
        await promptForOpenOutputChannel(`${error} Please open the output channel for details.`, DialogType.error);
    }
}


