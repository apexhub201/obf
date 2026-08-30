class CodeGenerator {
    constructor() {
        this.output = '';
        this.indentLevel = 0;
        this.indentChar = '    ';
    }

    generate(ast) {
        this.generateNode(ast);
        return this.output;
    }

    generateNode(node) {
        if (!node) return;
        
        switch (node.type) {
            case 'Program':
                this.generateBody(node.body);
                break;
            case 'LocalDeclaration':
                this.generateLocalDeclaration(node);
                break;
            case 'FunctionDeclaration':
                this.generateFunctionDeclaration(node);
                break;
            case 'Assignment':
                this.generateAssignment(node);
                break;
            case 'IfStatement':
                this.generateIfStatement(node);
                break;
            case 'WhileStatement':
                this.generateWhileStatement(node);
                break;
            case 'ReturnStatement':
                this.generateReturnStatement(node);
                break;
            case 'StringLiteral':
                this.output += `"${node.value}"`;
                break;
            case 'NumberLiteral':
                this.output += node.value;
                break;
            case 'Identifier':
                this.output += node.name;
                break;
            case 'JunkCode':
                this.output += this.indent() + node.content;
                break;
            case 'DeadCode':
                this.output += this.indent() + node.content;
                break;
        }
    }

    generateBody(body) {
        if (!body) return;
        body.forEach(statement => {
            this.generateNode(statement);
            this.output += '\n';
        });
    }

    generateLocalDeclaration(node) {
        this.output += this.indent() + 'local ';
        
        node.names.forEach((name, index) => {
            if (index > 0) this.output += ', ';
            this.output += name;
        });
        
        if (node.values && node.values.length > 0) {
            this.output += ' = ';
            node.values.forEach((value, index) => {
                if (index > 0) this.output += ', ';
                this.generateNode(value);
            });
        }
    }

    generateFunctionDeclaration(node) {
        this.output += this.indent() + 'function ' + node.name + '(';
        
        node.params.forEach((param, index) => {
            if (index > 0) this.output += ', ';
            this.output += param;
        });
        
        this.output += ')\n';
        this.indentLevel++;
        this.generateBody(node.body);
        this.indentLevel--;
        this.output += this.indent() + 'end';
    }

    generateAssignment(node) {
        this.output += this.indent();
        
        node.targets.forEach((target, index) => {
            if (index > 0) this.output += ', ';
            this.output += target;
        });
        
        this.output += ' = ';
        
        node.values.forEach((value, index) => {
            if (index > 0) this.output += ', ';
            this.generateNode(value);
        });
    }

    generateIfStatement(node) {
        this.output += this.indent() + 'if ';
        this.generateNode(node.condition);
        this.output += ' then\n';
        
        this.indentLevel++;
        this.generateBody(node.thenBranch);
        this.indentLevel--;
        
        if (node.elseBranch && node.elseBranch.length > 0) {
            this.output += this.indent() + 'else\n';
            this.indentLevel++;
            this.generateBody(node.elseBranch);
            this.indentLevel--;
        }
        
        this.output += this.indent() + 'end';
    }

    generateWhileStatement(node) {
        this.output += this.indent() + 'while ';
        this.generateNode(node.condition);
        this.output += ' do\n';
        
        this.indentLevel++;
        this.generateBody(node.body);
        this.indentLevel--;
        
        this.output += this.indent() + 'end';
    }

    generateReturnStatement(node) {
        this.output += this.indent() + 'return';
        
        if (node.values && node.values.length > 0) {
            this.output += ' ';
            node.values.forEach((value, index) => {
                if (index > 0) this.output += ', ';
                this.generateNode(value);
            });
        }
    }

    indent() {
        return this.indentChar.repeat(this.indentLevel);
    }
}

module.exports = { CodeGenerator };
