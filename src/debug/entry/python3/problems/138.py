def runUserScript(func, params, paramTypes):
    if (len(params) != len(paramTypes)):
        onParameterError()

    newParams = []
    for i, val in enumerate(params):
        newParams.append(parseParameter(i, paramTypes[i], val))
    func(*newParams)


class Node:
    def __init__(self, val, next, random):
        self.val = val
        self.next = next
        self.random = random


def parseNode(param, nodeMap):
    arr = []
    for i, val in enumerate(param):
        arr.append(Node(val[0], None, None))

    for i, val in enumerate(param):
        if i is not len(param) - 1:
            arr[i].next = arr[i + 1]

        if val[1] is not None:
            arr[i].random = arr[val[1]]

    return arr[0]


def parseSpecialParameter(index, paramType, param):
    if paramType == "Node":
        return parseNode(param, None)
    return None
