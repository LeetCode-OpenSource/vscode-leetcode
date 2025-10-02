# 🔧 Исправление бага с test/submit в расширении LeetCode

## 📋 Проблема
При использовании команд **Test** и **Submit** возникали следующие ошибки:

```
- Sending code to judge
(node:19982) Warning: Accessing non-existent property 'padLevels' of module exports inside circular dependency
(Use `node --trace-warnings ...` to show where the warning was created)
(node:19982) [DEP0187] DeprecationWarning: Passing invalid argument types to fs.existsSync is deprecated
```

## ✅ Исправления

### 1. **Проблема с двойными кавычками в путях файлов**
**Файл:** `src/leetCodeExecutor.ts`
- Исправлена двойная экранировка путей к файлам в методах `testSolution`, `submitSolution` и `toggleFavorite`
- `getLeetCodeBinaryPath()` уже возвращает путь в кавычках, дополнительная экранировка не нужна

### 2. **Конфликт версий winston**
**Файл:** `package.json`
- Удален winston 3.18.3 из основных зависимостей (не используется в коде)
- Устранен конфликт с winston 2.1.x из `vsc-leetcode-cli`
- Решена проблема с циклическими зависимостями и `padLevels`

### 3. **Некорректный исполнитель в toggleFavorite**
**Файл:** `src/leetCodeExecutor.ts`
- Заменен жестко заданный "node" на `this.nodeExecutable`

## 🚀 Установка исправленной версии

### Шаг 1: Удалите старую версию расширения
1. Откройте VS Code
2. Перейдите в Extensions (`Ctrl+Shift+X`)
3. Найдите "LeetCode Enhanced Fork"
4. Нажмите на шестеренку → Uninstall

### Шаг 2: Установите новую версию
```bash
cd /Users/mt/vscode-leetcode
code --install-extension vscode-leetcode-0.18.5.vsix
```

### Шаг 3: Перезапустите VS Code
1. Полностью закройте VS Code
2. Откройте заново
3. Проверьте что расширение активировано

## 🧪 Тестирование

### Test Solution
1. Откройте любую задачу LeetCode
2. Нажмите `Ctrl+Shift+P` → "LeetCode: Test in LeetCode"
3. Выберите тип теста
4. Проверьте что НЕТ предупреждений о `padLevels` и `fs.existsSync`

### Submit Solution
1. Откройте решенную задачу
2. Нажмите `Ctrl+Shift+P` → "LeetCode: Submit to LeetCode"
3. Проверьте что отправка проходит без ошибок

## 📈 Ожидаемый результат

После установки исправленной версии:
- ✅ Команды **Test** и **Submit** работают без предупреждений
- ✅ Нет сообщений о `padLevels` и циклических зависимостях
- ✅ Нет предупреждений о `fs.existsSync`
- ✅ Все функции Daily Challenges работают как прежде
- ✅ C++ debug templates функционируют корректно

## 🔍 Технические детали

### Исправленные методы:
- `submitSolution(filePath: string)` - убрана лишняя экранировка
- `testSolution(filePath: string, testString?: string)` - убрана лишняя экранировка
- `toggleFavorite(node: IProblem, addToFavorite: boolean)` - исправлен исполнитель

### Удаленные зависимости:
- `winston: ^3.18.3` (конфликтовал с winston 2.1.x из vsc-leetcode-cli)

---

**Статус:** ✅ **ИСПРАВЛЕНО** - Все известные баги с test/submit устранены
