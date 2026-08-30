class JunkPass {
    constructor() {
        this.junkBlocks = 0;
    }

    run(ast, settings = {}) {
        const density = settings.junkDensity || 0;
        this.junkBlocks = Math.floor(density / 10);
        
        if (this.junkBlocks > 0) {
            this.addJunkToNode(ast, this.junkBlocks);
        }
        
        return {
            junkBlocks: this.junkBlocks
        };
    }

    addJunkToNode(node, count) {
        if (!node || count <= 0) return;
        
        if (node.body) {
            for (let i = 0; i < count; i++) {
                const junkNode = this.generateJunkNode(i);
                node.body.push(junkNode);
            }
        }
    }

    generateJunkNode(index) {
        const junkTypes = [
            () => ({
                type: 'JunkCode',
                content: `local _junk${index} = ${Math.random() * 1000}`
            }),
            () => ({
                type: 'JunkCode',
                content: `local _temp${index} = {}`
            }),
            () => ({
                type: 'JunkCode',
                content: `local function _dummy${index}() return ${index} end`
            }),
            () => ({
                type: 'JunkCode',
                content: `local _val${index} = (${index} * ${Math.random()}) / ${index + 1}`
            }),
            () => ({
                type: 'JunkCode',
                content: `local _arr${index} = {${index}, ${index + 1}, ${index + 2}}`
            })
        ];
        
        const generate = junkTypes[Math.floor(Math.random() * junkTypes.length)];
        return generate();
    }
}

module.exports = { JunkPass };
