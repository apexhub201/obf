class ObfuscationWorker {
    constructor() {
        this.onmessage = null;
        this.onerror = null;
        this.terminated = false;
    }

    postMessage(data) {
        if (this.terminated) return;
        
        // Simulate async processing
        setTimeout(() => {
            if (!this.terminated && this.onmessage) {
                const result = this.processBuild(data);
                this.onmessage({ data: result });
            }
        }, 100);
    }

    terminate() {
        this.terminated = true;
    }

    processBuild(data) {
        const { source, settings, toggles } = data;
        
        try {
            const result = this.performBuild(source, settings, toggles);
            return { success: true, ...result };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                log: [{ stage: 'ERROR', status: 'FAILED', message: error.message }]
            };
        }
    }

    performBuild(source, settings, toggles) {
        // Tokenize source
        const tokens = this.tokenize(source);
        
        // Parse tokens into AST
        const ast = this.parse(tokens);
        
        // Analyze scope
        const scopeInfo = this.analyzeScope(ast);
        
        // Apply transformations
        const transformations = this.applyTransformations(ast, settings, toggles);
        
        // Generate code
        const output = this.generateCode(transformations.ast, settings);
        
        // Validate output
        const validation = this.validateOutput(output);
        
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Calculate stats
        const stats = this.calculateStats(source, output, transformations);
        
        // Build log
        const log = this.generateBuildLog(transformations, validation);
        
        return {
            output,
            stats,
            log
        };
    }

    tokenize(source) {
        const tokens = [];
        let pos = 0;
        
        while (pos < source.length) {
            const char = source[pos];
            
            // Skip whitespace
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
                pos++;
                continue;
            }
            
            // Skip comments
            if (char === '-' && source[pos + 1] === '-') {
                pos += 2;
                if (source[pos] === '[' && source[pos + 1] === '[') {
                    pos += 2;
                    while (pos < source.length) {
                        if (source[pos] === ']' && source[pos + 1] === ']') {
                            pos += 2;
                            break;
                        }
                        pos++;
                    }
                } else {
                    while (pos < source.length && source[pos] !== '\n') {
                        pos++;
                    }
                }
                continue;
            }
            
            // String literals
            if (char === '"' || char === "'") {
                const quote = char;
                let str = '';
                pos++;
                while (pos < source.length && source[pos] !== quote) {
                    if (source[pos] === '\\' && pos + 1 < source.length) {
                        str += source[pos];
                        str += source[pos + 1];
                        pos += 2;
                    } else {
                        str += source[pos];
                        pos++;
                    }
                }
                pos++; // Skip closing quote
                tokens.push({ type: 'STRING', value: str, raw: quote + str + quote });
                continue;
            }
            
            // Numbers
            if (char >= '0' && char <= '9') {
                let num = '';
                while (pos < source.length) {
                    const c = source[pos];
                    if (c >= '0' && c <= '9' || c === '.' || c === 'e' || c === 'E' || c === '-' || c === '+') {
                        num += c;
                        pos++;
                    } else {
                        break;
                    }
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(num), raw: num });
                continue;
            }
            
            // Identifiers and keywords
            if (char.match(/[a-zA-Z_]/)) {
                let ident = '';
                while (pos < source.length && source[pos].match(/[a-zA-Z0-9_]/)) {
                    ident += source[pos];
                    pos++;
                }
                
                if (CONFIG.LUA_KEYWORDS.includes(ident)) {
                    tokens.push({ type: 'KEYWORD', value: ident });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value: ident });
                }
                continue;
            }
            
            // Operators
            const operators = ['+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>', '=', '..', '.', ':', ',', '(', ')', '{', '}', '[', ']', ';'];
            let matched = false;
            for (const op of operators) {
                if (source.substr(pos, op.length) === op) {
                    tokens.push({ type: 'OPERATOR', value: op });
                    pos += op.length;
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                pos++;
            }
        }
        
        return tokens;
    }

    parse(tokens) {
        // Simple AST generation
        const ast = {
            type: 'Program',
            body: [],
            tokens: tokens
        };
        
        let currentBlock = ast.body;
        const blockStack = [currentBlock];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            switch (token.type) {
                case 'KEYWORD':
                    if (token.value === 'local') {
                        const node = {
                            type: 'LocalDeclaration',
                            name: tokens[i + 1]?.value || 'unknown',
                            value: tokens[i + 3]?.value || null
                        };
                        currentBlock.push(node);
                    } else if (token.value === 'function') {
                        const node = {
                            type: 'FunctionDeclaration',
                            name: tokens[i + 1]?.value || 'anonymous',
                            body: []
                        };
                        currentBlock.push(node);
                    }
                    break;
                case 'IDENTIFIER':
                    const node = {
                        type: 'Identifier',
                        name: token.value
                    };
                    currentBlock.push(node);
                    break;
            }
        }
        
        return ast;
    }

    analyzeScope(ast) {
        const scopeInfo = {
            variables: new Set(),
            functions: new Set(),
            globals: new Set()
        };
        
        // Analyze tokens
        if (ast.tokens) {
            for (let i = 0; i < ast.tokens.length; i++) {
                const token = ast.tokens[i];
                
                if (token.type === 'KEYWORD' && token.value === 'local') {
                    const nextToken = ast.tokens[i + 1];
                    if (nextToken && nextToken.type === 'IDENTIFIER') {
                        scopeInfo.variables.add(nextToken.value);
                    }
                }
                
                if (token.type === 'KEYWORD' && token.value === 'function') {
                    const nextToken = ast.tokens[i + 1];
                    if (nextToken && nextToken.type === 'IDENTIFIER') {
                        scopeInfo.functions.add(nextToken.value);
                    }
                }
            }
        }
        
        return scopeInfo;
    }

    applyTransformations(ast, settings, toggles) {
        const transformations = {
            ast,
            applied: {},
            stats: {
                varsRenamed: 0,
                paramsRenamed: 0,
                stringsProtected: 0,
                constantsTransformed: 0,
                junkBlocks: 0,
                deadBlocks: 0,
                controlFlowTransforms: 0,
                tablesTransformed: 0
            }
        };
        
        // Apply variable renaming
        if (toggles.rename && ast.tokens) {
            const renameCount = this.renameVariables(ast.tokens, settings);
            transformations.applied.rename = true;
            transformations.stats.varsRenamed = renameCount;
        }
        
        // Apply string protection
        if (toggles.strings && ast.tokens) {
            const stringCount = this.protectStrings(ast.tokens, settings);
            transformations.applied.strings = true;
            transformations.stats.stringsProtected = stringCount;
        }
        
        // Apply constant transformation
        if (toggles.constants && ast.tokens) {
            const constCount = this.transformConstants(ast.tokens, settings);
            transformations.applied.constants = true;
            transformations.stats.constantsTransformed = constCount;
        }
        
        // Apply junk code
        if (toggles.junk) {
            const junkCount = this.addJunkCode(ast, settings);
            transformations.applied.junk = true;
            transformations.stats.junkBlocks = junkCount;
        }
        
        // Apply dead code
        if (toggles.deadCode) {
            const deadCount = this.addDeadCode(ast, settings);
            transformations.applied.deadCode = true;
            transformations.stats.deadBlocks = deadCount;
        }
        
        // Apply control flow transformation
        if (toggles.controlFlow) {
            const cflowCount = this.transformControlFlow(ast, settings);
            transformations.applied.controlFlow = true;
            transformations.stats.controlFlowTransforms = cflowCount;
        }
        
        // Apply table transformation
        if (toggles.tables) {
            const tableCount = this.transformTables(ast, settings);
            transformations.applied.tables = true;
            transformations.stats.tablesTransformed = tableCount;
        }
        
        return transformations;
    }

    renameVariables(tokens, settings) {
        const variableNames = new Map();
        let count = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.type === 'KEYWORD' && token.value === 'local') {
                const nextToken = tokens[i + 1];
                if (nextToken && nextToken.type === 'IDENTIFIER') {
                    if (!CONFIG.LUA_BUILTINS.includes(nextToken.value) && 
                        !CONFIG.LUA_KEYWORDS.includes(nextToken.value)) {
                        const newName = this.generateIdentifier(settings.identStyle, count);
                        variableNames.set(nextToken.value, newName);
                        
                        // Update token
                        nextToken.value = newName;
                        nextToken.originalName = nextToken.value;
                        count++;
                    }
                }
            }
        }
        
        // Update references
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === 'IDENTIFIER' && variableNames.has(token.value)) {
                token.value = variableNames.get(token.value);
            }
        }
        
        return count;
    }

    generateIdentifier(style, index) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
        const confusingChars = 'iIlL10Oo';
        let result = '';
        
        switch (style) {
            case 'short':
                result = '_' + (index + 1);
                break;
            case 'random':
                result = '_' + this.generateRandomString(5, chars);
                break;
            case 'confusing':
                result = '_' + this.generateRandomString(6, confusingChars);
                break;
            case 'long':
                result = '_' + this.generateRandomString(10, chars);
                break;
            case 'mixed':
                result = '_' + this.generateRandomString(7, chars);
                break;
            default:
                result = '_' + this.generateRandomString(5, chars);
        }
        
        return result;
    }

    generateRandomString(length, chars) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    protectStrings(tokens, settings) {
        let count = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.type === 'STRING') {
                const protectedString = this.encodeString(token.value, settings.seed);
                token.originalValue = token.value;
                token.value = protectedString.encoded;
                token.encoded = true;
                token.decodeFunction = protectedString.function;
                count++;
            }
        }
        
        return count;
    }

    encodeString(value, seed) {
        // Simple XOR encryption for demo
        const chars = value.split('');
        const encoded = chars.map((char, index) => {
            const key = (seed + index) % 256;
            return String.fromCharCode(char.charCodeAt(0) ^ key);
        }).join('');
        
        return {
            encoded,
            function: 'decodeString'
        };
    }

    transformConstants(tokens, settings) {
        let count = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.type === 'NUMBER' && !token.transformed) {
                // Transform simple numbers to expressions
                const num = token.value;
                if (Number.isInteger(num) && num > 0 && num < 1000) {
                    token.transformed = true;
                    token.transformedValue = `${num} + 0`;
                    count++;
                }
            }
        }
        
        return count;
    }

    addJunkCode(ast, settings) {
        const junkCount = Math.floor(settings.junkDensity / 10);
        
        for (let i = 0; i < junkCount; i++) {
            if (ast.body) {
                const junkNode = {
                    type: 'JunkCode',
                    content: `local _junk${i} = ${Math.random() * 1000}`
                };
                ast.body.push(junkNode);
            }
        }
        
        return junkCount;
    }

    addDeadCode(ast, settings) {
        const deadCount = Math.floor(settings.junkDensity / 20);
        
        for (let i = 0; i < deadCount; i++) {
            if (ast.body) {
                const deadNode = {
                    type: 'DeadCode',
                    content: `if false then\n    local _dead${i} = ${Math.random() * 1000}\nend`
                };
                ast.body.push(deadNode);
            }
        }
        
        return deadCount;
    }

    transformControlFlow(ast, settings) {
        // Placeholder for control flow transformation
        return 0;
    }

    transformTables(ast, settings) {
        // Placeholder for table transformation
        return 0;
    }

    generateCode(ast, settings) {
        let code = '';
        
        // Generate code from tokens
        if (ast.tokens) {
            for (let i = 0; i < ast.tokens.length; i++) {
                const token = ast.tokens[i];
                
                switch (token.type) {
                    case 'STRING':
                        if (token.encoded) {
                            code += `decodeString("${token.value}", ${settings.seed})`;
                        } else {
                            code += token.raw;
                        }
                        break;
                    case 'NUMBER':
                        if (token.transformed) {
                            code += token.transformedValue;
                        } else {
                            code += token.raw;
                        }
                        break;
                    default:
                        code += token.value || token.raw || '';
                }
                
                // Add spaces between tokens
                if (i < ast.tokens.length - 1) {
                    const nextToken = ast.tokens[i + 1];
                    if (this.needsSpace(token, nextToken)) {
                        code += ' ';
                    }
                }
            }
        }
        
        // Add runtime helpers
        if (this.usesStringEncoding(ast)) {
            code = this.generateStringDecoder() + '\n\n' + code;
        }
        
        // Add junk code
        if (ast.body) {
            for (const node of ast.body) {
                if (node.type === 'JunkCode') {
                    code += '\n' + node.content;
                }
                if (node.type === 'DeadCode') {
                    code += '\n' + node.content;
                }
            }
        }
        
        return code;
    }

    needsSpace(token, nextToken) {
        // Keywords need space
        if (token.type === 'KEYWORD' && nextToken.type === 'IDENTIFIER') {
            return true;
        }
        
        // Operators need space around them (except some)
        if (token.type === 'OPERATOR') {
            const noSpaceOps = ['.', ':', ',', '(', ')', '[', ']', '{', '}'];
            if (!noSpaceOps.includes(token.value)) {
                return true;
            }
        }
        
        if (nextToken.type === 'OPERATOR') {
            const noSpaceOps = ['.', ':', ',', '(', ')', '[', ']', '{', '}'];
            if (!noSpaceOps.includes(nextToken.value)) {
                return true;
            }
        }
        
        return false;
    }

    usesStringEncoding(ast) {
        if (ast.tokens) {
            return ast.tokens.some(token => token.type === 'STRING' && token.encoded);
        }
        return false;
    }

    generateStringDecoder() {
        return `local function decodeString(str, seed)
    local result = {}
    for i = 1, #str do
        local char = string.sub(str, i, i)
        local key = (seed + i - 1) % 256
        local decoded = string.char(string.byte(char) ~ key)
        result[#result + 1] = decoded
    end
    return table.concat(result)
end`;
    }

    validateOutput(code) {
        // Basic validation
        if (!code || code.trim().length === 0) {
            return { valid: false, error: 'Empty output' };
        }
        
        // Check for balanced brackets
        const stack = [];
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const reverseBrackets = { ')': '(', ']': '[', '}': '{' };
        
        for (let char of code) {
            if (brackets[char]) {
                stack.push(char);
            } else if (reverseBrackets[char]) {
                if (stack.length === 0 || stack[stack.length - 1] !== reverseBrackets[char]) {
                    return { valid: false, error: 'Unbalanced brackets' };
                }
                stack.pop();
            }
        }
        
        if (stack.length > 0) {
            return { valid: false, error: 'Unclosed brackets' };
        }
        
        return { valid: true };
    }

    calculateStats(source, output, transformations) {
        return {
            originalSize: source.length,
            outputSize: output.length,
            originalLines: source.split('\n').length,
            outputLines: output.split('\n').length,
            ...transformations.stats,
            passesApplied: Object.keys(transformations.applied).length,
            passesRolledBack: 0
        };
    }

    generateBuildLog(transformations, validation) {
        const log = [];
        
        log.push({ stage: 'Analysis', status: 'PASS', message: 'Scope analysis complete' });
        
        if (transformations.applied.rename) {
            log.push({ stage: 'Rename', status: 'PASS', message: `${transformations.stats.varsRenamed} variables renamed` });
        }
        
        if (transformations.applied.strings) {
            log.push({ stage: 'Strings', status: 'PASS', message: `${transformations.stats.stringsProtected} strings protected` });
        }
        
        if (transformations.applied.constants) {
            log.push({ stage: 'Constants', status: 'PASS', message: `${transformations.stats.constantsTransformed} constants transformed` });
        }
        
        if (transformations.applied.tables) {
            log.push({ stage: 'Tables', status: 'PASS', message: `${transformations.stats.tablesTransformed} tables transformed` });
        }
        
        if (transformations.applied.junk) {
            log.push({ stage: 'Junk', status: 'PASS', message: `${transformations.stats.junkBlocks} junk blocks added` });
        }
        
        if (transformations.applied.deadCode) {
            log.push({ stage: 'Dead Code', status: 'PASS', message: `${transformations.stats.deadBlocks} dead blocks added` });
        }
        
        if (transformations.applied.controlFlow) {
            log.push({ stage: 'Control Flow', status: 'PASS', message: `${transformations.stats.controlFlowTransforms} blocks transformed` });
        }
        
        log.push({ stage: 'Validation', status: 'PASS', message: 'All validations passed' });
        
        return log;
    }
}

// Export for use in worker
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObfuscationWorker;
}
