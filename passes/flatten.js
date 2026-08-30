class FlattenPass {
    constructor() {
        this.flattenedFunctions = 0;
    }

    run(ast, settings = {}) {
        this.flattenedFunctions = 0;
        this.flattenNodeFunctions(ast);
        
        return {
            functions: this.flattenedFunctions
        };
    }

    flattenNodeFunctions(node) {
        if (!node) return;
        
        if (node.type === 'FunctionDeclaration' && node.body.length >= 3) {
            this.flattenFunction(node);
            this.flattenedFunctions++;
        }
        
        if (node.body) {
            node.body.forEach(child => this.flattenNodeFunctions(child));
        }
        if (node.children) {
            node.children.forEach(child => this.flattenNodeFunctions(child));
        }
    }

    flattenFunction(functionNode) {
        const stateVar = this.generateStateVar();
        const states = [];
        const body = functionNode.body;
        
        for (let i = 0; i < body.length; i++) {
            states.push({
                id: i,
                code: body[i],
                next: i + 1 < body.length ? i + 1 : null
            });
        }
        
        functionNode.flattened = {
            stateVar,
            states
        };
    }

    generateStateVar() {
        return '_' + Math.random().toString(36).substring(2, 8);
    }

    generateFlattenedCode(flattened) {
        let code = `local ${flattened.stateVar} = 0\n`;
        code += 'while true do\n';
        
        for (const state of flattened.states) {
            code += `    if ${flattened.stateVar} == ${state.id} then\n`;
            code += `        ${state.code}\n`;
            if (state.next !== null) {
                code += `        ${flattened.stateVar} = ${state.next}\n`;
            } else {
                code += '        break\n';
            }
            code += '    end\n';
        }
        
        code += 'end';
        return code;
    }
}

module.exports = { FlattenPass };
