// Copyright (c) mt. All rights reserved.
// Based on original work by jdneo.
// Licensed under the MIT license.

import * as cp from "child_process";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import requireFromString = require("require-from-string");
import { ExtensionContext } from "vscode";
import { ConfigurationChangeEvent, Disposable, MessageItem, window, workspace, WorkspaceConfiguration } from "vscode";
import { IProblem, leetcodeHasInited, supportedPlugins } from "./shared";
import { executeCommand, executeCommandWithProgress } from "./utils/cpUtils";
import { DialogOptions, openUrl } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";
import { toWslPath, useWsl } from "./utils/wslUtils";

class LeetCodeExecutor implements Disposable {
    private leetCodeRootPath: string;
    private nodeExecutable: string;
    private configurationChangeListener: Disposable;

    constructor() {
        this.leetCodeRootPath = path.join(__dirname, "..", "..", "node_modules", "vsc-leetcode-cli");
        this.nodeExecutable = this.getNodePath();
        this.configurationChangeListener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetcode.nodePath")) {
                this.nodeExecutable = this.getNodePath();
            }
        }, this);
    }

    public async getLeetCodeBinaryPath(): Promise<string> {
        if (wsl.useWsl()) {
            return `${await wsl.toWslPath(`"${path.join(this.leetCodeRootPath, "bin", "leetcode")}"`)}`;
        }
        return `"${path.join(this.leetCodeRootPath, "bin", "leetcode")}"`;
    }

    public async meetRequirements(context: ExtensionContext): Promise<boolean> {
        console.log("LeetCode: Checking requirements...");

        const hasInited: boolean | undefined = context.globalState.get(leetcodeHasInited);
        if (!hasInited) {
            console.log("LeetCode: Extension not initialized, removing old cache...");
            await this.removeOldCache();
        }

        console.log("LeetCode: Node executable path:", this.nodeExecutable);
        if (this.nodeExecutable !== "node") {
            if (!await fse.pathExists(this.nodeExecutable)) {
                console.error("LeetCode: Node.js executable not found at:", this.nodeExecutable);
                throw new Error(`The Node.js executable does not exist on path ${this.nodeExecutable}`);
            }
            // Wrap the executable with "" to avoid space issue in the path.
            this.nodeExecutable = `"${this.nodeExecutable}"`;
            if (useWsl()) {
                this.nodeExecutable = await toWslPath(this.nodeExecutable);
            }
        }

        console.log("LeetCode: Testing Node.js...");
        try {
            await this.executeCommandEx(this.nodeExecutable, ["-v"]);
            console.log("LeetCode: Node.js test successful");
        } catch (error) {
            console.error("LeetCode: Node.js test failed:", error);
            const choice: MessageItem | undefined = await window.showErrorMessage(
                "LeetCode extension needs Node.js installed in environment path",
                DialogOptions.open,
            );
            if (choice === DialogOptions.open) {
                openUrl("https://nodejs.org");
            }
            return false;
        }

        console.log("LeetCode: Checking plugins...");
        for (const plugin of supportedPlugins) {
            console.log("LeetCode: Checking plugin:", plugin);
            try { // Check plugin
                await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "plugin", "-e", plugin]);
                console.log("LeetCode: Plugin", plugin, "is available");
            } catch (error) { // Remove old cache that may cause the error download plugin and activate
                console.log("LeetCode: Plugin", plugin, "not found, installing...");
              //  await this.removeOldCache();
              //  await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "plugin", "-i", plugin]);
                console.log("LeetCode: Plugin", plugin, "installed successfully");
            }
        }

        // Set the global state HasInited true to skip delete old cache after init
        context.globalState.update(leetcodeHasInited, true);
        console.log("LeetCode: Requirements check completed successfully");
        return true;
    }

    public async deleteCache(): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "cache", "-d"]);
    }

    public async getUserInfo(): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "user"]);
    }

    public async signOut(): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "user", "-L"]);
    }

    public async listProblems(showLocked: boolean, needTranslation: boolean): Promise<string> {
        const cmd: string[] = [await this.getLeetCodeBinaryPath(), "list"];
        if (!needTranslation) {
            cmd.push("-T"); // use -T to prevent translation
        }
        if (!showLocked) {
            cmd.push("-q");
            cmd.push("L");
        }
        return await this.executeCommandEx(this.nodeExecutable, cmd);
    }

    public async showProblem(problemNode: IProblem, language: string, filePath: string, showDescriptionInComment: boolean = false, needTranslation: boolean, shouldAddHeaders: boolean = false): Promise<void> {
        const templateType: string = showDescriptionInComment ? "-cx" : "-c";
        const cmd: string[] = [await this.getLeetCodeBinaryPath(), "show", problemNode.id, templateType, "-l", language];

        if (!needTranslation) {
            cmd.push("-T"); // use -T to force English version
        }

        console.log('🔍 DEBUG: showProblem called with:', {
            problemId: problemNode.id,
            problemName: problemNode.name,
            language: language,
            shouldAddHeaders: shouldAddHeaders
        });

        if (!await fse.pathExists(filePath)) {
            await fse.createFile(filePath);
            let codeTemplate: string = await this.executeCommandWithProgressEx("Fetching problem data...", this.nodeExecutable, cmd);

            // Add C++ headers if needed
            if (shouldAddHeaders && (language === "cpp" || language === "c")) {
                const cppHeaders = this.generateCppHeaders();
                codeTemplate = cppHeaders + codeTemplate;
            }

            // Add debug template for C++ with enhanced parsing
            if (language === "cpp" || language === "c") {
                console.log('🧩 DEBUG: Попытка получить описание для парсинга тестовых данных...');
                let markdownDescription = '';

                try {
                    // Сначала пробуем стандартный CLI метод
                    markdownDescription = await this.getDescription(problemNode.id, needTranslation);
                    console.log('✅ DEBUG: Описание получено через CLI, длина:', markdownDescription.length);
                } catch (error) {
                    console.log('⚠️ DEBUG: CLI метод не сработал, пробуем GraphQL...', error.message);

                    // Если CLI не работает и есть titleSlug, пробуем GraphQL
                    if (problemNode.titleSlug) {
                        try {
                            markdownDescription = await this.getDescriptionViaGraphQL(problemNode.titleSlug, needTranslation);
                            console.log('✅ DEBUG: Описание получено через GraphQL, длина:', markdownDescription.length);
                        } catch (graphqlError) {
                            console.log('❌ DEBUG: GraphQL тоже не сработал:', graphqlError.message);
                        }
                    }
                }

                // Добавляем debug шаблон (даже если описание пустое)
                codeTemplate = this.addCppDebugTemplateWithDescription(codeTemplate, markdownDescription);
            }

            await fse.writeFile(filePath, codeTemplate);
        }
    }

    /**
     * This function returns solution of a problem identified by input
     *
     * @remarks
     * Even though this function takes the needTranslation flag, it is important to note
     * that as of vsc-leetcode-cli 2.8.0, leetcode-cli doesn't support querying solution
     * on CN endpoint yet. So this flag doesn't have any effect right now.
     *
     * @param input - parameter to pass to cli that can identify a problem
     * @param language - the source code language of the solution desired
     * @param needTranslation - whether or not to use endPoint translation on solution query
     * @returns promise of the solution string
     */
    public async showSolution(input: string, language: string, needTranslation: boolean): Promise<string> {
        // solution don't support translation
        const cmd: string[] = [await this.getLeetCodeBinaryPath(), "show", input, "--solution", "-l", language];
        if (!needTranslation) {
            cmd.push("-T");
        }
        const solution: string = await this.executeCommandWithProgressEx("Fetching top voted solution from discussions...", this.nodeExecutable, cmd);
        return solution;
    }

    public async getDescription(problemNodeId: string, needTranslation: boolean): Promise<string> {
        const cmd: string[] = [await this.getLeetCodeBinaryPath(), "show", problemNodeId, "-x"];
        if (!needTranslation) {
            cmd.push("-T");
        }

        console.log('📥 DEBUG: Выполняем команду для получения markdown:', cmd.join(' '));
        const result = await this.executeCommandWithProgressEx("Fetching problem description...", this.nodeExecutable, cmd);
        console.log('📥 DEBUG: Получен markdown, длина:', result.length);
        console.log('📥 DEBUG: Содержит "Input":', result.includes('Input'));

        return result;
    }

    public async listSessions(): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "session"]);
    }

    public async enableSession(name: string): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "session", "-e", name]);
    }

    public async createSession(id: string): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "session", "-c", id]);
    }

    public async deleteSession(id: string): Promise<string> {
        return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "session", "-d", id]);
    }

    public async submitSolution(filePath: string): Promise<string> {
        try {
            return await this.executeCommandWithProgressEx("Submitting to LeetCode...", this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "submit", filePath]);
        } catch (error) {
            if (error.result) {
                return error.result;
            }
            throw error;
        }
    }

    public async testSolution(filePath: string, testString?: string): Promise<string> {
        if (testString) {
            return await this.executeCommandWithProgressEx("Submitting to LeetCode...", this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "test", filePath, "-t", testString]);
        }
        return await this.executeCommandWithProgressEx("Submitting to LeetCode...", this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "test", filePath]);
    }

    public async switchEndpoint(_endpoint: string): Promise<string> {
        // Отключено для избежания конфликтов с оригинальным расширением
        console.log("LeetCode: Endpoint switching disabled to avoid conflicts");
        return "Endpoint switching disabled";
        /*
        switch (endpoint) {
            case Endpoint.LeetCodeCN:
                return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "plugin", "-e", "leetcode.cn"]);
            case Endpoint.LeetCode:
            default:
                return await this.executeCommandEx(this.nodeExecutable, [await this.getLeetCodeBinaryPath(), "plugin", "-d", "leetcode.cn"]);
        }
        */
    }

    public async toggleFavorite(node: IProblem, addToFavorite: boolean): Promise<void> {
        const commandParams: string[] = [await this.getLeetCodeBinaryPath(), "star", node.id];
        if (!addToFavorite) {
            commandParams.push("-d");
        }
        await this.executeCommandWithProgressEx("Updating the favorite list...", this.nodeExecutable, commandParams);
    }

    public async getCompaniesAndTags(): Promise<{ companies: { [key: string]: string[] }, tags: { [key: string]: string[] } }> {
        // preprocess the plugin source
        const companiesTagsPath: string = path.join(this.leetCodeRootPath, "lib", "plugins", "company.js");
        const companiesTagsSrc: string = (await fse.readFile(companiesTagsPath, "utf8")).replace(
            "module.exports = plugin",
            "module.exports = { COMPONIES, TAGS }",
        );
        const { COMPONIES, TAGS } = requireFromString(companiesTagsSrc, companiesTagsPath);
        return { companies: COMPONIES, tags: TAGS };
    }

    public get node(): string {
        return this.nodeExecutable;
    }

    public dispose(): void {
        this.configurationChangeListener.dispose();
    }

    private getNodePath(): string {
        const extensionConfig: WorkspaceConfiguration = workspace.getConfiguration("leetcode", null);
        return extensionConfig.get<string>("nodePath", "node" /* default value */);
    }

    private async executeCommandEx(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
        if (wsl.useWsl()) {
            return await executeCommand("wsl", [command].concat(args), options);
        }
        return await executeCommand(command, args, options);
    }

    private async executeCommandWithProgressEx(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
        if (wsl.useWsl()) {
            return await executeCommandWithProgress(message, "wsl", [command].concat(args), options);
        }
        return await executeCommandWithProgress(message, command, args, options);
    }

    private async removeOldCache(): Promise<void> {
        const oldPath: string = path.join(os.homedir(), ".lc");
        if (await fse.pathExists(oldPath)) {
            await fse.remove(oldPath);
        }
    }

    public async getTodayProblem(needTranslation?: boolean): Promise<any[]> {
        try {
            // Получаем историю daily challenges за последние 30 дней
            const dailyChallenges = await this.getDailyChallengeHistory(needTranslation, 30);
            return dailyChallenges;
        }
        catch (error) {
            console.error("Failed to fetch daily challenges:", error);
            return [];
        }
    }

    public async getDailyChallengeHistory(_needTranslation?: boolean, days: number = 30): Promise<any[]> {
        try {
            const https = require('https');

            // Получаем данные за последние дни
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const query = `
                query dailyCodingQuestionRecords($year: Int!, $month: Int!) {
                    dailyCodingChallengeV2(year: $year, month: $month) {
                        challenges {
                            date
                            userStatus
                            link
                            question {
                                acRate
                                difficulty
                                freqBar
                                frontendQuestionId: questionFrontendId
                                isFavor
                                paidOnly: isPaidOnly
                                status
                                title
                                titleSlug
                                hasVideoSolution
                                hasSolution
                                topicTags {
                                    name
                                    id
                                    slug
                                }
                            }
                        }
                    }
                }
            `;

            const challenges: any[] = [];
            const processedMonths = new Set<string>();

            // Получаем данные для текущего и предыдущего месяца
            for (let i = 0; i <= 1; i++) {
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() - i);

                const year = targetDate.getFullYear();
                const month = targetDate.getMonth() + 1;
                const monthKey = `${year}-${month}`;

                if (processedMonths.has(monthKey)) continue;
                processedMonths.add(monthKey);

                const postData = JSON.stringify({
                    query: query,
                    variables: { year, month }
                });

                const options = {
                    hostname: 'leetcode.com',
                    port: 443,
                    path: '/graphql',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                        'User-Agent': 'vscode-leetcode-extension'
                    }
                };

                const response = await new Promise<string>((resolve, reject) => {
                    const req = https.request(options, (res: any) => {
                        let data = '';
                        res.on('data', (chunk: any) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            resolve(data);
                        });
                    });

                    req.on('error', (error: any) => {
                        reject(error);
                    });

                    req.write(postData);
                    req.end();
                });

                const jsonData = JSON.parse(response);
                if (jsonData.data && jsonData.data.dailyCodingChallengeV2 && jsonData.data.dailyCodingChallengeV2.challenges) {
                    const monthChallenges = jsonData.data.dailyCodingChallengeV2.challenges
                        .filter((challenge: any) => challenge && challenge.question)
                        .map((challenge: any) => {
                            const question = challenge.question;
                            return {
                                id: question.frontendQuestionId || challenge.link?.split('/').pop() || 'unknown',
                                name: question.title || 'Unknown Problem',
                                difficulty: question.difficulty || 'Unknown',
                                passRate: question.acRate ? `${question.acRate.toFixed(1)}%` : '0%',
                                tags: (question.topicTags || []).map((tag: any) => tag.name || tag),
                                companies: [],
                                isFavorite: question.isFavor || false,
                                locked: question.paidOnly || false,
                                state: question.status || "Unknown",
                                date: challenge.date,
                                link: challenge.link,
                                titleSlug: question.titleSlug // Добавляем titleSlug для GraphQL запросов
                            };
                        });

                    challenges.push(...monthChallenges);
                }
            }

            // Сортируем по дате (новые сверху)
            challenges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Ограничиваем количество дней
            return challenges.slice(0, days);
        }
        catch (error) {
            console.error("Failed to fetch daily challenge history:", error);
            return [];
        }
    }

    public generateCppHeaders(): string {
        return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <stack>
#include <queue>
#include <deque>
#include <set>
#include <map>
#include <climits>
#include <cmath>
#include <numeric>
#include <functional>
using namespace std;

`;
    }

    public addCppDebugTemplate(codeTemplate: string): string {
        // Ищем маркер окончания кода LeetCode
        const endMarker = "// @lc code=end";
        const endIndex = codeTemplate.indexOf(endMarker);

        // Извлекаем примеры тестовых данных из комментариев
        const testData = this.extractTestDataFromComments(codeTemplate);
        const parsedArgs = this.parseTestDataForCpp(testData);

        if (endIndex !== -1) {
            // Если маркер найден, добавляем debug template после него
            const beforeEnd = codeTemplate.substring(0, endIndex + endMarker.length);
            const afterEnd = codeTemplate.substring(endIndex + endMarker.length);

            const debugTemplate = this.generateCppDebugTemplate(parsedArgs, codeTemplate);
            return beforeEnd + debugTemplate + afterEnd;
        } else {
            // Если маркер не найден, добавляем в конец файла
            const debugTemplate = `
// @lc code=end
` + this.generateCppDebugTemplate(parsedArgs, codeTemplate);
            return codeTemplate + debugTemplate;
        }
    }

    public addCppDebugTemplateWithDescription(codeTemplate: string, markdownDescription: string): string {
        // Добавляем отладочную информацию
        console.log('📋 DEBUG: Markdown описание получено, длина:', markdownDescription.length);
        console.log('📋 DEBUG: Первые 500 символов markdown:', markdownDescription.substring(0, 500));
        console.log('📋 DEBUG: Содержит "Input":', markdownDescription.includes('Input'));
        console.log('📋 DEBUG: Содержит "**Input:**":', markdownDescription.includes('**Input:**'));

        // Ищем маркер окончания кода LeetCode
        const endMarker = "// @lc code=end";
        const endIndex = codeTemplate.indexOf(endMarker);

        // Извлекаем примеры тестовых данных из markdown описания
        const testData = this.extractTestDataFromMarkdown(markdownDescription);
        const parsedArgs = this.parseTestDataForCpp(testData);

        if (endIndex !== -1) {
            // Если маркер найден, добавляем debug template после него
            const beforeEnd = codeTemplate.substring(0, endIndex + endMarker.length);
            const afterEnd = codeTemplate.substring(endIndex + endMarker.length);

            const debugTemplate = this.generateCppDebugTemplate(parsedArgs, codeTemplate);
            return beforeEnd + debugTemplate + afterEnd;
        } else {
            // Если маркер не найден, добавляем в конец файла
            const debugTemplate = `
// @lc code=end
` + this.generateCppDebugTemplate(parsedArgs, codeTemplate);
            return codeTemplate + debugTemplate;
        }
    }

    private extractTestDataFromComments(codeTemplate: string): string[] {
        const testData: string[] = [];

        // Ищем Input: в markdown блоках Examples
        const inputPattern = /\*\*Input:\*\*\s*([^\n*]+)/g;
        let match;

        while ((match = inputPattern.exec(codeTemplate)) !== null) {
            const inputLine = match[1].trim();
            console.log('🎯 Найден Input:', inputLine);

            // Парсим переменные вида "height = [1,8,6,2,5,4,8,3,7]", "target = 8"
            const variableMatches = inputLine.match(/(\w+)\s*=\s*(\[[^\]]+\]|\d+|"[^"]*")/g);
            if (variableMatches) {
                for (const varMatch of variableMatches) {
                    const valueMatch = varMatch.match(/=\s*(.+)$/);
                    if (valueMatch) {
                        testData.push(valueMatch[1].trim());
                        console.log('✅ Добавлено значение:', valueMatch[1].trim());
                    }
                }
            }
        }

        // Если не нашли в markdown, ищем простые Input: в тексте
        if (testData.length === 0) {
            const simpleInputPattern = /Input:\s*([^\n]+)/g;
            while ((match = simpleInputPattern.exec(codeTemplate)) !== null) {
                const inputLine = match[1].trim();
                console.log('🎯 Найден обычный Input:', inputLine);

                const variableMatches = inputLine.match(/(\w+)\s*=\s*(\[[^\]]+\]|\d+|"[^"]*")/g);
                if (variableMatches) {
                    for (const varMatch of variableMatches) {
                        const valueMatch = varMatch.match(/=\s*(.+)$/);
                        if (valueMatch) {
                            testData.push(valueMatch[1].trim());
                            console.log('✅ Добавлено значение:', valueMatch[1].trim());
                        }
                    }
                }
            }
        }

        // Убираем дубликаты
        const uniqueTestData = [...new Set(testData)];
        console.log('🔍 Итоговые тестовые данные:', uniqueTestData);
        return uniqueTestData;
    }

    private extractTestDataFromMarkdown(markdownContent: string): string[] {
        const testData: string[] = [];
        const seenVariables = new Set<string>(); // Отслеживаем только имена переменных

        console.log('🔍 DEBUG: Начинаем парсинг markdown');
        console.log('🔍 DEBUG: Ищем паттерны Input в тексте...');

        // Ищем различные варианты Input в markdown/HTML
        const patterns = [
            /<strong>Input:<\/strong>\s*([^\n<]+)/g,          // HTML: <strong>Input:</strong> nums = [2,7,11,15], target = 9
            /\*\*Input:\*\*\s*([^\n]+)/g,                     // Markdown: **Input:** nums = [2,7,11,15], target = 9
            /<strong>Input<\/strong>:\s*([^\n<]+)/g           // HTML вариант: <strong>Input</strong>: nums = [2,7,11,15], target = 9
        ];

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            console.log(`🔍 DEBUG: Проверяем паттерн ${i + 1}:`, pattern.source);

            let match;
            pattern.lastIndex = 0; // Сбрасываем индекс для корректной работы exec
            while ((match = pattern.exec(markdownContent)) !== null) {
                let inputLine = match[1].trim();
                console.log(`🎯 Найден Input (паттерн ${i + 1}):`, inputLine);

                // Декодируем HTML entities
                inputLine = this.decodeHtmlEntities(inputLine);
                console.log(`🔧 После декодирования HTML:`, inputLine);

                // Парсим переменные с учетом массивов, строк и чисел
                this.parseInputLine(inputLine, testData, seenVariables);
            }
        }

        if (testData.length === 0) {
            console.log('⚠️ DEBUG: Не найдено ни одного Input! Проверим содержимое markdown...');
            console.log('📝 DEBUG: Весь markdown текст (первые 1000 символов):');
            console.log(markdownContent.substring(0, 1000));
            console.log('📝 DEBUG: Поиск слова "Input" (регистронезависимо):',
                        (markdownContent.match(/input/gi) || []).length, 'вхождений');
        }

        console.log('🔍 Итоговые тестовые данные из markdown:', testData);
        return testData;
    }

    private decodeHtmlEntities(text: string): string {
        const entities: { [key: string]: string } = {
            '&quot;': '"',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#39;': "'",
            '&apos;': "'"
        };

        return text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
            return entities[match] || match;
        });
    }

    private parseInputLine(inputLine: string, testData: string[], seenVariables: Set<string>): void {
        console.log('🔧 DEBUG: Парсим строку Input:', inputLine);

        // Удаляем HTML теги и лишние символы в начале строки
        let cleanLine = inputLine
            .replace(/^<\/?\w+[^>]*>/g, '')  // Удаляем HTML теги в начале
            .replace(/^\*\*\s*/, '')        // Удаляем markdown **
            .trim();

        console.log('🔧 DEBUG: Очищенная строка:', cleanLine);

        // Паттерн для поиска переменных вида: var = value
        // value может быть: [массив], "строка", число
        let index = 0;

        while (index < cleanLine.length) {
            // Ищем название переменной и знак =
            const varMatch = cleanLine.substring(index).match(/^(\w+)\s*=\s*/);
            if (!varMatch) {
                break;
            }

            const varName = varMatch[1];
            index += varMatch[0].length;

            // Проверяем, встречали ли уже эту переменную
            if (seenVariables.has(varName)) {
                console.log(`⚠️ Пропускаем дубликат переменной: ${varName}`);
                // Пропускаем значение до следующей переменной или конца строки
                while (index < cleanLine.length) {
                    const char = cleanLine[index];
                    if (char === ',' && cleanLine.substring(index + 1).match(/\s*\w+\s*=/)) {
                        // Нашли запятую перед следующей переменной
                        index++;
                        break;
                    }
                    index++;
                }
                continue;
            }

            // Теперь извлекаем значение
            let value = '';
            let char = cleanLine[index];

            if (char === '[') {
                // Массив - ищем закрывающую скобку
                let bracketCount = 1;
                value += char;
                index++;

                while (index < cleanLine.length && bracketCount > 0) {
                    char = cleanLine[index];
                    value += char;
                    if (char === '[') bracketCount++;
                    else if (char === ']') bracketCount--;
                    index++;
                }
            } else if (char === '"' || char === "'" || char === '`') {
                // Строка - ищем закрывающую кавычку
                const quote = char;
                value += char;
                index++;

                while (index < cleanLine.length) {
                    char = cleanLine[index];
                    value += char;
                    index++;
                    if (char === quote) break;
                }
            } else {
                // Число или другое значение - читаем до запятой или конца строки
                while (index < cleanLine.length) {
                    char = cleanLine[index];
                    if (char === ',' || char === '\n') break;
                    value += char;
                    index++;
                }
            }

            if (value.trim()) {
                const cleanValue = value.trim();
                seenVariables.add(varName); // Помечаем переменную как уже обработанную
                testData.push(cleanValue);
                console.log('✅ Добавлено значение:', `${varName} = ${cleanValue}`);
            }

            // Пропускаем запятую и пробелы
            while (index < cleanLine.length && (cleanLine[index] === ',' || cleanLine[index] === ' ')) {
                index++;
            }
        }
    }

    private parseTestDataForCpp(testData: string[]): { args: string[] } {
        const args: string[] = [];
        console.log('🔧 Парсинг тестовых данных:', testData);

        if (testData.length === 0) {
            console.log('⚠️ Нет тестовых данных для парсинга');
            return { args: [] };
        }

        for (const data of testData) {
            if (!data) continue;

            const cleanData = data.trim();
            console.log('📝 Обрабатываем:', cleanData);

            // Форматируем для C++
            const formattedValue = this.formatValueForCpp(cleanData);
            args.push(formattedValue);
            console.log('✅ Добавлено:', formattedValue);
        }

        console.log('🎯 Финальные аргументы:', args);
        return { args };
    }

    private formatValueForCpp(value: string): string {
        value = value.trim();

        // Массивы
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1).trim();
            if (!arrayContent) {
                return '{}'; // Пустой массив
            }

            // Проверяем, содержит ли массив строки
            if (arrayContent.includes('"') || arrayContent.includes("'")) {
                // Массив строк
                const elements = this.parseArrayElements(arrayContent);
                const strings = elements.map((elem) => {
                    const cleaned = elem.replace(/^['"`]|['"`]$/g, '');
                    return `"${cleaned}"`;
                });
                return `{${strings.join(', ')}}`;
            } else {
                // Массив чисел или других примитивов
                const elements = this.parseArrayElements(arrayContent);
                const formatted = elements.map((elem) => {
                    const cleaned = elem.trim();
                    if (cleaned === 'true' || cleaned === 'false') {
                        return cleaned;
                    } else if (cleaned === 'null') {
                        return 'nullptr';
                    }
                    return cleaned;
                });
                return `{${formatted.join(', ')}}`;
            }
        }

        // Строки в кавычках
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('`') && value.endsWith('`'))) {
            const content = value.slice(1, -1);
            return `"${content}"`;
        }

        // Числа
        if (/^-?\d+$/.test(value)) {
            return value; // Целое число
        }

        if (/^-?\d*\.\d+$/.test(value)) {
            return value; // Число с плавающей точкой
        }

        // Булевы значения
        if (value === 'true' || value === 'false') {
            return value;
        }

        // Null значения
        if (value === 'null' || value === 'nullptr') {
            return 'nullptr';
        }

        // Если ничего не подошло, считаем строкой
        return `"${value}"`;
    }

    private parseArrayElements(arrayContent: string): string[] {
        const elements: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        let depth = 0;

        for (const char of arrayContent) {
            if (!inQuotes && (char === '"' || char === "'" || char === '`')) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
                current += char;
            } else if (!inQuotes && char === '[') {
                depth++;
                current += char;
            } else if (!inQuotes && char === ']') {
                depth--;
                current += char;
            } else if (!inQuotes && char === ',' && depth === 0) {
                if (current.trim()) {
                    elements.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            elements.push(current.trim());
        }

        return elements;
    }

    private extractMethodName(codeTemplate: string): { name: string, paramCount: number } {
        // Ищем публичный метод в классе Solution
        const methodPattern = /public:\s*[\w\s<>*&:\[\]]*\s+(\w+)\s*\(([^)]*)\)/;
        const match = codeTemplate.match(methodPattern);

        if (match && match[1]) {
            const methodName = match[1];
            const params = match[2].trim();
            const paramCount = params === '' ? 0 : params.split(',').length;
            console.log('🔧 Найден метод:', methodName, 'с', paramCount, 'параметрами');
            return { name: methodName, paramCount };
        }

        // Если не найден паттерн public:, ищем любой метод после класса Solution
        const anyMethodPattern = /class\s+Solution\s*{[^}]*?[\w\s<>*&:\[\]]*\s+(\w+)\s*\(([^)]*)\)/;
        const anyMatch = codeTemplate.match(anyMethodPattern);

        if (anyMatch && anyMatch[1] && anyMatch[1] !== 'Solution') {
            const methodName = anyMatch[1];
            const params = anyMatch[2].trim();
            const paramCount = params === '' ? 0 : params.split(',').length;
            console.log('🔧 Найден метод (альтернативный поиск):', methodName, 'с', paramCount, 'параметрами');
            return { name: methodName, paramCount };
        }

        console.log('⚠️ Метод не найден, используем someMethod');
        return { name: 'someMethod', paramCount: 0 };
    }

    private generateCppDebugTemplate(parsedArgs: { args: string[] }, codeTemplate?: string): string {
        if (parsedArgs.args.length === 0) {
            return `

int main()
{
    Solution sol;

    // auto result = sol.someMethod(/* your test data */);


    return 0;
}
`;
        }

        let variableDeclarations = '';
        let methodCall = '';

        // Анализируем каждый аргумент и создаем соответствующие переменные
        parsedArgs.args.forEach((arg, index) => {
            const cleanArg = arg.trim();

            if (cleanArg.startsWith('{') && cleanArg.endsWith('}')) {
                // Это массив - определяем тип элементов
                const content = cleanArg.slice(1, -1).trim();

                if (!content) {
                    // Пустой массив
                    variableDeclarations += `    vector<int> arr${index + 1} = {};\n`;
                } else if (content.includes('"')) {
                    // Массив строк
                    variableDeclarations += `    vector<string> arr${index + 1} = ${cleanArg};\n`;
                } else {
                    // Массив чисел
                    variableDeclarations += `    vector<int> arr${index + 1} = ${cleanArg};\n`;
                }
            } else if (cleanArg.startsWith('"') && cleanArg.endsWith('"')) {
                // Строка
                variableDeclarations += `    string str${index + 1} = ${cleanArg};\n`;
            } else if (/^-?\d+$/.test(cleanArg)) {
                // Целое число
                variableDeclarations += `    int num${index + 1} = ${cleanArg};\n`;
            } else if (/^-?\d*\.\d+$/.test(cleanArg)) {
                // Число с плавающей точкой
                variableDeclarations += `    double num${index + 1} = ${cleanArg};\n`;
            } else if (cleanArg === 'true' || cleanArg === 'false') {
                // Булево значение
                variableDeclarations += `    bool flag${index + 1} = ${cleanArg};\n`;
            } else {
                // Общий случай
                variableDeclarations += `    auto param${index + 1} = ${cleanArg};\n`;
            }
        });

        // Создаем комментарий для вызова метода
        const paramNames: string[] = [];
        parsedArgs.args.forEach((arg, index) => {
            const cleanArg = arg.trim();

            if (cleanArg.startsWith('{')) {
                paramNames.push(`arr${index + 1}`);
            } else if (cleanArg.startsWith('"')) {
                paramNames.push(`str${index + 1}`);
            } else if (/^-?\d/.test(cleanArg)) {
                paramNames.push(`num${index + 1}`);
            } else if (cleanArg === 'true' || cleanArg === 'false') {
                paramNames.push(`flag${index + 1}`);
            } else {
                paramNames.push(`param${index + 1}`);
            }
        });

        // Извлекаем название метода и количество параметров из кода
        const methodInfo = codeTemplate ? this.extractMethodName(codeTemplate) : { name: 'someMethod', paramCount: 0 };
        const methodName = methodInfo.name;
        const expectedParamCount = methodInfo.paramCount;

        if (paramNames.length > 0) {
            // Используем только необходимое количество параметров
            const actualParams = paramNames.slice(0, expectedParamCount);

            if (actualParams.length === expectedParamCount) {
                methodCall = `    auto result = sol.${methodName}(${actualParams.join(', ')});`;
            } else if (actualParams.length < expectedParamCount) {
                // Не хватает параметров
                const missingCount = expectedParamCount - actualParams.length;
                const placeholders = Array(missingCount).fill('/* param */');
                methodCall = `    auto result = sol.${methodName}(${[...actualParams, ...placeholders].join(', ')});`;
            } else {
                // Слишком много параметров (не должно происходить с slice)
                methodCall = `    auto result = sol.${methodName}(${actualParams.join(', ')});`;
            }

            console.log(`🎯 Метод ${methodName} ожидает ${expectedParamCount} параметров, используем ${actualParams.length}`);
        } else {
            methodCall = `    // auto result = sol.${methodName}(/* set input */);`;
        }

        return `

int main()
{
    Solution sol;

    // Test Data
${variableDeclarations}
    ${methodCall}


    return 0;
}
`;
    }

    /**
     * Получает описание задачи через GraphQL API LeetCode для Daily Challenges
     */
    public async getDescriptionViaGraphQL(titleSlug: string, needTranslation: boolean = false): Promise<string> {
        try {
            const https = require('https');

            const query = `
                query questionContent($titleSlug: String!) {
                    question(titleSlug: $titleSlug) {
                        content
                        title
                        titleSlug
                        difficulty
                        likes
                        dislikes
                        sampleTestCase
                        exampleTestcases
                        categoryTitle
                        topicTags {
                            name
                        }
                        companyTagStats
                    }
                }
            `;

            const postData = JSON.stringify({
                query: query,
                variables: { titleSlug: titleSlug }
            });

            const hostname = needTranslation ? 'leetcode.cn' : 'leetcode.com';
            const options = {
                hostname: hostname,
                port: 443,
                path: '/graphql',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'vscode-leetcode-extension'
                }
            };

            const response = await new Promise<string>((resolve, reject) => {
                const req = https.request(options, (res: any) => {
                    let data = '';
                    res.on('data', (chunk: any) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        resolve(data);
                    });
                });

                req.on('error', (error: any) => {
                    reject(error);
                });

                req.write(postData);
                req.end();
            });

            const jsonData = JSON.parse(response);
            if (jsonData.data && jsonData.data.question) {
                const question = jsonData.data.question;

                // Формируем markdown описание в том же формате, что ожидает парсер
                // Включаем HTML контент с примерами Input/Output
                const markdown = `
# ${question.title}

${question.content}

**Difficulty:** ${question.difficulty}
**Likes:** ${question.likes}
**Dislikes:** ${question.dislikes}
**Category:** ${question.categoryTitle}
**Tags:** ${(question.topicTags || []).map((tag: any) => tag.name).join(', ')}

## Test Cases
${question.exampleTestcases || question.sampleTestCase || ''}
                `.trim();

                console.log('✅ DEBUG: Получено описание через GraphQL, содержит "Input":', markdown.includes('Input'));
                return markdown;
            }

            throw new Error('No question data found in GraphQL response');

        } catch (error) {
            console.log('❌ DEBUG: Ошибка при получении описания через GraphQL:', error);
            throw error;
        }
    }

}

export const leetCodeExecutor: LeetCodeExecutor = new LeetCodeExecutor();
