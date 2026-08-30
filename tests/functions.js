const FunctionTests = {
    name: 'Function Tests',
    tests: [
        {
            name: 'Simple function',
            source: 'local function add(a, b)\n    return a + b\nend',
            expectValid: true
        },
        {
            name: 'Anonymous function',
            source: 'local fn = function(x)\n    return x * 2\nend',
            expectValid: true
        },
        {
            name: 'Nested functions',
            source: 'local function outer()\n    local function inner()\n        return 42\n    end\n    return inner()\nend',
            expectValid: true
        },
        {
            name: 'Function with multiple returns',
            source: 'local function getValues()\n    return 1, 2, 3\nend',
            expectValid: true
        },
        {
            name: 'Recursive function',
            source: 'local function factorial(n)\n    if n <= 1 then\n        return 1\n    end\n    return n * factorial(n - 1)\nend',
            expectValid: true
        }
    ]
};

module.exports = FunctionTests;
