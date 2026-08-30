class ObfuscationError extends Error {
    constructor(message, stage = null, line = null, column = null) {
        super(message);
        this.name = 'ObfuscationError';
        this.stage = stage;
        this.line = line;
        this.column = column;
    }

    toString() {
        let result = this.name + ': ' + this.message;
        if (this.stage) {
            result += '\nStage: ' + this.stage;
        }
        if (this.line) {
            result += '\nLine: ' + this.line;
        }
        if (this.column) {
            result += '\nColumn: ' + this.column;
        }
        return result;
    }
}

class SyntaxError extends ObfuscationError {
    constructor(message, line = null, column = null) {
        super(message, 'Syntax', line, column);
        this.name = 'SyntaxError';
    }
}

class ValidationError extends ObfuscationError {
    constructor(message, stage = null, line = null, column = null) {
        super(message, stage || 'Validation', line, column);
        this.name = 'ValidationError';
    }
}

class TransformationError extends ObfuscationError {
    constructor(message, stage = null, line = null, column = null) {
        super(message, stage || 'Transformation', line, column);
        this.name = 'TransformationError';
    }
}

module.exports = {
    ObfuscationError,
    SyntaxError,
    ValidationError,
    TransformationError
};
