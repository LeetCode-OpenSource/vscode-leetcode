// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as _ from "lodash";
import { Disposable, workspace } from "vscode";
import * as list from "../commands/list";
import { getSortingStrategy } from "../commands/plugin";
import { fetchStudyPlanProblemIds } from "../commands/studyPlan";
import { Category, defaultProblem, Endpoint, IStudyPlanItem, ProblemState, SortingStrategy } from "../shared";
import { getLeetCodeEndpoint } from "../commands/plugin";
import { shouldHideSolvedProblem } from "../utils/settingUtils";
import { t } from "../i18n";
import { LeetCodeNode } from "./LeetCodeNode";

class ExplorerNodeManager implements Disposable {
    private explorerNodeMap: Map<string, LeetCodeNode> = new Map<string, LeetCodeNode>();
    private companySet: Set<string> = new Set<string>();
    private tagSet: Set<string> = new Set<string>();
    private studyPlanProblemIdsCache: Map<string, string[]> = new Map<string, string[]>();

    private studyPlans: IStudyPlanItem[] = [
        { slug: "top-100-liked", name: "Hot 100" },
        { slug: "sql-free-50", name: "SQL 50" },
    ];

    public async refreshCache(): Promise<void> {
        this.dispose();
        // Store all problems (including solved) so study plan can access them.
        // The hide-solved filter is applied at display time, not cache time.
        for (const problem of await list.listProblems()) {
            this.explorerNodeMap.set(problem.id, new LeetCodeNode(problem));
            for (const company of problem.companies) {
                this.companySet.add(company);
            }
            for (const tag of problem.tags) {
                this.tagSet.add(tag);
            }
        }
    }

    public getRootNodes(): LeetCodeNode[] {
        const nodes: LeetCodeNode[] = [
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.All,
                name: t("category_all"),
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Difficulty,
                name: t("category_difficulty"),
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Tag,
                name: t("category_tag"),
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Company,
                name: t("category_company"),
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Favorite,
                name: t("category_favorite"),
            }), false),
        ];

        // Study plan is only available on leetcode.cn
        if (getLeetCodeEndpoint() === Endpoint.LeetCodeCN) {
            nodes.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.StudyPlan,
                name: t("category_study_plan"),
            }), false));
        }

        return nodes;
    }

    public getAllNodes(): LeetCodeNode[] {
        return this.applySortingStrategy(
            this.filterSolvedNodes(Array.from(this.explorerNodeMap.values())),
        );
    }

    public getAllDifficultyNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        res.push(
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Easy`,
                name: "Easy",
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Medium`,
                name: "Medium",
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Hard`,
                name: "Hard",
            }), false),
        );
        this.sortSubCategoryNodes(res, Category.Difficulty);
        return res;
    }

    public getAllCompanyNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const company of this.companySet.values()) {
            res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Company}.${company}`,
                name: _.startCase(company),
            }), false));
        }
        this.sortSubCategoryNodes(res, Category.Company);
        return res;
    }

    public getAllTagNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const tag of this.tagSet.values()) {
            res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Tag}.${tag}`,
                name: _.startCase(tag),
            }), false));
        }
        this.sortSubCategoryNodes(res, Category.Tag);
        return res;
    }

    public getNodeById(id: string): LeetCodeNode | undefined {
        return this.explorerNodeMap.get(id);
    }

    public getFavoriteNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const node of this.explorerNodeMap.values()) {
            if (node.isFavorite) {
                res.push(node);
            }
        }
        return this.applySortingStrategy(this.filterSolvedNodes(res));
    }

    public getStudyPlanNodes(): LeetCodeNode[] {
        // Start with built-in plans
        const plans: IStudyPlanItem[] = [...this.studyPlans];

        // Merge user-configured custom study plan slugs
        const customSlugs: string[] = workspace.getConfiguration("leetcode").get<string[]>("studyPlans", []);
        for (const slug of customSlugs) {
            if (!plans.find((p: IStudyPlanItem) => p.slug === slug)) {
                plans.push({ slug, name: slug });
            }
        }

        return plans.map((plan: IStudyPlanItem) =>
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `studyplan:${plan.slug}`,
                name: plan.name,
            }), false),
        );
    }

    public async getStudyPlanProblemNodes(planSlug: string): Promise<LeetCodeNode[]> {
        let problemIds: string[];
        if (this.studyPlanProblemIdsCache.has(planSlug)) {
            problemIds = this.studyPlanProblemIdsCache.get(planSlug)!;
        } else {
            problemIds = await fetchStudyPlanProblemIds(planSlug);
            this.studyPlanProblemIdsCache.set(planSlug, problemIds);
        }

        const res: LeetCodeNode[] = [];
        for (const id of problemIds) {
            const node: LeetCodeNode | undefined = this.explorerNodeMap.get(id);
            if (node) {
                res.push(node);
            }
        }
        return res;
    }

    public getChildrenNodesById(id: string): LeetCodeNode[] {
        // The sub-category node's id is named as {Category.SubName}
        const metaInfo: string[] = id.split(".");
        const res: LeetCodeNode[] = [];
        for (const node of this.explorerNodeMap.values()) {
            switch (metaInfo[0]) {
                case Category.Company:
                    if (node.companies.indexOf(metaInfo[1]) >= 0) {
                        res.push(node);
                    }
                    break;
                case Category.Difficulty:
                    if (node.difficulty === metaInfo[1]) {
                        res.push(node);
                    }
                    break;
                case Category.Tag:
                    if (node.tags.indexOf(metaInfo[1]) >= 0) {
                        res.push(node);
                    }
                    break;
                default:
                    break;
            }
        }
        return this.applySortingStrategy(this.filterSolvedNodes(res));
    }

    public dispose(): void {
        this.explorerNodeMap.clear();
        this.companySet.clear();
        this.tagSet.clear();
        this.studyPlanProblemIdsCache.clear();
    }

    private sortSubCategoryNodes(subCategoryNodes: LeetCodeNode[], category: Category): void {
        switch (category) {
            case Category.Difficulty:
                subCategoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    function getValue(input: LeetCodeNode): number {
                        switch (input.name.toLowerCase()) {
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
                    return getValue(a) - getValue(b);
                });
                break;
            case Category.Tag:
            case Category.Company:
                subCategoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    if (a.name === "Unknown") {
                        return 1;
                    } else if (b.name === "Unknown") {
                        return -1;
                    } else {
                        return Number(a.name > b.name) - Number(a.name < b.name);
                    }
                });
                break;
            default:
                break;
        }
    }

    private applySortingStrategy(nodes: LeetCodeNode[]): LeetCodeNode[] {
        const strategy: SortingStrategy = getSortingStrategy();
        switch (strategy) {
            case SortingStrategy.AcceptanceRateAsc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(x.acceptanceRate) - Number(y.acceptanceRate));
            case SortingStrategy.AcceptanceRateDesc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(y.acceptanceRate) - Number(x.acceptanceRate));
            default: return nodes;
        }
    }

    private filterSolvedNodes(nodes: LeetCodeNode[]): LeetCodeNode[] {
        if (!shouldHideSolvedProblem()) {
            return nodes;
        }
        return nodes.filter((node: LeetCodeNode) => node.state !== ProblemState.AC);
    }
}

export const explorerNodeManager: ExplorerNodeManager = new ExplorerNodeManager();
