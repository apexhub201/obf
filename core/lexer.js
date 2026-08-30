const { Token, TokenTypes } = require('./tokens');

class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    tokenize() {
        while (this.pos < this.source.length) {
            this.skipWhitespace();
            if (this.pos >= this.source.length) break;
            
            if (this.skipComment()) continue;
            
            const char = this.source[this.pos];
            
            if (this.isIdentifierStart(char)) {
                this.readIdentifier();
            } else if (this.isDigit(char)) {
                this.readNumber();
            } else if (char === '"' || char === "'") {
                this.readString(char);
            } else if (char === '[' && this.source[this.pos + 1] === '[') {
                this.readLongString();
            } else {
                this.readOperator();
            }
        }
        
        this.tokens.push(new Token(TokenTypes.EOF, '', ''));
        return this.tokens;
    }

    skipWhitespace() {
        while (this.pos < this.source.length) {
            const char = this.source[this.pos];
            if (char === ' ' || char === '\t' || char === '\r') {
                this.advance();
            } else if (char === '\n') {
                this.advance();
                this.line++;
                this.column = 1;
            } else {
                break;
            }
        }
    }

    skipComment() {
        if (this.source[this.pos] === '-' && this.source[this.pos + 1] === '-') {
            this.advance();
            this.advance();
            
            // Long comment
            if (this.source[this.pos] === '[' && this.source[this.pos + 1] === '[') {
                this.advance();
                this.advance();
                while (this.pos < this.source.length) {
                    if (this.source[this.pos] === ']' && this.source[this.pos + 1] === ']') {
                        this.advance();
                        this.advance();
                        return true;
                    }
                    this.advance();
                }
                return true;
            }
            
            // Line comment
            while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
                this.advance();
            }
            return true;
        }
        return false;
    }

    isIdentifierStart(char) {
        return /[a-zA-Z_]/.test(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    readIdentifier() {
        let value = '';
        while (this.pos < this.source.length) {
            const char = this.source[this.pos];
            if (/[a-zA-Z0-9_]/.test(char)) {
                value += char;
                this.advance();
            } else {
                break;
            }
        }
        
        const type = CONFIG.LUA_KEYWORDS.includes(value) 
            ? TokenTypes.KEYWORD 
            : TokenTypes.IDENTIFIER;
        
        const token = new Token(type, value);
        token.pos = { line: this.line, column: this.column - value.length };
        this.tokens.push(token);
    }

    readNumber() {
        let value = '';
        while (this.pos < this.source.length) {
            const char = this.source[this.pos];
            if (/[0-9.eE+\-]/.test(char)) {
                value += char;
                this.advance();
            } else {
                break;
            }
        }
        
        const token = new Token(TokenTypes.NUMBER, value);
        token.pos = { line: this.line, column: this.column - value.length };
        this.tokens.push(token);
    }

    readString(quote) {
        let value = '';
        this.advance(); // Skip opening quote
        
        while (this.pos < this.source.length) {
            const char = this.source[this.pos];
            if (char === quote) {
                this.advance(); // Skip closing quote
                break;
            } else if (char === '\\') {
                value += char;
                this.advance();
                if (this.pos < this.source.length) {
                    value += this.source[this.pos];
                    this.advance();
                }
            } else {
                value += char;
                this.advance();
            }
        }
        
        const token = new Token(TokenTypes.STRING, value, quote + value + quote);
        token.pos = { line: this.line, column: this.column - value.length - 2 };
        this.tokens.push(token);
    }

    readLongString() {
        let value = '';
        this.advance(); // Skip [
        this.advance(); // Skip [
        
        while (this.pos < this.source.length) {
            if (this.source[this.pos] === ']' && this.source[this.pos + 1] === ']') {
                this.advance();
                this.advance();
                break;
            }
            value += this.source[this.pos];
            this.advance();
        }
        
        const token = new Token(TokenTypes.LONG_STRING, value, '[[' + value + ']]');
        token.pos = { line: this.line, column: this.column - value.length - 4 };
        this.tokens.push(token);
    }

    readOperator() {
        const char = this.source[this.pos];
        const operators = ['==', '~=', '<=', '>=', '..', '...', '+=', '-=', '*=', '/=',
                          '+', '-', '*', '/', '%', '^', '#', '=', '<', '>', '.', ':',
                          ',', '(', ')', '{', '}', '[', ']', ';'];
        
        for (const op of operators) {
            if (this.source.substr(this.pos, op.length) === op) {
                for (let i = 0; i < op.length; i++) {
                    this.advance();
                }
                const token = new Token(TokenTypes.OPERATOR, op);
                token.pos = { line: this.line, column: this.column - op.length };
                this.tokens.push(token);
                return;
            }
        }
        
        this.advance();
    }

    advance() {
        this.pos++;
        this.column++;
    }
}

module.exports = { Lexer };
