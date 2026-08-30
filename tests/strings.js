const StringTests = {
    name: 'String Tests',
    tests: [
        {
            name: 'Simple string',
            source: 'local s = "hello"',
            expectValid: true
        },
        {
            name: 'String with spaces',
            source: 'local s = "hello world"',
            expectValid: true
        },
        {
            name: 'String with quotes',
            source: 'local s = "hello \\"world\\""',
            expectValid: true
        },
        {
            name: 'Unicode string',
            source: 'local s = "Xin chào 👋 Việt Nam"',
            expectValid: true
        },
        {
            name: 'Long string',
            source: 'local s = [[hello\nworld]]',
            expectValid: true
        },
        {
            name: 'String concatenation',
            source: 'local s = "hello" .. " " .. "world"',
            expectValid: true
        }
    ]
};

module.exports = StringTests;
