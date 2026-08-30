class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map();
        this.functions = new Map();
        this.children = [];
    }

    addVariable(name, node) {
        this.variables.set(name, node);
    }

    addFunction(name, node) {
        this.functions.set(name, node);
    }

    lookupVariable(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        if (this.parent) {
            return this.parent.lookupVariable(name);
        }
        return null;
    }

    lookupFunction(name) {
        if (this.functions.has(name)) {
            return this.functions.get(name);
        }
        if (this.parent) {
            return this.parent.lookupFunction(name);
        }
        return null;
    }

    createChild() {
        const child = new Scope(this);
        this.children.push(child);
        return child;
    }

    getAllVariables() {
        const vars = new Map(this.variables);
        if (this.parent) {
            const parentVars = this.parent.getAllVariables();
            for (const [key, value] of parentVars) {
                if (!vars.has(key)) {
                    vars.set(key, value);
                }
            }
        }
        return vars;
    }
}

class ScopeAnalyzer {
    constructor() {
        this.rootScope = new Scope();
        this.currentScope = this.rootScope;
    }

    analyze(ast) {
        this.analyzeNode(ast, this.rootScope);
        return this.rootScope;
    }

    analyzeNode(node, scope) {
        if (!node) return;
        
        switch (node.type) {
            case 'Program':
                this.analyzeBody(node.body, scope);
                break;
            case 'LocalDeclaration':
                for (const name of node.names) {
                    scope.addVariable(name, node);
                }
                this.analyzeBody(node.values, scope);
                break;
            case 'FunctionDeclaration':
                scope.addFunction(node.name, node);
                const functionScope = scope.createChild();
                for (const param of node.params) {
                    functionScope.addVariable(param, node);
                }
                this.analyzeBody(node.body, functionScope);
                break;
            case 'Block':
                this.analyzeBody(node.statements, scope);
                break;
            default:
                if (node.body) {
                    this.analyzeBody(node.body, scope);
                }
                if (node.children) {
                    for (const child of node.children) {
                        this.analyzeNode(child, scope);
                    }
                }
        }
    }

    analyzeBody(body, scope) {
        if (!body) return;
        for (const node of body) {
            this.analyzeNode(node, scope);
        }
    }
}

module.exports = { Scope, ScopeAnalyzer };
