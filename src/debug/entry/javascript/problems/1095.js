function runUserScript(userFunm, params, paramTypes) {
    if (params.length !== 2) {
        onParameterError();
    }
    userFunm.apply(null, [parseParameter(0, 'number', params[1]), parseParameter(1, 'MountainArray', params[0])]);
}


function parseSpecialParameter(index, type, param) {
    return null;
}
