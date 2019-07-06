def runUserScript(func, params, paramTypes):
    if (len(params) != len(paramTypes)):
        onParameterError()

    newParams = []
    for i, val in enumerate(params):
        newParams.append(parseParameter(i, paramTypes[i], val))
    func(*newParams)


def parseSpecialParameter(index, type, param):
    return None
