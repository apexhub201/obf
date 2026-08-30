class Analyzer {
    constructor() {
        this.stats = {
            variables: 0,
            functions: 0,
            strings: 0,
            numbers: 0,
            comments: 0,
            lines: 0
        };
    }

    analyze(ast) {
        this.traverseNode(ast);
        return this.stats;
    }

    traverseNode(node) {
        if (!node) return;
        
        switch (node.type) {
            case 'Program':
                this.stats.lines = node.body.length;
                node.body.forEach(child => this.traverseNode(child));
                break;
            case 'LocalDeclaration':
                this.stats.variables += node.names.length;
                node.values.forEach(value => this.traverseNode(value));
                break;
            case 'FunctionDeclaration':
                this.stats.functions++;
                node.body.forEach(child => this.traverseNode(child));
                break;
            case 'StringLiteral':
                this.stats.strings++;
                break;
            case 'NumberLiteral':
                this.stats.numbers++;
                break;
            case 'Identifier':
                // Count identifiers
                break;
            default:
                if (node.body) {
                    node.body.forEach(child => this.traverseNode(child));
                }
                if (node.children) {
                    node.children.forEach(child => this.traverseNode(child));
                }
        }
    }
}

module.exports = { Analyzer };
