import importlib.util
import sys
from pathlib import Path
import json
import re
import socket

testString = str(sys.argv[2])
funcName = str(sys.argv[3])
paramTypes = str(sys.argv[4]).split(",")
problemNum = int(sys.argv[6])
debugServerPort = int(sys.argv[7])


class ListNode:
    def __init__(self, x):
        self.val = x
        self.next = None


def onParameterError():
    raise Exception(
        "Parameters parsing error, please check the format of the input parameters")


def onParameterTypeError(t):
    raise Exception("Unsupported parameter type: {}".format(t))


def isNumber(num):
    return isinstance(num, int)


def isString(s):
    return isinstance(s, str)


def isCharacter(s):
    return isString(s) and len(s) == 1


def isList(li):
    return isinstance(li, list)


def parseNumber(param):
    if (not isNumber(param)):
        onParameterError()
    return param


def parseNumberArray(param):
    if (not isList(param)):
        onParameterError()

    for i in param:
        if (not isNumber(i)):
            onParameterError()
    return param


def parseNumberArrayArray(param):
    if (not isList(param)):
        onParameterError()
    for i in param:
        parseNumberArray(i)
    return param


def parseString(param):
    if (not isString(param)):
        onParameterError()

    return param


def parseStringArray(param):
    if (not isList(param)):
        onParameterError()

    for i in param:
        parseString(i)

    return param


def parseStringArrayArray(param):
    if (not isList(param)):
        onParameterError()

    for i in param:
        parseStringArray(i)

    return param


def parseListNode(param):
    if (not isList(param)):
        onParameterError()

    head = None
    tail = None

    for i in param:
        node = ListNode(i)
        if (head == None):
            tail = node
            head = node
        else:
            tail.next = node
            tail = node

    return head


def parseListNodeArray(param):
    if (not isList(param)):
        onParameterError()

    res = []
    for i in param:
        res.append(parseListNode(i))

    return res


def parseCharacter(param):
    if (not isCharacter(param)):
        onParameterError()

    return param


def parseCharacterArray(param):
    if (not isList(param)):
        onParameterError()

    for i in param:
        parseCharacter(i)

    return param


def parseCharacterArrayArray(param):
    if (not isList(param)):
        onParameterError()

    for i in param:
        parseCharacterArray(i)

    return param


def parseParameter(index, paramType, param):
    switch = {
        "number": lambda x: parseNumber(x),
        "number[]": lambda x: parseNumberArray(x),
        "number[][]": lambda x: parseNumberArrayArray(x),
        "string": lambda x: parseString(x),
        "string[]": lambda x: parseStringArray(x),
        "string[][]": lambda x: parseStringArrayArray(x),
        "ListNode": lambda x: parseListNode(x),
        "ListNode[]": lambda x: parseListNodeArray(x),
        "character": lambda x: parseCharacter(x),
        "character[]": lambda x: parseCharacterArray(x),
        "character[][]": lambda x: parseCharacterArrayArray(x),
    }
    switchfun = switch.get(paramType, 0)

    if switchfun is 0:
        result = parseSpecialParameter(index, paramType, param)
        if result is None:
            onParameterTypeError(paramType)
        return result
    else:
        return switchfun(param)


def loadModule():
    # add module to search path
    parsedPath = Path(sys.argv[1])
    sys.path.append(parsedPath.parent)

    # load module
    spec = importlib.util.spec_from_file_location(parsedPath.stem, sys.argv[1])
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


// @@stub-for-code@@


def start():
    module = loadModule()
    solution = module.Solution()
    func = getattr(solution, funcName)

    lines = testString.split("\\n")

    params = []
    for i, val in enumerate(lines):
        params.append(json.loads(val))

    runUserScript(func, params, paramTypes)


def makeMessage(ty, message):
    return json.dumps({
        "type": ty,
        "message": message,
        "problemNum": problemNum,
        "filePath": sys.argv[1],
        "testString": testString,
        "language": "python",
    }).encode("utf-8")


if __name__ == "__main__":
    sock = socket.socket()
    sock.connect(("127.0.0.1", debugServerPort))
    try:
        start()
        sock.send(makeMessage("success", ""))
    except Exception as identifier:
        sock.send(makeMessage("error", str(identifier)))
        raise identifier
    finally:
        sock.close()
