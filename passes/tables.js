class TablePass {
    constructor() {
        this.transformedTables = 0;
    }

    run(ast, settings = {}) {
        this.transformedTables = 0;
        this.transformNodeTables(ast);
        
        return {
            tables: this.transformedTables
        };
    }

    transformNodeTables(node) {
        if (!node) return;
        
        if (node.type === 'TableExpression') {
            // Reorder safe constant entries
            this.reorderTableEntries(node);
            this.transformedTables++;
        }
        
        if (node.body) {
            node.body.forEach(child => this.transformNodeTables(child));
        }
        if (node.children) {
            node.children.forEach(child => this.transformNodeTables(child));
        }
    }

    reorderTableEntries(tableNode) {
        if (!tableNode.entries || tableNode.entries.length < 2) return;
        
        // Only reorder constant entries
        const constantEntries = tableNode.entries.filter(entry => 
            entry.type === 'ConstantEntry' || 
            (entry.value && entry.value.type === 'StringLiteral')
        );
        
        if (constantEntries.length < 2) return;
        
        // Shuffle constant entries
        for (let i = constantEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [constantEntries[i], constantEntries[j]] = [constantEntries[j], constantEntries[i]];
        }
    }
}

module.exports = { TablePass };
