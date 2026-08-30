class RenamePass {
    constructor() {
        this.renamedVariables = new Map();
        this.renamedFunctions = new Map();
        this.counter = 0;
    }

    run(ast, settings = {}) {
        const identStyle = settings.identStyle || 'random';
        this.counter = 0;
        
        this.renameNodeVariables(ast, identStyle);
        this.renameNodeFunctions(ast, identStyle);
        
        return {
            variables: this.renamedVariables.size,
            functions: this.renamedFunctions.size
        };
    }

    renameNodeVariables(node, identStyle) {
        if (!node) return;
        
        if (node.type === 'LocalDeclaration') {
            node.names.forEach(name => {
                if (!this.renamedVariables.has(name)) {
                    const newName = this.generateIdentifier(identStyle);
                    this.renamedVariables.set(name, newName);
                }
            });
        }
        
        if (node.type === 'FunctionDeclaration') {
            node.params.forEach(param => {
                if (!this.renamedVariables.has(param)) {
                    const newName = this.generateIdentifier(identStyle);
                    this.renamedVariables.set(param, newName);
                }
            });
        }
        
        if (node.body) {
            node.body.forEach(child => this.renameNodeVariables(child, identStyle));
        }
        if (node.children) {
            node.children.forEach(child => this.renameNodeVariables(child, identStyle));
        }
    }

    renameNodeFunctions(node, identStyle) {
        if (!node) return;
        
        if (node.type === 'FunctionDeclaration') {
            if (node.name && !this.renamedFunctions.has(node.name)) {
                const newName = this.generateIdentifier(identStyle);
                this.renamedFunctions.set(node.name, newName);
            }
        }
        
        if (node.body) {
            node.body.forEach(child => this.renameNodeFunctions(child, identStyle));
        }
        if (node.children) {
            node.children.forEach(child => this.renameNodeFunctions(child, identStyle));
        }
    }

    generateIdentifier(style) {
        this.counter++;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
        
        switch (style) {
            case 'short':
                return '_' + this.counter;
            case 'random':
                return '_' + this.generateRandomString(5, chars);
            case 'confusing':
                return '_' + this.generateRandomString(6, 'iIlL10Oo');
            case 'long':
                return '_' + this.generateRandomString(10, chars);
            case 'mixed':
                return '_' + this.generateRandomString(7, chars);
            default:
                return '_' + this.generateRandomString(5, chars);
        }
    }

    generateRandomString(length, chars) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    getRenamedName(originalName) {
        return this.renamedVariables.get(originalName) || 
               this.renamedFunctions.get(originalName) || 
               originalName;
    }
}

module.exports = { RenamePass };
