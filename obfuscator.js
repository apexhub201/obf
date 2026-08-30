/**
 * APEX HUB OBFUSCATOR - Advanced Lua/Luau Obfuscation Engine
 * Version 2.0 - Real tokenizer-based transformation
 */

class LuaTokenizer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.tokens = [];
    }

    tokenize() {
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            
            // Skip whitespace
            if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
                this.pos++;
                continue;
            }
            
            // Skip comments
            if (ch === '-' && this.source[this.pos + 1] === '-') {
                this.skipComment();
                continue;
            }
            
            // String
            if (ch === '"' || ch === "'") {
                this.tokens.push(this.readString(ch));
                continue;
            }
            
            // Long string
            if (ch === '[' && this.source[this.pos + 1] === '[') {
                this.tokens.push(this.readLongString());
                continue;
            }
            
            // Number
            if (this.isDigit(ch) || (ch === '.' && this.isDigit(this.source[this.pos + 1]))) {
                this.tokens.push(this.readNumber());
                continue;
            }
            
            // Identifier or keyword
            if (this.isIdentifierStart(ch)) {
                this.tokens.push(this.readIdentifier());
                continue;
            }
            
            // Operators and punctuation
            const op = this.readOperator();
            if (op) {
                this.tokens.push(op);
                continue;
            }
            
            this.pos++;
        }
        
        return this.tokens;
    }

    skipComment() {
        this.pos += 2;
        if (this.source[this.pos] === '[') {
            // Long comment
            while (this.pos < this.source.length) {
                if (this.source[this.pos] === ']' && this.source[this.pos + 1] === ']') {
                    this.pos += 2;
                    break;
                }
                this.pos++;
            }
        } else {
            // Line comment
            while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
                this.pos++;
            }
        }
    }

    readString(quote) {
        const start = this.pos;
        this.pos++;
        let result = quote;
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            if (ch === '\\' && this.pos + 1 < this.source.length) {
                result += ch + this.source[this.pos + 1];
                this.pos += 2;
                continue;
            }
            if (ch === quote) {
                result += ch;
                this.pos++;
                break;
            }
            result += ch;
            this.pos++;
        }
        return { type: 'string', value: result, start };
    }

    readLongString() {
        const start = this.pos;
        this.pos += 2;
        let result = '[[';
        let eqCount = 0;
        while (this.pos < this.source.length && this.source[this.pos] === '=') {
            eqCount++;
            result += '=';
            this.pos++;
        }
        if (this.source[this.pos] === '[') {
            result += '[';
            this.pos++;
        }
        const endMarker = ']' + '='.repeat(eqCount) + ']';
        while (this.pos < this.source.length) {
            if (this.source.startsWith(endMarker, this.pos)) {
                result += endMarker;
                this.pos += endMarker.length;
                break;
            }
            result += this.source[this.pos];
            this.pos++;
        }
        return { type: 'long_string', value: result, start };
    }

    readNumber() {
        const start = this.pos;
        let result = '';
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            if (this.isDigit(ch) || ch === '.' || ch === 'e' || ch === 'E' || ch === '+' || ch === '-' || ch === 'x' || ch === 'X' || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
                result += ch;
                this.pos++;
            } else {
                break;
            }
        }
        return { type: 'number', value: result, start };
    }

    readIdentifier() {
        const start = this.pos;
        let result = '';
        while (this.pos < this.source.length && this.isIdentifierPart(this.source[this.pos])) {
            result += this.source[this.pos];
            this.pos++;
        }
        return { type: 'identifier', value: result, start };
    }

    readOperator() {
        const ch = this.source[this.pos];
        const twoCharOps = ['==', '~=', '<=', '>=', '..', '::', '//', '+=', '-=', '*=', '/=', '%=', '^=', '..='];
        const threeCharOps = ['...'];
        
        for (const op of threeCharOps) {
            if (this.source.startsWith(op, this.pos)) {
                this.pos += 3;
                return { type: 'operator', value: op };
            }
        }
        
        for (const op of twoCharOps) {
            if (this.source.startsWith(op, this.pos)) {
                this.pos += 2;
                return { type: 'operator', value: op };
            }
        }
        
        if ('+-*/%^#=<>(){}[];:,.'.includes(ch)) {
            this.pos++;
            return { type: 'operator', value: ch };
        }
        
        return null;
    }

    isDigit(ch) {
        return ch >= '0' && ch <= '9';
    }

    isIdentifierStart(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }

    isIdentifierPart(ch) {
        return this.isIdentifierStart(ch) || this.isDigit(ch);
    }
}

class LuaObfuscatorEngine {
    constructor(options = {}) {
        this.options = {
            renameVariables: true,
            stringProtection: true,
            stringPool: true,
            constantObfuscation: true,
            junkCode: true,
            deadCode: true,
            opaquePredicates: true,
            controlFlow: true,
            minify: true,
            packedOutput: true,
            seed: Math.floor(Math.random() * 999999),
            ...options
        };
        
        this.protectedNames = new Set([
            'game', 'workspace', 'script', 'shared', '_G', '_VERSION', 'require',
            'getfenv', 'setfenv', 'print', 'warn', 'error', 'assert', 'pcall', 'xpcall',
            'select', 'type', 'typeof', 'tostring', 'tonumber', 'pairs', 'ipairs', 'next',
            'math', 'string', 'table', 'coroutine', 'os', 'utf8',
            'Instance', 'Vector2', 'Vector3', 'CFrame', 'Color3', 'BrickColor',
            'UDim', 'UDim2', 'Ray', 'Enum', 'wait', 'task', 'spawn', 'delay',
            'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
            'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true',
            'until', 'while', 'GetService', 'Players', 'LocalPlayer', 'Character',
            'CharacterAdded', 'Connect', 'Name', 'Humanoid', 'WalkSpeed', 'Health'
        ]);
        
        this.varMap = new Map();
        this.stringPool = [];
        this.stats = {
            identifiersRenamed: 0,
            stringsProtected: 0,
            constantsTransformed: 0,
            junkBlocksAdded: 0,
            passesApplied: 0
        };
    }

    random() {
        const x = Math.sin(this.options.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateName(prefix = '_v') {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix;
        const length = Math.floor(this.random() * 6) + 3;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(this.random() * chars.length));
        }
        return result;
    }

    obfuscate(source) {
        if (!source || !source.trim()) {
            throw new Error('Source code is empty');
        }

        let code = source;
        const log = [];
        
        log.push('Analyzing source...');
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        log.push('Tokenizing...');
        
        if (this.options.renameVariables) {
            log.push('Renaming identifiers...');
            code = this.renameIdentifiers(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.stringProtection) {
            log.push('Protecting strings...');
            code = this.protectStrings(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.stringPool) {
            log.push('Building string pool...');
            code = this.buildStringPool(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.constantObfuscation) {
            log.push('Transforming constants...');
            code = this.transformConstants(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.junkCode) {
            log.push('Injecting safe junk...');
            code = this.injectJunkCode(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.deadCode) {
            log.push('Adding dead code...');
            code = this.addDeadCode(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.controlFlow) {
            log.push('Applying control flow...');
            code = this.transformControlFlow(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.minify) {
            log.push('Minifying...');
            code = this.minify(code);
            this.stats.passesApplied++;
        }
        
        if (this.options.packedOutput) {
            log.push('Packing output...');
            code = this.packOutput(code);
        }
        
        log.push('Validating output...');
        this.validateSyntax(code);
        log.push('Complete.');
        
        return {
            code,
            log,
            stats: this.stats
        };
    }

    renameIdentifiers(code) {
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        // Collect local variable names
        const localVars = new Set();
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type === 'identifier' && tokens[i].value === 'local' && i + 1 < tokens.length) {
                if (tokens[i + 1].type === 'identifier' && !this.protectedNames.has(tokens[i + 1].value)) {
                    localVars.add(tokens[i + 1].value);
                }
            }
            if (tokens[i].type === 'identifier' && tokens[i].value === 'function' && i + 1 < tokens.length) {
                if (tokens[i + 1].type === 'identifier' && !this.protectedNames.has(tokens[i + 1].value)) {
                    localVars.add(tokens[i + 1].value);
                }
            }
        }
        
        // Assign new names
        for (const varName of localVars) {
            if (!this.varMap.has(varName)) {
                const newName = this.generateName('_v');
                this.varMap.set(varName, newName);
                this.stats.identifiersRenamed++;
            }
        }
        
        // Replace identifiers
        let result = '';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === 'identifier' && this.varMap.has(token.value)) {
                result += this.varMap.get(token.value);
            } else {
                result += token.value;
            }
        }
        
        return result;
    }

    protectStrings(code) {
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        let result = '';
        for (const token of tokens) {
            if (token.type === 'string' && token.value.length > 4) {
                const content = token.value.slice(1, -1);
                if (content.length >= 3) {
                    const chunks = [];
                    const chunkSize = 2 + Math.floor(this.random() * 3);
                    for (let i = 0; i < content.length; i += chunkSize) {
                        chunks.push(content.slice(i, i + chunkSize));
                    }
                    if (chunks.length > 1) {
                        result += '(' + chunks.map(c => `"${c}"`).join(' .. ') + ')';
                        this.stats.stringsProtected++;
                        continue;
                    }
                }
                result += token.value;
            } else {
                result += token.value;
            }
        }
        
        return result;
    }

    buildStringPool(code) {
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        // Collect unique strings
        const stringSet = new Set();
        for (const token of tokens) {
            if (token.type === 'string' && token.value.length > 2) {
                const content = token.value.slice(1, -1);
                if (content.length >= 3 && !content.includes('\n')) {
                    stringSet.add(content);
                }
            }
        }
        
        if (stringSet.size === 0) return code;
        
        // Build pool
        const pool = Array.from(stringSet);
        this.stringPool = pool;
        
        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        // Create pool variable
        const poolVar = this.generateName('_pool');
        const poolCode = `local ${poolVar} = {${pool.map(s => `"${s}"`).join(',')}};\n`;
        
        // Replace strings with pool references
        let result = poolCode;
        for (const token of tokens) {
            if (token.type === 'string' && token.value.length > 2) {
                const content = token.value.slice(1, -1);
                const index = pool.indexOf(content);
                if (index !== -1) {
                    result += `${poolVar}[${index + 1}]`;
                    continue;
                }
            }
            result += token.value;
        }
        
        return result;
    }

    transformConstants(code) {
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        let result = '';
        for (const token of tokens) {
            if (token.type === 'number') {
                const num = parseFloat(token.value);
                if (Number.isInteger(num) && num > 5 && num < 9999 && !token.value.includes('.')) {
                    const variant = Math.floor(this.random() * 3);
                    if (variant === 0) {
                        result += `(${num - 1} + 1)`;
                    } else if (variant === 1) {
                        result += `(${Math.floor(num / 2)} + ${Math.ceil(num / 2)})`;
                    } else {
                        result += `(0 + ${num})`;
                    }
                    this.stats.constantsTransformed++;
                    continue;
                }
            }
            result += token.value;
        }
        
        return result;
    }

    injectJunkCode(code) {
        const junkVars = [];
        const count = Math.floor(this.random() * 3) + 2;
        
        for (let i = 0; i < count; i++) {
            const varName = this.generateName('_j');
            const value = Math.floor(this.random() * 1000);
            junkVars.push(`local ${varName} = ${value};`);
        }
        
        const junkBlock = `\n-- Junk code\n${junkVars.join('\n')}\n`;
        this.stats.junkBlocksAdded += count;
        
        return junkBlock + code;
    }

    addDeadCode(code) {
        const deadVar = this.generateName('_dead');
        const deadBlock = `
local ${deadVar} = ${Math.floor(this.random() * 100)};
if false then
    local ${this.generateName('_x')} = {};
    for i = 1, 10 do
        ${this.generateName('_x')}[i] = i * ${Math.floor(this.random() * 50)};
    end
end;
`;
        return deadBlock + code;
    }

    transformControlFlow(code) {
        // Safe control flow transformation - wrap simple statements
        const lines = code.split('\n');
        const result = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('local ') && !trimmed.includes('function') && this.random() > 0.7) {
                const predVar = this.generateName('_p');
                const predValue = Math.floor(this.random() * 100);
                result.push(`local ${predVar} = ${predValue};`);
                result.push(`if ${predVar} == ${predValue} then`);
                result.push('  ' + line);
                result.push('end;');
            } else {
                result.push(line);
            }
        }
        
        return result.join('\n');
    }

    minify(code) {
        // Remove comments
        let result = '';
        let inString = false;
        let stringChar = '';
        let inComment = false;
        
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            
            if (inString) {
                result += ch;
                if (ch === stringChar) inString = false;
                continue;
            }
            
            if (ch === '"' || ch === "'") {
                inString = true;
                stringChar = ch;
                result += ch;
                continue;
            }
            
            if (inComment) {
                if (ch === '\n') {
                    inComment = false;
                    result += ch;
                }
                continue;
            }
            
            if (ch === '-' && code[i + 1] === '-') {
                inComment = true;
                i++;
                continue;
            }
            
            result += ch;
        }
        
        // Remove extra whitespace
        result = result.replace(/\n\s*\n/g, '\n');
        result = result.replace(/[ \t]+/g, ' ');
        
        return result.trim();
    }

    packOutput(code) {
        // Convert to single line where safe
        const lines = code.split('\n').filter(l => l.trim());
        return lines.join(' ');
    }

    validateSyntax(code) {
        const tokenizer = new LuaTokenizer(code);
        const tokens = tokenizer.tokenize();
        
        // Check bracket balance
        let bracketCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (const token of tokens) {
            if (token.type === 'string') {
                continue;
            }
            
            const val = token.value;
            if (val === '(' || val === '{' || val === '[') bracketCount++;
            if (val === ')' || val === '}' || val === ']') bracketCount--;
            
            if (bracketCount < 0) {
                throw new Error(`Unbalanced brackets at position ${token.start}`);
            }
        }
        
        if (bracketCount !== 0) {
            throw new Error('Unbalanced brackets');
        }
        
        return true;
    }
}

function obfuscate(source, options = {}) {
    const engine = new LuaObfuscatorEngine(options);
    const result = engine.obfuscate(source);
    return result.code;
}

function validateLua(source) {
    const tokenizer = new LuaTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    let bracketCount = 0;
    for (const token of tokens) {
        const val = token.value;
        if (val === '(' || val === '{' || val === '[') bracketCount++;
        if (val === ')' || val === '}' || val === ']') bracketCount--;
        if (bracketCount < 0) return false;
    }
    
    return bracketCount === 0;
}

function runSelfTest() {
    const tests = [
        `print("Hello")`,
        `local x = 100\nprint(x)`,
        `local Players = game:GetService("Players")`,
        `local function add(a,b)\n    return a+b\nend\nprint(add(1,2))`,
        `local t = {\n    Name = "Test",\n    Value = 100\n}`,
        `game:GetService("Players").LocalPlayer.CharacterAdded:Connect(function(character)\n    print(character.Name)\nend)`
    ];
    
    let passed = 0;
    const results = [];
    
    for (const test of tests) {
        try {
            const output = obfuscate(test);
            if (validateLua(output)) {
                passed++;
                results.push({ input: test, output, passed: true });
            } else {
                results.push({ input: test, output, passed: false, error: 'Invalid syntax' });
            }
        } catch (e) {
            results.push({ input: test, output: null, passed: false, error: e.message });
        }
    }
    
    return {
        total: tests.length,
        passed,
        results
    };
}

window.ApexObfuscator = {
    obfuscate,
    validateLua,
    runSelfTest,
    LuaObfuscatorEngine,
    LuaTokenizer
};
