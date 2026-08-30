class PackPass {
    constructor() {
        this.output = '';
    }

    run(code, settings = {}) {
        const level = settings.packLevel || 0;
        
        switch (level) {
            case 0:
                this.output = code;
                break;
            case 1:
                this.output = this.softPack(code);
                break;
            case 2:
                this.output = this.mediumPack(code);
                break;
            case 3:
                this.output = this.hardPack(code);
                break;
            default:
                this.output = code;
        }
        
        return this.output;
    }

    softPack(code) {
        // Remove extra blank lines
        return code.replace(/\n{3,}/g, '\n\n');
    }

    mediumPack(code) {
        // Remove extra whitespace
        return code.replace(/\n{2,}/g, '\n').trim();
    }

    hardPack(code) {
        // Aggressive minification while preserving syntax
        const lines = code.split('\n');
        const packedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
                packedLines.push(trimmed);
            }
        }
        
        return packedLines.join(' ');
    }
}

module.exports = { PackPass };
