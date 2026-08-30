class StringPoolPass {
    constructor() {
        this.pool = [];
        this.poolIndex = new Map();
    }

    run(ast, settings = {}) {
        this.pool = [];
        this.poolIndex = new Map();
        
        this.collectStrings(ast);
        
        if (this.pool.length === 0) {
            return { strings: 0, pool: [] };
        }
        
        // Shuffle pool if not deterministic
        if (!settings.deterministicBuild) {
            this.shuffleArray(this.pool);
        }
        
        // Update AST nodes
        this.updateStringReferences(ast);
        
        return {
            strings: this.pool.length,
            pool: this.pool
        };
    }

    collectStrings(node) {
        if (!node) return;
        
        if (node.type === 'StringLiteral') {
            const index = this.pool.length;
            this.pool.push(node.value);
            this.poolIndex.set(node.value, index);
            node.poolIndex = index;
        }
        
        if (node.body) {
            node.body.forEach(child => this.collectStrings(child));
        }
        if (node.children) {
            node.children.forEach(child => this.collectStrings(child));
        }
    }

    updateStringReferences(node) {
        if (!node) return;
        
        if (node.type === 'StringLiteral' && node.poolIndex !== undefined) {
            node.value = `_string_pool[${node.poolIndex}]`;
            node.pooled = true;
        }
        
        if (node.body) {
            node.body.forEach(child => this.updateStringReferences(child));
        }
        if (node.children) {
            node.children.forEach(child => this.updateStringReferences(child));
        }
    }

    generatePoolCode() {
        if (this.pool.length === 0) return '';
        
        const poolEntries = this.pool.map((str, index) => {
            return `_string_pool[${index}] = "${this.escapeString(str)}"`;
        }).join('\n');
        
        return `local _string_pool = {}\n${poolEntries}`;
    }

    escapeString(str) {
        return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

module.exports = { StringPoolPass };
