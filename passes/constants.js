class ConstantPass {
    constructor() {
        this.transformedConstants = 0;
    }

    run(ast, settings = {}) {
        this.transformedConstants = 0;
        this.transformNodeConstants(ast);
        
        return {
            constants: this.transformedConstants
        };
    }

    transformNodeConstants(node) {
        if (!node) return;
        
        if (node.type === 'NumberLiteral') {
            const value = node.value;
            
            // Transform integer constants
            if (Number.isInteger(parseFloat(value)) && parseInt(value) > 0 && parseInt(value) < 1000) {
                node.value = this.transformInteger(parseInt(value));
                node.transformed = true;
                this.transformedConstants++;
            }
            
            // Transform decimal constants
            if (value.includes('.') && !node.transformed) {
                node.value = this.transformDecimal(value);
                node.transformed = true;
                this.transformedConstants++;
            }
        }
        
        if (node.type === 'BooleanLiteral') {
            if (node.value === true) {
                node.value = '(1 == 1)';
                node.transformed = true;
                this.transformedConstants++;
            } else if (node.value === false) {
                node.value = '(1 == 0)';
                node.transformed = true;
                this.transformedConstants++;
            }
        }
        
        if (node.body) {
            node.body.forEach(child => this.transformNodeConstants(child));
        }
        if (node.children) {
            node.children.forEach(child => this.transformNodeConstants(child));
        }
    }

    transformInteger(value) {
        const transformations = [
            `${value} + 0`,
            `${value} * 1`,
            `${value} - 0`,
            `${value} / 1`,
            `(${value - 1}) + 1`,
            `(${value + 1}) - 1`
        ];
        return transformations[Math.floor(Math.random() * transformations.length)];
    }

    transformDecimal(value) {
        const num = parseFloat(value);
        const transformations = [
            `${num} + 0.0`,
            `${num} * 1.0`,
            `${num} - 0.0`,
            `(${num - 0.1}) + 0.1`,
            `(${num + 0.1}) - 0.1`
        ];
        return transformations[Math.floor(Math.random() * transformations.length)];
    }
}

module.exports = { ConstantPass };
