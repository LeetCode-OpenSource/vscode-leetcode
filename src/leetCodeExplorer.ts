"use strict";

import * as path from "path";
import * as vscode from "vscode";
import * as list from "./commands/list";
import { leetCodeManager } from "./leetCodeManager";
import { ProblemState } from "./shared";

// tslint:disable:max-classes-per-file
export class LeetCodeNode {
    constructor(private data: list.IProblem, private isProblemNode: boolean = true) { }

    public get locked(): boolean {
        return this.data.locked;
    }
    public get name(): string {
        return this.data.name;
    }

    public get state(): ProblemState {
        return this.data.state;
    }

    public get id(): string {
        return this.data.id;
    }

    public get passRate(): string {
        return this.data.passRate;
    }

    public get isProblem(): boolean {
        return this.isProblemNode;
    }
}

export class LeetCodeTreeDataProvider implements vscode.TreeDataProvider<LeetCodeNode> {

    private treeData: Map<string, list.IProblem[]> = new Map();

    private onDidChangeTreeDataEvent: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    // tslint:disable-next-line:member-ordering
    public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;

    constructor(private context: vscode.ExtensionContext, private channel: vscode.OutputChannel) { }

    public async refresh(): Promise<void> {
        await this.getProblemData();
        this.onDidChangeTreeDataEvent.fire();
    }

    public getTreeItem(element: LeetCodeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.id === "notSignIn") {
            return {
                label: element.name,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "leetcode.signin",
                    title: "Sign in to LeetCode",
                },
            };
        }

        const idPrefix: number = Date.now();
        return {
            label: element.isProblem ? `[${element.id}] ${element.name}` : element.name,
            id: `${idPrefix}.${element.id}`,
            collapsibleState: element.isProblem ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isProblem ? "problem" : "difficulty",
            iconPath: this.parseIconPathFromProblemState(element),
        };
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(
                    {
                        favorite: false,
                        locked: false,
                        state: ProblemState.Unknown,
                        id: "notSignIn",
                        name: "Sign in to LeetCode",
                        difficulty: "",
                        passRate: "",
                    },
                    false,
                ),
            ];
        }
        if (!element) {
            return new Promise(async (resolve: (res: LeetCodeNode[]) => void): Promise<void> => {
                await this.getProblemData();
                resolve(this.composeDifficultyNodes());
            });
        } else {
            return element.isProblem ? [] : this.composeProblemNodes(element.name);
        }
    }

    private async getProblemData(): Promise<void> {
        const allProblems: list.IProblem[] = await list.listProblems(this.channel);
        this.treeData.clear();
        for (const problem of allProblems) {
            const problems: list.IProblem[] | undefined = this.treeData.get(problem.difficulty);
            if (problems) {
                problems.push(problem);
            } else {
                this.treeData.set(problem.difficulty, [problem]);
            }
        }
    }

    private composeProblemNodes(difficulty: string): LeetCodeNode[] {
        const problems: list.IProblem[] | undefined = this.treeData.get(difficulty);
        if (!problems || problems.length === 0) {
            return [];
        }
        const problemNodes: LeetCodeNode[] = [];
        for (const problem of problems) {
            problemNodes.push(new LeetCodeNode(problem));
        }
        return problemNodes;
    }

    private composeDifficultyNodes(): LeetCodeNode[] {
        const difficultynodes: LeetCodeNode[] = [];
        for (const difficulty of this.treeData.keys()) {
            difficultynodes.push(
                new LeetCodeNode(
                    {
                        favorite: false,
                        locked: false,
                        state: ProblemState.Unknown,
                        id: difficulty,
                        name: difficulty,
                        difficulty: "",
                        passRate: "",
                    },
                    false,
                ),
            );
        }
        difficultynodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
            function getValue(input: string): number {
                switch (input.toLowerCase()) {
                    case "easy":
                        return 1;
                    case "medium":
                        return 2;
                    case "hard":
                        return 3;
                    default:
                        return Number.MAX_SAFE_INTEGER;
                }
            }
            return getValue(a.name) - getValue(b.name);
        });
        return difficultynodes;
    }

    private parseIconPathFromProblemState(element: LeetCodeNode): string {
        if (!element.isProblem) {
            return "";
        }
        switch (element.state) {
            case ProblemState.AC:
                return this.context.asAbsolutePath(path.join("resources", "check.png"));
            case ProblemState.NotAC:
                return this.context.asAbsolutePath(path.join("resources", "x.png"));
            case ProblemState.Unknown:
                if (element.locked) {
                    return this.context.asAbsolutePath(path.join("resources", "lock.png"));
                }
                return this.context.asAbsolutePath(path.join("resources", "blank.png"));
            default:
                return "";
        }
    }
}
