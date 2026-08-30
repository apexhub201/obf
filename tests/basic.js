const BasicTests = {
    name: 'Basic Tests',
    tests: [
        {
            name: 'Empty program',
            source: '',
            expectValid: true
        },
        {
            name: 'Simple print',
            source: 'print("Hello")',
            expectValid: true
        },
        {
            name: 'Local variable',
            source: 'local x = 100\nprint(x)',
            expectValid: true
        },
        {
            name: 'Multiple locals',
            source: 'local a, b = 1, 2\nprint(a + b)',
            expectValid: true
        },
        {
            name: 'Global assignment',
            source: 'x = 10\ny = 20\nprint(x + y)',
            expectValid: true
        }
    ]
};

module.exports = BasicTests;
