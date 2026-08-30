class Token {
    constructor(type, value, raw = null) {
        this.type = type;
        this.value = value;
        this.raw = raw || String(value);
        this.pos = { line: 0, column: 0 };
        this.encoded = false;
        this.originalValue = null;
        this.decodeFunction = null;
        this.transformed = false;
        this.transformedValue = null;
        this.originalName = null;
    }

    toString() {
        return `${this.type}(${this.raw})`;
    }
}

const TokenTypes = {
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',
    STRING: 'STRING',
    LONG_STRING: 'LONG_STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    NIL: 'NIL',
    OPERATOR: 'OPERATOR',
    PUNCTUATION: 'PUNCTUATION',
    COMMENT: 'COMMENT',
    WHITESPACE: 'WHITESPACE',
    VARARG: 'VARARG',
    EOF: 'EOF'
};

module.exports = { Token, TokenTypes };
