class StringProtectionPass {
    constructor() {
        this.protectedStrings = new Map();
        this.counter = 0;
    }

    run(ast, settings = {}) {
        const mode = settings.stringMode || 'encoded';
        const seed = settings.seed || 12345;
        this.counter = 0;
        
        this.protectNodeStrings(ast, mode, seed);
        
        return {
            strings: this.protectedStrings.size
        };
    }

    protectNodeStrings(node, mode, seed) {
        if (!node) return;
        
        if (node.type === 'StringLiteral') {
            const originalValue = node.value;
            
            switch (mode) {
                case 'split':
                    node.value = this.splitString(originalValue);
                    break;
                case 'encoded':
                    node.value = this.encodeString(originalValue, seed);
                    node.encoded = true;
                    node.decodeFunction = 'decodeString';
                    break;
                case 'pool':
                    node.value = this.poolString(originalValue, seed);
                    node.encoded = true;
                    node.decodeFunction = 'decodePoolString';
                    break;
                case 'runtime':
                    node.value = this.runtimeString(originalValue, seed);
                    node.encoded = true;
                    node.decodeFunction = 'decodeRuntimeString';
                    break;
                case 'adaptive':
                    node.value = this.adaptiveString(originalValue, seed);
                    node.encoded = true;
                    break;
            }
            
            this.protectedStrings.set(originalValue, node.value);
            this.counter++;
        }
        
        if (node.body) {
            node.body.forEach(child => this.protectNodeStrings(child, mode, seed));
        }
        if (node.children) {
            node.children.forEach(child => this.protectNodeStrings(child, mode, seed));
        }
    }

    splitString(value) {
        if (value.length < 2) return value;
        
        const mid = Math.floor(value.length / 2);
        const left = value.substring(0, mid);
        const right = value.substring(mid);
        
        return `${left} .. "${right}"`;
    }

    encodeString(value, seed) {
        const chars = value.split('');
        const encoded = chars.map((char, index) => {
            const key = (seed + index * 7 + 13) % 256;
            return String.fromCharCode(char.charCodeAt(0) ^ key);
        }).join('');
        
        return encoded;
    }

    poolString(value, seed) {
        const index = this.counter;
        return `_string_pool[${index}]`;
    }

    runtimeString(value, seed) {
        const encoded = this.encodeString(value, seed);
        const key = this.generateRandomKey(seed);
        return `${key}_${encoded}`;
    }

    adaptiveString(value, seed) {
        if (value.length < 5) {
            return value;
        }
        if (value.length < 20) {
            return this.splitString(value);
        }
        return this.encodeString(value, seed);
    }

    generateRandomKey(seed) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 4; i++) {
            key += chars[(seed + i) % chars.length];
        }
        return key;
    }
}

module.exports = { StringProtectionPass };
