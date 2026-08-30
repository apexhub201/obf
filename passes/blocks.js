class BlockPass {
    constructor() {
        this.blocksTransformed = 0;
    }

    run(ast, settings = {}) {
        this.blocksTransformed = 0;
        this.transformNodeBlocks(ast);
        
        return {
            blocks: this.blocksTransformed
        };
    }

    transformNodeBlocks(node) {
        if (!node) return;
        
        if (node.type === 'Block' || node.type === 'DoBlock') {
            this.transformBlock(node);
            this.blocksTransformed++;
        }
        
        if (node.body) {
            node.body.forEach(child => this.transformNodeBlocks(child));
        }
        if (node.children) {
            node.children.forEach(child => this.transformNodeBlocks(child));
        }
    }

    transformBlock(blockNode) {
        if (blockNode.body && blockNode.body.length > 1) {
            // Split block into logical groups
            const statements = blockNode.body;
            const midPoint = Math.floor(statements.length / 2);
            
            blockNode.firstHalf = statements.slice(0, midPoint);
            blockNode.secondHalf = statements.slice(midPoint);
        }
    }
}

module.exports = { BlockPass };
