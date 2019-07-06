function runUserScript(userFunm, params, paramTypes) {
    if (params.length !== paramTypes.length) {
        onParameterError();
    }

    const parsedParams = params.map((param, index) => {
        const type = paramTypes[index];
        return parseParameter(index, type, param);
    });
    userFunm.apply(null, parsedParams);
}

function Node(val, children) {
    this.val = val;
    this.children = children;
}

/**
 * @param {number[]} param
 */
function parseNode(param) {
    if (param.length === 0) {
        return null;
    }
    const first = new Node(param[0], []);
    const queue = [first];
    for (let j = 2; j < param.length; j++) {
        const top = queue[0];
        if (param[j] === null) {
            queue.shift();
        } else {
            const child = new Node(param[j], []);
            top.children.push(child);
            queue.push(child);
        }
    }
    return first;
}

function parseSpecialParameter(index, type, param) {
    switch (type) {
        case "Node":
            return parseNode(param);
    }
    return null;
}
