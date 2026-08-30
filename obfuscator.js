/**
 * APEX HUB OBFUSCATOR - FIXED VERSION
 * Simple but working Lua/Luau obfuscator
 */
class LuaObfuscator {
    constructor(options = {}) {
        this.options = {
            seed: Math.floor(Math.random() * 999999),
            ...options
        };
        this.varMap = new Map();
        this.funcMap = new Map();
        this.globalApiNames = new Set([
            'game', 'workspace', 'script', 'shared', 'require', 'Instance', 'Vector3', 'CFrame', 'Enum',
            'Color3', 'BrickColor', 'TweenService', 'Players', 'LocalPlayer', 'print', 'warn', 'error',
            'pairs', 'ipairs', 'next', 'select', 'tonumber', 'tostring', 'type', 'rawget', 'rawset',
            'setmetatable', 'getmetatable', 'table', 'math', 'string', 'os', 'debug', 'utf8', 'bit32',
            'delay', 'spawn', 'wait', 'task', 'tick', 'time', 'typeof', 'xpcall', 'pcall', 'assert',
            'newproxy', 'gcinfo', 'collectgarbage', 'loadstring', 'load', 'dofile', 'loadfile', 'coroutine',
            'unpack', 'pack', 'insert', 'remove', 'concat', 'sort', 'find', 'sub', 'gsub', 'format', 'rep',
            'match', 'gmatch', 'lower', 'upper', 'len', 'reverse', 'char', 'byte', 'floor', 'ceil', 'abs',
            'random', 'randomseed', 'min', 'max', 'sqrt', 'exp', 'log', 'sin', 'cos', 'tan', 'pi', 'huge',
            'Vector2', 'Vector3int16', 'Vector2int16', 'UDim', 'UDim2', 'Rect', 'Region3',
            'RaycastParams', 'PathfindingService', 'ReplicatedStorage', 'ServerStorage', 'Sound',
            'Animation', 'Humanoid', 'Part', 'Model', 'Folder', 'RemoteEvent', 'RemoteFunction', 'BindableEvent'
        ]);
        this.reservedWords = new Set(['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while']);
    }

    random() {
        const x = Math.sin(this.options.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateName(prefix) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix;
        const length = Math.floor(this.random() * 6) + 3;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(this.random() * chars.length));
        }
        return result;
    }

    isProtected(name) {
        return this.globalApiNames.has(name) || this.reservedWords.has(name) || name.startsWith('_G');
    }

    obfuscate(sourceCode) {
        if (!sourceCode || !sourceCode.trim()) {
            throw new Error('Source code is empty');
        }

        let code = sourceCode;
        
        // Step 1: Rename local variables and functions
        code = this.renameLocals(code);
        
        // Step 2: Protect strings
        code = this.protectStrings(code);
        
        // Step 3: Transform numbers
        code = this.transformNumbers(code);
        
        // Step 4: Minify
        code = this.minify(code);
        
        // Step 5: Validate
        this.validateSyntax(code);
        
        return code;
    }

    renameLocals(code) {
        const lines = code.split('\n');
        let result = [];
        
        for (let line of lines) {
            // Match local variable declarations
            const localVarRegex = /^(\s*)local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|$)/;
            const match = line.match(localVarRegex);
            
            if (match && !this.isProtected(match[2])) {
                const indent = match[1];
                const oldName = match[2];
                const newName = this.generateName('_');
                
                this.varMap.set(oldName, newName);
                
                // Replace the declaration
                line = line.replace(oldName, newName);
                
                // Replace all other occurrences in this line
                if (this.varMap.has(oldName)) {
                    line = line.replace(new RegExp('\\b' + oldName + '\\b', 'g'), newName);
                }
            }
            
            // Match function declarations
            const funcRegex = /^(\s*)function\s+([a-zA-Z_][a-zA-Z0-9_]*)/;
            const funcMatch = line.match(funcRegex);
            
            if (funcMatch && !this.isProtected(funcMatch[2])) {
                const oldName = funcMatch[2];
                const newName = this.generateName('_f');
                
                this.funcMap.set(oldName, newName);
                line = line.replace(oldName, newName);
            }
            
            // Replace mapped names in non-string parts
            line = this.replaceMappedNames(line);
            
            result.push(line);
        }
        
        return result.join('\n');
    }

    replaceMappedNames(line) {
        let result = '';
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            
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
            
            if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                let j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
                    word += line[j];
                    j++;
                }
                
                if (this.varMap.has(word)) {
                    result += this.varMap.get(word);
                } else if (this.funcMap.has(word)) {
                    result += this.funcMap.get(word);
                } else {
                    result += word;
                }
                i = j - 1;
            } else {
                result += ch;
            }
        }
        
        return result;
    }

    protectStrings(code) {
        let result = '';
        let inString = false;
        let stringChar = '';
        let currentString = '';
        
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            
            if (inString) {
                if (ch === stringChar) {
                    inString = false;
                    result += this.encodeString(currentString);
                    currentString = '';
                } else {
                    currentString += ch;
                }
                continue;
            }
            
            if (ch === '"' || ch === "'") {
                inString = true;
                stringChar = ch;
                result += ch;
                continue;
            }
            
            result += ch;
        }
        
        return result;
    }

    encodeString(str) {
        if (str.length < 4) return `"${str}"`;
        
        const chunks = [];
        const chunkSize = 2 + Math.floor(this.random() * 3);
        
        for (let i = 0; i < str.length; i += chunkSize) {
            chunks.push(`"${str.slice(i, i + chunkSize)}"`);
        }
        
        if (chunks.length < 2) return `"${str}"`;
        return `(${chunks.join(' .. ')})`;
    }

    transformNumbers(code) {
        return code.replace(/\b(\d+)\b/g, (match, num) => {
            const n = parseInt(num);
            if (n < 5 || n > 9999) return match;
            
            const variant = Math.floor(this.random() * 3);
            if (variant === 0) return `(${n - 1} + 1)`;
            else if (variant === 1) return `(${Math.floor(n / 2)} + ${Math.ceil(n / 2)})`;
            else return `(0 + ${n})`;
        });
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
        
        // Remove extra blank lines
        result = result.replace(/\n\s*\n/g, '\n');
        
        return result.trim();
    }

    validateSyntax(code) {
        // Basic validation
        const lines = code.split('\n');
        let openBrackets = 0;
        let inString = false;
        let stringChar = '';
        
        for (let line of lines) {
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                
                if (inString) {
                    if (ch === stringChar) inString = false;
                    continue;
                }
                
                if (ch === '"' || ch === "'") {
                    inString = true;
                    stringChar = ch;
                    continue;
                }
                
                if (ch === '(' || ch === '{' || ch === '[') openBrackets++;
                else if (ch === ')' || ch === '}' || ch === ']') openBrackets--;
                
                if (openBrackets < 0) throw new Error('Unbalanced brackets at line ' + (lines.indexOf(line) + 1));
            }
        }
        
        if (inString) throw new Error('Unclosed string');
        if (openBrackets !== 0) throw new Error('Unbalanced brackets');
        
        return true;
    }
}

window.LuaObfuscator = LuaObfuscator;
