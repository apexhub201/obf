/**
 * APEX HUB OBFUSCATOR ENGINE
 * Advanced Lua/Luau transformer - client-side only
 */

class LuaObfuscator {
    constructor(options = {}) {
        this.options = {
            renameVariables: true,
            renameFunctions: true,
            stringProtection: true,
            constantTransform: true,
            controlFlow: true,
            deadCode: true,
            minify: true,
            preserveGlobals: true,
            preserveAPI: true,
            targetRuntime: 'roblox',
            seed: 42,
            ...options
        };
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
            'Vector2', 'Vector3int16', 'Vector2int16', 'CFrame', 'UDim', 'UDim2', 'Rect', 'Region3',
            'RaycastParams', 'PathfindingService', 'ReplicatedStorage', 'ServerStorage', 'Sound',
            'Animation', 'Humanoid', 'Part', 'Model', 'Folder', 'RemoteEvent', 'RemoteFunction', 'BindableEvent'
        ]);
        this.reservedWords = new Set(['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while']);
        this.varMap = new Map();
        this.funcMap = new Map();
        this.counter = 1;
    }

    random() {
        const x = Math.sin(this.options.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateName(prefix = '_v') {
        return prefix + Math.floor(this.random() * 99999 + 1000).toString(36);
    }

    isGlobalIdentifier(name) {
        if (!this.options.preserveGlobals) return false;
        return this.globalApiNames.has(name) || name.startsWith('_G') || name === '_G';
    }

    isApiIdentifier(name) {
        if (!this.options.preserveAPI) return false;
        return this.globalApiNames.has(name);
    }

    obfuscate(sourceCode) {
        if (!sourceCode || !sourceCode.trim()) throw new Error('Source code is empty');
        let code = sourceCode;

        if (this.options.renameVariables || this.options.renameFunctions) {
            code = this.renameIdentifiers(code);
        }

        if (this.options.stringProtection) {
            code = this.protectStrings(code);
        }

        if (this.options.constantTransform) {
            code = this.transformNumbers(code);
        }

        if (this.options.controlFlow) {
            code = this.transformControlFlow(code);
        }

        if (this.options.deadCode) {
            code = this.insertDeadCode(code);
        }

        if (this.options.minify) {
            code = this.minify(code);
        }

        this.validateLuaSyntax(code);
        return code;
    }

    validateLuaSyntax(code) {
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
                if (openBrackets < 0) throw new Error('Unbalanced brackets');
            }
        }
        if (inString) throw new Error('Unclosed string');
        if (openBrackets !== 0) throw new Error('Unbalanced brackets');
        return true;
    }

    renameIdentifiers(code) {
        let result = '';
        const localVarRegex = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const funcDefRegex = /\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        
        let candidates = new Set();
        let match;
        while ((match = localVarRegex.exec(code)) !== null) {
            if (!this.isGlobalIdentifier(match[1]) && !this.isApiIdentifier(match[1])) candidates.add(match[1]);
        }
        while ((match = funcDefRegex.exec(code)) !== null) {
            if (!this.isGlobalIdentifier(match[1]) && !this.isApiIdentifier(match[1])) candidates.add(match[1]);
        }

        for (let name of candidates) {
            if (!this.varMap.has(name) && !this.funcMap.has(name)) {
                if (this.options.renameVariables) {
                    this.varMap.set(name, this.generateName('_v'));
                }
                if (this.options.renameFunctions && name.match(/^[a-z]/i)) {
                    this.funcMap.set(name, this.generateName('_f'));
                }
            }
        }

        let inString = false;
        let stringChar = '';
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            if (inString) {
                result += ch;
                if (ch === stringChar) inString = false;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') {
                inString = true;
                stringChar = ch;
                result += ch;
                continue;
            }
            if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) {
                    word += code[j];
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
                    result += this.stringToConcat(currentString);
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

    stringToConcat(str) {
        if (str.length < 4) return `"${str}"`;
        const chunks = [];
        for (let i = 0; i < str.length; i += 3) {
            chunks.push(`"${str.slice(i, i + 3)}"`);
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
            else if (variant === 1) return `(${n} * 1)`;
            else return `(0 + ${n})`;
        });
    }

    transformControlFlow(code) {
        let lines = code.split('\n');
        let transformed = [];
        for (let line of lines) {
            if (line.trim().startsWith('local') && this.random() > 0.6) {
                transformed.push(`if (${Math.floor(this.random() * 10)} > ${Math.floor(this.random() * 5)}) then`);
                transformed.push('  ' + line);
                transformed.push('end');
            } else {
                transformed.push(line);
            }
        }
        return transformed.join('\n');
    }

    insertDeadCode(code) {
        const deadSnippet = `
-- dead code start
local _dead${Math.floor(this.random() * 999)} = ${Math.floor(this.random() * 100)}
if _dead${Math.floor(this.random() * 999)} == ${Math.floor(this.random() * 100)} then
  local _unused = ${Math.floor(this.random() * 50)}
end
-- dead code end
`;
        return code + '\n' + deadSnippet;
    }

    minify(code) {
        let result = '';
        let inBlockComment = false;
        let inString = false;
        let stringChar = '';
        
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
            if (inBlockComment) {
                if (ch === ']' && code[i - 1] === ']') inBlockComment = false;
                continue;
            }
            if (ch === '-' && code[i + 1] === '-') {
                if (code[i + 2] === '[') {
                    inBlockComment = true;
                    i += 2;
                    continue;
                }
                while (i < code.length && code[i] !== '\n') i++;
                continue;
            }
            result += ch;
        }
        result = result.replace(/\n\s*\n/g, '\n');
        return result.trim();
    }
}

window.LuaObfuscator = LuaObfuscator;
