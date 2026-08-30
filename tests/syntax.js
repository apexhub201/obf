const SyntaxTests = {
    name: 'Syntax Tests',
    tests: [
        {
            name: 'If statement',
            source: 'if true then\n    print("yes")\nend',
            expectValid: true
        },
        {
            name: 'If-else statement',
            source: 'if false then\n    print("no")\nelse\n    print("yes")\nend',
            expectValid: true
        },
        {
            name: 'While loop',
            source: 'local i = 0\nwhile i < 10 do\n    i = i + 1\nend',
            expectValid: true
        },
        {
            name: 'For loop',
            source: 'for i = 1, 10 do\n    print(i)\nend',
            expectValid: true
        },
        {
            name: 'Do block',
            source: 'do\n    local x = 5\n    print(x)\nend',
            expectValid: true
        }
    ]
};

module.exports = SyntaxTests;
