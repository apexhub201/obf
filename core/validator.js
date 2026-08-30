class Validator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(code) {
        this.errors = [];
        this.warnings = [];
        
        this.checkBalancedBrackets(code);
        this.checkValidIdentifiers(code);
        this.checkValidStrings(code);
        this.checkValidFunctions(code);
        
        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    checkBalancedBrackets(code) {
        const stack = [];
        const bracketPairs = {
            '(': ')',
            '[': ']',
            '{': '}'
        };
        const reversePairs = {
            ')': '(',
            ']': '[',
            '}': '{'
        };
        
        let inString = false;
        let stringChar = null;
        let lineNumber = 1;
        let columnNumber = 1;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            if (char === '\n') {
                lineNumber++;
                columnNumber = 1;
                continue;
            }
            columnNumber++;
            
            if (inString) {
                if (char === stringChar) {
                    inString = false;
                }
                continue;
            }
            
            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
            }
            
            if (bracketPairs[char]) {
                stack.push({ char, line: lineNumber, column: columnNumber });
            } else if (reversePairs[char]) {
                if (stack.length === 0) {
                    this.errors.push({
                        type: 'UNBALANCED_BRACKET',
                        message: `Unexpected closing bracket '${char}' at line ${lineNumber}, column ${columnNumber}`,
                        line: lineNumber,
                        column: columnNumber
                    });
                } else {
                    const last = stack[stack.length - 1];
                    if (last.char !== reversePairs[char]) {
                        this.errors.push({
                            type: 'UNBALANCED_BRACKET',
                            message: `Mismatched brackets at line ${lineNumber}, column ${columnNumber}`,
                            line: lineNumber,
                            column: columnNumber
                        });
                    }
                    stack.pop();
                }
            }
        }
        
        if (stack.length > 0) {
            for (const bracket of stack) {
                this.errors.push({
                    type: 'UNCLOSED_BRACKET',
                    message: `Unclosed bracket '${bracket.char}' from line ${bracket.line}, column ${bracket.column}`,
                    line: bracket.line,
                    column: bracket.column
                });
            }
        }
    }

    checkValidIdentifiers(code) {
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('local ')) {
                const match = trimmed.match(/^local\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match && !match[1]) {
                    this.errors.push({
                        type: 'INVALID_IDENTIFIER',
                        message: `Invalid identifier at line ${lineIndex + 1}`,
                        line: lineIndex + 1,
                        column: 6
                    });
                }
            }
        });
    }

    checkValidStrings(code) {
        const stringRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g;
        let match;
        
        while ((match = stringRegex.exec(code)) !== null) {
            const stringContent = match[0];
            if (stringContent.length < 2) {
                this.errors.push({
                    type: 'INVALID_STRING',
                    message: `Invalid string at position ${match.index}`,
                    line: this.getLineNumber(code, match.index),
                    column: this.getColumnNumber(code, match.index)
                });
            }
        }
    }

    checkValidFunctions(code) {
        const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        
        while ((match = functionRegex.exec(code)) !== null) {
            const functionName = match[1];
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)) {
                this.errors.push({
                    type: 'INVALID_FUNCTION',
                    message: `Invalid function name '${functionName}' at line ${this.getLineNumber(code, match.index)}`,
                    line: this.getLineNumber(code, match.index),
                    column: this.getColumnNumber(code, match.index)
                });
            }
        }
    }

    getLineNumber(code, position) {
        return code.substring(0, position).split('\n').length;
    }

    getColumnNumber(code, position) {
        const lines = code.substring(0, position).split('\n');
        return lines[lines.length - 1].length + 1;
    }
}

module.exports = { Validator };
