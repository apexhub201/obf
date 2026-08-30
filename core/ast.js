class ASTNode {
    constructor(type) {
        this.type = type;
        this.children = [];
        this.parent = null;
    }

    addChild(node) {
        node.parent = this;
        this.children.push(node);
        return node;
    }

    removeChild(node) {
        const index = this.children.indexOf(node);
        if (index !== -1) {
            this.children.splice(index, 1);
            node.parent = null;
        }
        return node;
    }

    traverse(callback) {
        callback(this);
        for (const child of this.children) {
            child.traverse(callback);
        }
    }
}

class Program extends ASTNode {
    constructor() {
        super('Program');
        this.body = [];
    }
}

class Block extends ASTNode {
    constructor() {
        super('Block');
        this.statements = [];
    }
}

class Identifier extends ASTNode {
    constructor(name) {
        super('Identifier');
        this.name = name;
    }
}

class StringLiteral extends ASTNode {
    constructor(value) {
        super('StringLiteral');
        this.value = value;
    }
}

class NumberLiteral extends ASTNode {
    constructor(value) {
        super('NumberLiteral');
        this.value = value;
    }
}

class BooleanLiteral extends ASTNode {
    constructor(value) {
        super('BooleanLiteral');
        this.value = value;
    }
}

class BinaryExpression extends ASTNode {
    constructor(operator, left, right) {
        super('BinaryExpression');
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

class FunctionDeclaration extends ASTNode {
    constructor(name, params, body) {
        super('FunctionDeclaration');
        this.name = name;
        this.params = params || [];
        this.body = body || [];
    }
}

class IfStatement extends ASTNode {
    constructor(condition, thenBranch, elseBranch) {
        super('IfStatement');
        this.condition = condition;
        this.thenBranch = thenBranch || [];
        this.elseBranch = elseBranch || [];
    }
}

module.exports = {
    ASTNode,
    Program,
    Block,
    Identifier,
    StringLiteral,
    NumberLiteral,
    BooleanLiteral,
    BinaryExpression,
    FunctionDeclaration,
    IfStatement
};
