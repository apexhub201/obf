class Printer {
    constructor() {
        this.output = '';
    }

    print(ast) {
        this.printNode(ast, 0);
        return this.output;
    }

    printNode(node, indent) {
        if (!node) return;
        
        const indentStr = '  '.repeat(indent);
        
        switch (node.type) {
            case 'Program':
                this.output += 'Program\n';
                node.body.forEach(child => this.printNode(child, indent + 1));
                break;
            case 'LocalDeclaration':
                this.output += `${indentStr}LocalDeclaration: ${node.names.join(', ')}\n`;
                if (node.values) {
                    node.values.forEach(value => this.printNode(value, indent + 1));
                }
                break;
            case 'FunctionDeclaration':
                this.output += `${indentStr}FunctionDeclaration: ${node.name}(${node.params.join(', ')})\n`;
                node.body.forEach(child => this.printNode(child, indent + 1));
                break;
            case 'Assignment':
                this.output += `${indentStr}Assignment: ${node.targets.join(', ')} = ...\n`;
                if (node.values) {
                    node.values.forEach(value => this.printNode(value, indent + 1));
                }
                break;
            case 'IfStatement':
                this.output += `${indentStr}IfStatement\n`;
                this.printNode(node.condition, indent + 1);
                node.thenBranch.forEach(child => this.printNode(child, indent + 1));
                if (node.elseBranch && node.elseBranch.length > 0) {
                    this.output += `${indentStr}  Else\n`;
                    node.elseBranch.forEach(child => this.printNode(child, indent + 1));
                }
                break;
            case 'StringLiteral':
                this.output += `${indentStr}StringLiteral: "${node.value}"\n`;
                break;
            case 'NumberLiteral':
                this.output += `${indentStr}NumberLiteral: ${node.value}\n`;
                break;
            case 'Identifier':
                this.output += `${indentStr}Identifier: ${node.name}\n`;
                break;
            case 'JunkCode':
                this.output += `${indentStr}JunkCode\n`;
                break;
            case 'DeadCode':
                this.output += `${indentStr}DeadCode\n`;
                break;
        }
    }
}

module.exports = { Printer };
