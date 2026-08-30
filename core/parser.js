class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.ast = {
            type: 'Program',
            body: []
        };
    }

    parse() {
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            
            if (token.type === 'EOF') {
                break;
            }
            
            const statement = this.parseStatement();
            if (statement) {
                this.ast.body.push(statement);
            }
        }
        
        return this.ast;
    }

    parseStatement() {
        const token = this.tokens[this.pos];
        
        switch (token.type) {
            case 'KEYWORD':
                switch (token.value) {
                    case 'local':
                        return this.parseLocalDeclaration();
                    case 'function':
                        return this.parseFunctionDeclaration();
                    case 'if':
                        return this.parseIfStatement();
                    case 'while':
                        return this.parseWhileStatement();
                    case 'repeat':
                        return this.parseRepeatStatement();
                    case 'for':
                        return this.parseForStatement();
                    case 'return':
                        return this.parseReturnStatement();
                    case 'break':
                        return this.parseBreakStatement();
                    case 'continue':
                        return this.parseContinueStatement();
                    case 'do':
                        return this.parseDoBlock();
                }
                break;
            case 'IDENTIFIER':
                return this.parseAssignment();
        }
        
        this.pos++;
        return null;
    }

    parseLocalDeclaration() {
        const node = {
            type: 'LocalDeclaration',
            names: [],
            values: []
        };
        
        this.pos++; // Skip 'local'
        
        // Parse names
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'IDENTIFIER') {
                node.names.push(token.value);
                this.pos++;
                if (this.tokens[this.pos]?.value === ',') {
                    this.pos++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        // Check for assignment
        if (this.tokens[this.pos]?.value === '=') {
            this.pos++; // Skip '='
            
            // Parse values
            while (this.pos < this.tokens.length) {
                const value = this.parseExpression();
                if (value) {
                    node.values.push(value);
                }
                if (this.tokens[this.pos]?.value === ',') {
                    this.pos++;
                } else {
                    break;
                }
            }
        }
        
        return node;
    }

    parseFunctionDeclaration() {
        const node = {
            type: 'FunctionDeclaration',
            name: '',
            params: [],
            body: []
        };
        
        this.pos++; // Skip 'function'
        
        // Get function name
        if (this.tokens[this.pos]?.type === 'IDENTIFIER') {
            node.name = this.tokens[this.pos].value;
            this.pos++;
        }
        
        // Parse parameters
        if (this.tokens[this.pos]?.value === '(') {
            this.pos++; // Skip '('
            
            while (this.pos < this.tokens.length) {
                const token = this.tokens[this.pos];
                if (token.value === ')') {
                    this.pos++;
                    break;
                }
                if (token.type === 'IDENTIFIER') {
                    node.params.push(token.value);
                    this.pos++;
                }
                if (this.tokens[this.pos]?.value === ',') {
                    this.pos++;
                }
            }
        }
        
        // Parse body
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'end') {
                this.pos++;
                break;
            }
            const statement = this.parseStatement();
            if (statement) {
                node.body.push(statement);
            }
        }
        
        return node;
    }

    parseExpression() {
        const token = this.tokens[this.pos];
        
        if (token.type === 'STRING') {
            this.pos++;
            return { type: 'StringLiteral', value: token.value };
        }
        if (token.type === 'NUMBER') {
            this.pos++;
            return { type: 'NumberLiteral', value: token.value };
        }
        if (token.type === 'IDENTIFIER') {
            this.pos++;
            return { type: 'Identifier', name: token.value };
        }
        
        this.pos++;
        return null;
    }

    parseIfStatement() {
        const node = {
            type: 'IfStatement',
            condition: null,
            thenBranch: [],
            elseBranch: []
        };
        
        this.pos++; // Skip 'if'
        node.condition = this.parseExpression();
        
        if (this.tokens[this.pos]?.value === 'then') {
            this.pos++; // Skip 'then'
        }
        
        // Parse then branch
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && (token.value === 'else' || token.value === 'end')) {
                break;
            }
            const statement = this.parseStatement();
            if (statement) {
                node.thenBranch.push(statement);
            }
        }
        
        // Check for else
        if (this.tokens[this.pos]?.value === 'else') {
            this.pos++; // Skip 'else'
            
            while (this.pos < this.tokens.length) {
                const token = this.tokens[this.pos];
                if (token.type === 'KEYWORD' && token.value === 'end') {
                    break;
                }
                const statement = this.parseStatement();
                if (statement) {
                    node.elseBranch.push(statement);
                }
            }
        }
        
        if (this.tokens[this.pos]?.value === 'end') {
            this.pos++; // Skip 'end'
        }
        
        return node;
    }

    parseWhileStatement() {
        const node = {
            type: 'WhileStatement',
            condition: null,
            body: []
        };
        
        this.pos++; // Skip 'while'
        node.condition = this.parseExpression();
        
        if (this.tokens[this.pos]?.value === 'do') {
            this.pos++; // Skip 'do'
        }
        
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'end') {
                this.pos++;
                break;
            }
            const statement = this.parseStatement();
            if (statement) {
                node.body.push(statement);
            }
        }
        
        return node;
    }

    parseForStatement() {
        const node = {
            type: 'ForStatement',
            init: null,
            condition: null,
            increment: null,
            body: []
        };
        
        this.pos++; // Skip 'for'
        
        // Simple parsing for now
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'do') {
                this.pos++;
                break;
            }
            this.pos++;
        }
        
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'end') {
                this.pos++;
                break;
            }
            const statement = this.parseStatement();
            if (statement) {
                node.body.push(statement);
            }
        }
        
        return node;
    }

    parseReturnStatement() {
        const node = {
            type: 'ReturnStatement',
            values: []
        };
        
        this.pos++; // Skip 'return'
        
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'end') {
                break;
            }
            const value = this.parseExpression();
            if (value) {
                node.values.push(value);
            }
            if (this.tokens[this.pos]?.value === ',') {
                this.pos++;
            } else {
                break;
            }
        }
        
        return node;
    }

    parseBreakStatement() {
        this.pos++; // Skip 'break'
        return { type: 'BreakStatement' };
    }

    parseContinueStatement() {
        this.pos++; // Skip 'continue'
        return { type: 'ContinueStatement' };
    }

    parseDoBlock() {
        const node = {
            type: 'DoBlock',
            body: []
        };
        
        this.pos++; // Skip 'do'
        
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'KEYWORD' && token.value === 'end') {
                this.pos++;
                break;
            }
            const statement = this.parseStatement();
            if (statement) {
                node.body.push(statement);
            }
        }
        
        return node;
    }

    parseAssignment() {
        const node = {
            type: 'Assignment',
            targets: [],
            values: []
        };
        
        // Parse targets
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === 'IDENTIFIER') {
                node.targets.push(token.value);
                this.pos++;
            } else {
                break;
            }
            
            if (this.tokens[this.pos]?.value === ',') {
                this.pos++;
            } else {
                break;
            }
        }
        
        // Check for assignment operator
        if (this.tokens[this.pos]?.value === '=') {
            this.pos++; // Skip '='
            
            // Parse values
            while (this.pos < this.tokens.length) {
                const value = this.parseExpression();
                if (value) {
                    node.values.push(value);
                }
                if (this.tokens[this.pos]?.value === ',') {
                    this.pos++;
                } else {
                    break;
                }
            }
        }
        
        return node;
    }
}

module.exports = { Parser };
