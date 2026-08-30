class DeadCodePass {
    constructor() {
        this.deadBlocks = 0;
    }

    run(ast, settings = {}) {
        const density = settings.junkDensity || 0;
        this.deadBlocks = Math.floor(density / 20);
        
        if (this.deadBlocks > 0) {
            this.addDeadCodeToNode(ast, this.deadBlocks);
        }
        
        return {
            deadBlocks: this.deadBlocks
        };
    }

    addDeadCodeToNode(node, count) {
        if (!node || count <= 0) return;
        
        if (node.body) {
            for (let i = 0; i < count; i++) {
                const deadNode = this.generateDeadNode(i);
                node.body.push(deadNode);
            }
        }
    }

    generateDeadNode(index) {
        const deadTypes = [
            () => ({
                type: 'DeadCode',
                content: `if false then\n    local _dead${index} = ${Math.random() * 1000}\nend`
            }),
            () => ({
                type: 'DeadCode',
                content: `do\n    local _unused${index} = ${index}\nend`
            }),
            () => ({
                type: 'DeadCode',
                content: `if (${index} > ${index + 1}) then\n    local _impossible${index} = true\nend`
            }),
            () => ({
                type: 'DeadCode',
                content: `while false do\n    local _never${index} = ${index}\nend`
            }),
            () => ({
                type: 'DeadCode',
                content: `local function _unreachable${index}()\n    return ${index}\nend`
            })
        ];
        
        const generate = deadTypes[Math.floor(Math.random() * deadTypes.length)];
        return generate();
    }
}

module.exports = { DeadCodePass };
