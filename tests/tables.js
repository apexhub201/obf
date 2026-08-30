const TableTests = {
    name: 'Table Tests',
    tests: [
        {
            name: 'Empty table',
            source: 'local t = {}',
            expectValid: true
        },
        {
            name: 'Array table',
            source: 'local t = {1, 2, 3, 4, 5}',
            expectValid: true
        },
        {
            name: 'Dictionary table',
            source: 'local t = {name = "test", value = 100}',
            expectValid: true
        },
        {
            name: 'Mixed table',
            source: 'local t = {1, 2, name = "test", 3, 4}',
            expectValid: true
        },
        {
            name: 'Nested tables',
            source: 'local t = {a = {b = {c = 1}}}',
            expectValid: true
        }
    ]
};

module.exports = TableTests;
