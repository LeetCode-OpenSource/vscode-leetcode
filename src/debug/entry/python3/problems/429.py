def runUserScript(func, params, paramTypes):
    if (len(params) != len(paramTypes)):
        onParameterError()

    newParams = []
    for i, val in enumerate(params):
        newParams.append(parseParameter(i, paramTypes[i], val))
    func(*newParams)


class Node:
    def __init__(self, val, children):
        self.val = val
        self.children = children


def parseNode(param):
    if len(param) is 0:
        return

    first = Node(param[0], [])
    arr = [first]

    for i, val in enumerate(param):
        if i is 0:
            continue

        if i is 1:
            continue

        top = arr[0]
        if val is None:
            arr.pop(0)
        else:
            child = Node(val, [])
            top.children.append(child)
            arr.append(child)

    return first


def parseSpecialParameter(index, paramType, param):
    if paramType == "Node":
        return parseNode(param)
    return None
