var net = require("net");

const fun = require(process.argv[2]);
const testString = process.argv[3];
const paramTypes = process.argv[5].split(",");
const problemNum = parseInt(process.argv[7]);
const debugServerPort = parseInt(process.argv[8]);

const sock = net.connect(
    {
        port: debugServerPort,
        host: "127.0.0.1",
    },
    function() {
        start();
    },
);
sock.setNoDelay(true);

function onClose() {
    setTimeout(() => {
        if (sock != null) {
            sock.end();
        }
        process.exit(0);
    }, 2000);
}

function makeMessage(type, message) {
    return JSON.stringify({
        type,
        message,
        problemNum,
        filePath: process.argv[2],
        testString,
        language: "javascript",
    });
}

function onError(err) {
    sock.write(makeMessage("error", err));
    onClose();
}

function onSuccess() {
    sock.write(makeMessage("success", ""));
    onClose();
}

process.on("uncaughtException", function(err) {
    onError(err.message + "\n" + err.stack);
    throw err;
});

function onParameterError() {
    throw new Error("Parameters parsing error, please check the format of the input parameters");
}

function onParameterTypeError(type) {
    throw new Error(`Unsupported parameter type: ${type}`);
}

function isNumber(num) {
    return num === +num;
}

function isString(str) {
    return typeof str === "string";
}

function isCharacter(str) {
    return isString(str) && str.length === 1;
}

function parseNumber(param) {
    if (!isNumber(param)) {
        onParameterError();
    }
    return param;
}

function parseNumberArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        if (!isNumber(p)) {
            onParameterError();
        }
    });
    return param;
}

function parseString(param) {
    if (!isString(param)) {
        onParameterError();
    }
    return param;
}

function parseStringArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        if (!isString(p)) {
            onParameterError();
        }
    });
    return param;
}

function parseStringArrayArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        if (!parseStringArray(p)) {
            onParameterError();
        }
    });
    return param;
}

function ListNode(val) {
    this.val = val;
    this.next = null;
}

function parseListNode(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }

    let head = null;
    let tail = null;
    param.map(p => {
        const node = new ListNode(p);
        if (head == null) {
            tail = node;
            head = node;
        } else {
            tail.next = node;
            tail = node;
        }
    });
    return head;
}

function parseListNodeArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }

    const res = param.map(p => {
        return parseListNode(p);
    });
    return res;
}

function parseNumberArrayArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        return parseNumberArray(p);
    });
    return param;
}

function parseCharacter(param) {
    if (!isCharacter(param)) {
        onParameterError();
    }
    return param;
}

function parseCharacterArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        if (!isCharacter(p)) {
            onParameterError();
        }
    });
    return param;
}

function parseCharacterArrayArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    param.map(p => {
        parseCharacterArray(p);
    });
    return param;
}

function NestedInteger(ni) {
    let nested = [];
    if (Array.isArray(ni)) {
        ni.map(n => {
            nested.push(new NestedInteger(n));
        });
    }

    /**
     * Return true if this NestedInteger holds a single integer, rather than a nested list.
     * @return { boolean }
     */
    this.isInteger = function() {
        if (Array.isArray(ni)) {
            return false;
        }
        return true;
    };

    /**
     * Return the single integer that this NestedInteger holds, if it holds a single integer
     * Return null if this NestedInteger holds a nested list
     * @return { integer }
     */
    this.getInteger = function() {
        if (Array.isArray(ni)) {
            return null;
        }
        return ni;
    };

    /**
     * Return the nested list that this NestedInteger holds, if it holds a nested list
     * Return null if this NestedInteger holds a single integer
     * @return { NestedInteger[] }
     */
    this.getList = function() {
        if (Array.isArray(ni)) {
            return nested;
        }
        return null;
    };
}

function parseNestedIntegerArray(param) {
    return param.map(p => {
        return new NestedInteger(p);
    });
}

function parseMountainArray(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }
    function MountainArray() {
        /**
         * @param {integer} index
         * @return {integer}
         */
        this.get = function(index) {
            return param[index];
        };

        /**
         * @return {integer}
         */
        this.length = function() {
            return param.length;
        };
    }
    return new MountainArray();
}

function TreeNode(val) {
    this.val = val;
    this.left = this.right = null;
}

function parseTreeNode(param) {
    if (!Array.isArray(param)) {
        onParameterError();
    }

    let root = null;
    const fifo = [];
    let i = 0;
    while (i < param.length) {
        if (i === 0) {
            root = new TreeNode(param[i]);
            i += 1;
            fifo.push(root);
            continue;
        }
        const parent = fifo.shift();
        if (param[i] != null) {
            const left = new TreeNode(param[i]);
            parent.left = left;
            fifo.push(left);
        }
        if (i + 1 < param.length && param[i + 1] != null) {
            const right = new TreeNode(param[i + 1]);
            parent.right = right;
            fifo.push(right);
        }
        i = i + 2;
    }
    return root;
}

function parseParameter(index, type, param) {
    switch (type) {
        case "number":
            return parseNumber(param);
        case "number[]":
            return parseNumberArray(param);
        case "number[][]":
            return parseNumberArrayArray(param);
        case "string":
            return parseString(param);
        case "string[]":
            return parseStringArray(param);
        case "string[][]":
            return parseStringArrayArray(param);
        case "ListNode":
            return parseListNode(param);
        case "ListNode[]":
            return parseListNodeArray(param);
        case "character":
            return parseCharacter(param);
        case "character[]":
            return parseCharacterArray(param);
        case "character[][]":
            return parseCharacterArrayArray(param);
        case "NestedInteger[]":
            return parseNestedIntegerArray(param);
        case "MountainArray":
            return parseMountainArray(param);
        case "TreeNode":
            return parseTreeNode(param);
    }
    const result = parseSpecialParameter(index, type, param);
    if (result == null) {
        onParameterTypeError(type);
    }
    return result;
}

// @@stub-for-code@@

function parseParamsToJson(paramString) {
    let params;
    try {
        const paramsByLine = paramString.split(/\\n/);

        params = paramsByLine.map(str => {
            return JSON.parse(str);
        });

        return params;
    } catch (error) {
        onParameterError();
        return;
    }
}

function start() {
    const paramString = testString.replace(/\\"/g, '"');
    const jsonParams = parseParamsToJson(paramString);

    runUserScript(fun, jsonParams, paramTypes);
    onSuccess();
}
