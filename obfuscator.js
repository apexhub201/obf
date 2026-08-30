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
            targetRuntime: 'roblox', // 'roblox', 'luau', 'lua'
            seed: 42,
            ...options
        };
        this.globalApiNames = new Set([
            'game','workspace','script','shared','require','Instance','Vector3','CFrame','Enum',
            'Color3','BrickColor','TweenService','Players','LocalPlayer','print','warn','error',
            'pairs','ipairs','next','select','tonumber','tostring','type','rawget','rawset',
            'setmetatable','getmetatable','table','math','string','os','debug','utf8','bit32',
            'delay','spawn','wait','task','tick','time','typeof','xpcall','pcall','assert',
            'newproxy','gcinfo','collectgarbage','loadstring','load','dofile','loadfile','coroutine',
            'unpack','pack','insert','remove','concat','sort','find','sub','gsub','format','rep',
            'match','gmatch','lower','upper','len','reverse','char','byte','floor','ceil','abs',
            'random','randomseed','min','max','sqrt','exp','log','sin','cos','tan','pi','huge',
            'Vector2','Vector3int16','Vector2int16','CFrame','UDim','UDim2','Rect','Region3',
            'RaycastParams','PathfindingService','ReplicatedStorage','ServerStorage','Sound',
            'Animation','Humanoid','Part','Model','Folder','RemoteEvent','RemoteFunction','BindableEvent'
        ]);
        this.reservedWords = new Set(['and','break','do','else','elseif','end','false','for','function','if','in','local','nil','not','or','repeat','return','then','true','until','while']);
        this.varMap = new Map();
        this.funcMap = new Map();
        this.globalPreserve = this.options.preserveGlobals;
        this.apiPreserve = this.options.preserveAPI;
        this.counter = 1;
    }

    // deterministic pseudo random
    random() {
        const x = Math.sin(this.options.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateName(prefix = '_v') {
        return prefix + Math.floor(this.random() * 99999 + 1000).toString(36);
    }

    isGlobalIdentifier(name) {
        if (!this.globalPreserve) return false;
        return this.globalApiNames.has(name) || name.startsWith('_G') || name === '_G';
    }

    isApiIdentifier(name) {
        if (!this.apiPreserve) return false;
        return this.globalApiNames.has(name);
    }

    // Main obfuscation entry
    obfuscate(sourceCode) {
        if (!sourceCode || !sourceCode.trim()) throw new Error('Source code is empty');
        let code = sourceCode;

        // Tokenize and identify variables/functions
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

        // Final syntax validation (basic)
        this.validateLuaSyntax(code);
        return code;
    }

    validateLuaSyntax(code) {
        // Very basic checks: balanced quotes, brackets
        const lines = code.split('\n');
        let openBrackets = 0;
        for (let line of lines) {
            for (let ch of line) {
                if (ch === '(' || ch === '{' || ch === '[') openBrackets++;
                else if (ch === ')' || ch === '}' || ch === ']') openBrackets--;
                if (openBrackets < 0) throw new Error('Unbalanced brackets');
            }
        }
        if (openBrackets !== 0) throw new Error('Unbalanced brackets');
        return true;
    }

    renameIdentifiers(code) {
        // Simple tokenizer: find local variables and function names, rename safely
        let result = '';
        const lines = code.split('\n');
        const localVarRegex = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const funcDefRegex = /\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        
        // collect candidates
        let candidates = new Set();
        let match;
        while ((match = localVarRegex.exec(code)) !== null) {
            if (!this.isGlobalIdentifier(match[1]) && !this.isApiIdentifier(match[1])) candidates.add(match[1]);
        }
        while ((match = funcDefRegex.exec(code)) !== null) {
            if (!this.isGlobalIdentifier(match[1]) && !this.isApiIdentifier(match[1])) candidates.add(match[1]);
        }

        // assign new names
        for (let name of candidates) {
            if (!this.varMap.has(name) && !this.funcMap.has(name)) {
                const newName = this.generateName('_v');
                if (this.options.renameVariables && !this.isGlobalIdentifier(name) && !this.isApiIdentifier(name)) {
                    this.varMap.set(name, newName);
                }
                if (this.options.renameFunctions && name.match(/^[a-z]/i)) {
                    this.funcMap.set(name, '_f' + Math.floor(this.random() * 9999));
                }
            }
        }

        // replace identifiers but avoid strings
        let inString = false;
        let stringChar = '';
        let output = '';
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            if (inString) {
                output += ch;
                if (ch === stringChar) inString = false;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') {
                inString = true;
                stringChar = ch;
                output += ch;
                continue;
            }
            // simple word boundary replacement
            if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) {
                    word += code[j];
                    j++;
                }
                if (this.varMap.has(word)) {
                    output += this.varMap.get(word);
                } else if (this.funcMap.has(word)) {
                    output += this.funcMap.get(word);
                } else {
                    output += word;
                }
                i = j - 1;
            } else {
                output += ch;
            }
        }
        return output;
    }

    protectStrings(code) {
        // Replace simple string literals with concatenated escaped parts
        let result = '';
        let inString = false;
        let stringChar = '';
        let currentString = '';
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            if (inString) {
                if (ch === stringChar) {
                    inString = false;
                    const protectedStr = this.stringToConcat(currentString);
                    result += protectedStr;
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
        if (str.length < 4) return `"${str}"`; // too short
        // split into chunks and join with ..
        const chunks = [];
        for (let i = 0; i < str.length; i += 3) {
            chunks.push(`"${str.slice(i, i+3)}"`);
        }
        if (chunks.length < 2) return `"${str}"`;
        return `(${chunks.join(' .. ')})`;
    }

    transformNumbers(code) {
        // Replace simple numbers with equivalent expressions
        return code.replace(/\b(\d+)\b/g, (match, num) => {
            const n = parseInt(num);
            if (n < 5 || n > 9999) return match;
            const variant = Math.floor(this.random() * 3);
            if (variant === 0) return `(${n-1}+1)`;
            else if (variant === 1) return `(${n}*1)`;
            else return `(0+${n})`;
        });
    }

    transformControlFlow(code) {
        // Add dummy if conditions around simple lines
        let lines = code.split('\n');
        let transformed = [];
        for (let line of lines) {
            if (line.trim().startsWith('local') && this.random() > 0.6) {
                transformed.push(`if (${Math.floor(this.random()*10)} > ${Math.floor(this.random()*5)}) then`);
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
local _dead${Math.floor(this.random()*999)} = ${Math.floor(this.random()*100)}
if _dead${Math.floor(this.random()*999)} == ${Math.floor(this.random()*100)} then
  local _unused = ${Math.floor(this.random()*50)}
end
-- dead code end
`;
        return code + '\n' + deadSnippet;
    }

    minify(code) {
        // remove comments and extra whitespace
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
                if (ch === ']' && code[i-1] === ']') inBlockComment = false;
                continue;
            }
            if (ch === '-' && code[i+1] === '-') {
                if (code[i+2] === '[') { inBlockComment = true; i += 2; continue; }
                while (i < code.length && code[i] !== '\n') i++;
                continue;
            }
            result += ch;
        }
        // remove extra newlines
        result = result.replace(/\n\s*\n/g, '\n');
        return result.trim();
    }
}

// expose globally
window.LuaObfuscator = LuaObfuscator;
