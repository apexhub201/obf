class Helpers {
    static generateMathHelper() {
        return `local function _math_helper(a, b, op)
    if op == '+' then return a + b end
    if op == '-' then return a - b end
    if op == '*' then return a * b end
    if op == '/' then return a / b end
    return a + b
end`;
    }

    static generateTypeHelper() {
        return `local function _type_check(val, expected)
    return type(val) == expected
end`;
    }

    static generateTableHelper() {
        return `local function _table_merge(t1, t2)
    local result = {}
    for k, v in pairs(t1) do result[k] = v end
    for k, v in pairs(t2) do result[k] = v end
    return result
end`;
    }

    static generateRandomHelper(seed) {
        return `local _random_state = ${seed}
local function _random_next()
    _random_state = (_random_state * 1103515245 + 12345) % 2^31
    return _random_state / 2^31
end`;
    }
}

module.exports = { Helpers };
