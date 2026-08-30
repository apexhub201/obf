class ExpressionPass {
    constructor() {
        this.transformedExpressions = 0;
    }

    run(ast, settings = {}) {
        this.transformedExpressions = 0;
        this.transformNodeExpressions(ast);
        
        return {
            expressions: this.transformedExpressions
        };
    }

    transformNodeExpressions(node) {
        if (!node) return;
        
        if (node.type === 'BinaryExpression') {
            this.transformBinaryExpression(node);
            this.transformedExpressions++;
        }
        
        if (node.type === 'UnaryExpression') {
            this.transformUnaryExpression(node);
            this.transformedExpressions++;
        }
        
        if (node.body) {
            node.body.forEach(child => this.transformNodeExpressions(child));
        }
        if (node.children) {
            node.children.forEach(child => this.transformNodeExpressions(child));
        }
    }

    transformBinaryExpression(node) {
        const transformations = {
            '+': [
                (left, right) => `(${left} - (-${right}))`,
                (left, right) => `(${left} + (${right} * 1))`
            ],
            '-': [
                (left, right) => `(${left} + (-${right}))`,
                (left, right) => `(${left} - (${right} + 0))`
            ],
            '*': [
                (left, right) => `(${left} * (${right} * 1))`,
                (left, right) => `((${left} / 1) * ${right})`
            ],
            '/': [
                (left, right) => `(${left} / (${right} * 1))`,
                (left, right) => `((${left} * 1) / ${right})`
            ]
        };
        
        const ops = transformations[node.operator];
        if (ops) {
            const transform = ops[Math.floor(Math.random() * ops.length)];
            node.transformed = transform(node.left, node.right);
        }
    }

    transformUnaryExpression(node) {
        if (node.operator === 'not') {
            node.transformed = `((${node.argument}) == false)`;
        } else if (node.operator === '-') {
            node.transformed = `(0 - (${node.argument}))`;
        }
    }
}

module.exports = { ExpressionPass };
