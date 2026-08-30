class SymbolTable {
    constructor() {
        this.symbols = new Map();
        this.scopeStack = [new Set()];
    }

    enterScope() {
        this.scopeStack.push(new Set());
    }

    exitScope() {
        this.scopeStack.pop();
    }

    addSymbol(name, info = {}) {
        const currentScope = this.scopeStack[this.scopeStack.length - 1];
        currentScope.add(name);
        
        const fullName = this.getFullName(name);
        this.symbols.set(fullName, {
            name,
            ...info,
            scope: this.scopeStack.length - 1
        });
    }

    lookupSymbol(name) {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            const fullName = this.getFullName(name, i);
            if (this.symbols.has(fullName)) {
                return this.symbols.get(fullName);
            }
        }
        return null;
    }

    getFullName(name, scopeIndex = this.scopeStack.length - 1) {
        return `${scopeIndex}:${name}`;
    }

    isDefined(name) {
        return this.lookupSymbol(name) !== null;
    }

    getAllSymbolsInCurrentScope() {
        const currentScope = this.scopeStack[this.scopeStack.length - 1];
        const result = [];
        for (const name of currentScope) {
            const symbol = this.lookupSymbol(name);
            if (symbol) {
                result.push(symbol);
            }
        }
        return result;
    }
}

class Symbol {
    constructor(name, type, scope, node = null) {
        this.name = name;
        this.type = type;
        this.scope = scope;
        this.node = node;
        this.references = [];
        this.renamed = false;
        this.renamedTo = null;
    }

    addReference(node) {
        this.references.push(node);
    }
}

module.exports = { SymbolTable, Symbol };
