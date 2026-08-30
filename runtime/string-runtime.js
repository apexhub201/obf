class StringRuntime {
    constructor() {
        this.pool = [];
    }

    addString(str) {
        const index = this.pool.length;
        this.pool.push(str);
        return index;
    }

    generatePoolCode() {
        if (this.pool.length === 0) return '';
        
        const entries = this.pool.map((str, index) => {
            return `_string_pool[${index}] = "${this.escape(str)}"`;
        }).join('\n');
        
        return `local _string_pool = {}\n${entries}`;
    }

    generateRuntimeCode() {
        return `local function _get_string(index)
    return _string_pool[index]
end`;
    }

    escape(str) {
        return str.replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
    }
}

module.exports = { StringRuntime };
