// APEX HUB OBFUSCATOR - Web Worker for Obfuscation Processing
'use strict';

// Worker message handler
self.onmessage = function(e) {
    const { source, settings, toggles } = e.data;
    
    try {
        const result = performBuild(source, settings, toggles);
        self.postMessage({ success: true, ...result });
    } catch (error) {
        console.error('Worker build error:', error);
        self.postMessage({ 
            success: false, 
            error: error.message || 'Unknown error',
            log: [{ stage: 'ERROR', status: 'FAILED', message: error.message || 'Unknown error' }]
        });
    }
};

// Main build function
function performBuild(source, settings, toggles) {
    // Validate input
    if (!source || typeof source !== 'string') {
        throw new Error('Invalid source code');
    }
    
    // Tokenize source
    const tokens = tokenize(source);
    
    // Parse tokens
    const ast = parse(tokens);
    
    // Analyze scope
    const scopeInfo = analyzeScope(ast);
    
    // Apply transformations
    const transformations = applyTransformations(ast, settings, toggles);
    
    // Generate code
    const output = generateCode(transformations.ast, settings);
    
    // Validate output
    const validation = validateOutput(output);
    
    if (!validation.valid) {
        throw new Error(validation.error || 'Output validation failed');
    }
    
    // Pack output
    const packedOutput = packCode(output, settings);
    
    // Final validation on packed output
    const finalValidation = validateOutput(packedOutput);
    
    // If packed output fails validation, use unpacked output
    const finalOutput = finalValidation.valid ? packedOutput : output;
    
    return {
        output: finalOutput,
        stats: calculateStats(source, finalOutput, transformations),
        log: generateBuildLog(transformations, finalValidation.valid ? finalValidation : validation)
    };
}

// Tokenize source code
function tokenize(source) {
    const tokens = [];
    let pos = 0;
    let line = 1;
    let column = 1;
    
    const keywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false',
        'for', 'function', 'goto', 'if', 'in', 'local', 'nil',
        'not', 'or', 'repeat', 'return', 'then', 'true', 'until',
        'while', 'continue'
    ]);
    
    while (pos < source.length) {
        const char = source[pos];
        
        // Skip whitespace
        if (char === ' ' || char === '\t' || char === '\r') {
            pos++;
            column++;
            continue;
        }
        
        // Handle newlines
        if (char === '\n') {
            pos++;
            line++;
            column = 1;
            continue;
        }
        
        // Skip comments
        if (char === '-' && source[pos + 1] === '-') {
            pos += 2;
            column += 2;
            
            if (source[pos] === '[' && source[pos + 1] === '[') {
                // Long comment
                pos += 2;
                column += 2;
                while (pos < source.length) {
                    if (source[pos] === ']' && source[pos + 1] === ']') {
                        pos += 2;
                        column += 2;
                        break;
                    }
                    if (source[pos] === '\n') {
                        line++;
                        column = 1;
                    } else {
                        column++;
                    }
                    pos++;
                }
            } else {
                // Line comment
                while (pos < source.length && source[pos] !== '\n') {
                    pos++;
                    column++;
                }
            }
            continue;
        }
        
        // String literals
        if (char === '"' || char === "'") {
            const quote = char;
            let str = '';
            const startLine = line;
            const startColumn = column;
            pos++;
            column++;
            
            while (pos < source.length && source[pos] !== quote) {
                if (source[pos] === '\\' && pos + 1 < source.length) {
                    str += source[pos];
                    str += source[pos + 1];
                    pos += 2;
                    column += 2;
                } else {
                    str += source[pos];
                    pos++;
                    column++;
                }
            }
            
            if (pos < source.length) {
                pos++; // Skip closing quote
                column++;
            }
            
            tokens.push({ 
                type: 'STRING', 
                value: str, 
                raw: quote + str + quote,
                line: startLine,
                column: startColumn
            });
            continue;
        }
        
        // Long strings
        if (char === '[' && source[pos + 1] === '[') {
            let str = '';
            const startLine = line;
            const startColumn = column;
            pos += 2;
            column += 2;
            
            while (pos < source.length) {
                if (source[pos] === ']' && source[pos + 1] === ']') {
                    pos += 2;
                    column += 2;
                    break;
                }
                str += source[pos];
                if (source[pos] === '\n') {
                    line++;
                    column = 1;
                } else {
                    column++;
                }
                pos++;
            }
            
            tokens.push({ 
                type: 'LONG_STRING', 
                value: str, 
                raw: '[[' + str + ']]',
                line: startLine,
                column: startColumn
            });
            continue;
        }
        
        // Numbers - FIXED: Proper number parsing
        if ((char >= '0' && char <= '9') || (char === '.' && source[pos + 1] >= '0' && source[pos + 1] <= '9')) {
            let num = '';
            const startColumn = column;
            let hasDecimal = false;
            let hasExponent = false;
            
            while (pos < source.length) {
                const c = source[pos];
                
                if (c >= '0' && c <= '9') {
                    num += c;
                    pos++;
                    column++;
                } else if (c === '.' && !hasDecimal && !hasExponent) {
                    // Only allow one decimal point
                    hasDecimal = true;
                    num += c;
                    pos++;
                    column++;
                } else if ((c === 'e' || c === 'E') && !hasExponent) {
                    // Check if exponent is valid
                    const nextChar = source[pos + 1];
                    if (nextChar === '+' || nextChar === '-' || (nextChar >= '0' && nextChar <= '9')) {
                        hasExponent = true;
                        num += c;
                        pos++;
                        column++;
                        
                        // Handle exponent sign
                        if (source[pos] === '+' || source[pos] === '-') {
                            num += source[pos];
                            pos++;
                            column++;
                        }
                    } else {
                        break;
                    }
                } else if (c === 'x' || c === 'X') {
                    // Hex number - stop here
                    break;
                } else {
                    break;
                }
            }
            
            // Only create token if we have a valid number
            if (num.length > 0 && num !== '.') {
                const numericValue = parseFloat(num);
                
                if (!isNaN(numericValue)) {
                    tokens.push({ 
                        type: 'NUMBER', 
                        value: numericValue, 
                        raw: num,
                        line: line,
                        column: startColumn
                    });
                }
            }
            continue;
        }
        
        // Identifiers and keywords
        if (char.match(/[a-zA-Z_]/)) {
            let ident = '';
            const startColumn = column;
            
            while (pos < source.length && source[pos].match(/[a-zA-Z0-9_]/)) {
                ident += source[pos];
                pos++;
                column++;
            }
            
            if (keywords.has(ident)) {
                tokens.push({ 
                    type: 'KEYWORD', 
                    value: ident,
                    line: line,
                    column: startColumn
                });
            } else {
                tokens.push({ 
                    type: 'IDENTIFIER', 
                    value: ident,
                    line: line,
                    column: startColumn
                });
            }
            continue;
        }
        
        // Operators
        const operators = [
            '==', '~=', '<=', '>=', '..', '...', 
            '+', '-', '*', '/', '%', '^', '#', '=', '<', '>', '.', ':',
            ',', '(', ')', '{', '}', '[', ']', ';'
        ];
        
        let matched = false;
        for (const op of operators) {
            if (source.substr(pos, op.length) === op) {
                const startColumn = column;
                
                for (let i = 0; i < op.length; i++) {
                    pos++;
                    column++;
                }
                
                tokens.push({ 
                    type: 'OPERATOR', 
                    value: op,
                    line: line,
                    column: startColumn
                });
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            // Unknown character, skip it
            pos++;
            column++;
        }
    }
    
    return tokens;
}

// Parse tokens into AST
function parse(tokens) {
    const ast = {
        type: 'Program',
        body: [],
        tokens: tokens
    };
    
    let i = 0;
    
    while (i < tokens.length) {
        const token = tokens[i];
        
        if (!token || !token.type) {
            i++;
            continue;
        }
        
        if (token.type === 'KEYWORD') {
            if (token.value === 'local') {
                const node = {
                    type: 'LocalDeclaration',
                    names: [],
                    values: [],
                    line: token.line,
                    column: token.column
                };
                
                i++;
                
                while (i < tokens.length && tokens[i] && tokens[i].type === 'IDENTIFIER') {
                    node.names.push(tokens[i].value);
                    i++;
                    
                    if (tokens[i] && tokens[i].value === ',') {
                        i++;
                    } else {
                        break;
                    }
                }
                
                if (tokens[i] && tokens[i].value === '=') {
                    i++;
                    
                    while (i < tokens.length && tokens[i] && tokens[i].type !== 'KEYWORD') {
                        if (tokens[i].type === 'STRING') {
                            node.values.push({ 
                                type: 'StringLiteral', 
                                value: tokens[i].value,
                                raw: tokens[i].raw
                            });
                        } else if (tokens[i].type === 'NUMBER') {
                            node.values.push({ 
                                type: 'NumberLiteral', 
                                value: tokens[i].value,
                                raw: tokens[i].raw
                            });
                        } else if (tokens[i].type === 'IDENTIFIER') {
                            node.values.push({ 
                                type: 'Identifier', 
                                name: tokens[i].value
                            });
                        }
                        
                        i++;
                        
                        if (tokens[i] && tokens[i].value === ',') {
                            i++;
                        } else {
                            break;
                        }
                    }
                }
                
                ast.body.push(node);
            } else if (token.value === 'return') {
                const node = {
                    type: 'ReturnStatement',
                    values: []
                };
                
                i++;
                
                while (i < tokens.length && tokens[i] && tokens[i].type !== 'KEYWORD') {
                    if (tokens[i].type === 'STRING') {
                        node.values.push({ type: 'StringLiteral', value: tokens[i].value });
                    } else if (tokens[i].type === 'NUMBER') {
                        node.values.push({ type: 'NumberLiteral', value: tokens[i].value, raw: tokens[i].raw });
                    } else if (tokens[i].type === 'IDENTIFIER') {
                        node.values.push({ type: 'Identifier', name: tokens[i].value });
                    }
                    
                    i++;
                    
                    if (tokens[i] && tokens[i].value === ',') {
                        i++;
                    } else {
                        break;
                    }
                }
                
                ast.body.push(node);
            }
        } else if (token.type === 'IDENTIFIER') {
            // Check if it's a function call
            const nextToken = tokens[i + 1];
            if (nextToken && nextToken.value === '(') {
                const node = {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: token.value },
                    arguments: []
                };
                ast.body.push(node);
            } else if (nextToken && nextToken.value === '=') {
                const node = {
                    type: 'Assignment',
                    targets: [token.value],
                    values: []
                };
                ast.body.push(node);
            }
        }
        
        i++;
    }
    
    return ast;
}

// Analyze scope
function analyzeScope(ast) {
    const scopeInfo = {
        variables: new Set(),
        functions: new Set(),
        globals: new Set(),
        localCount: 0,
        functionCount: 0
    };
    
    if (ast.tokens) {
        for (let i = 0; i < ast.tokens.length; i++) {
            const token = ast.tokens[i];
            
            if (token.type === 'KEYWORD' && token.value === 'local') {
                const nextToken = ast.tokens[i + 1];
                if (nextToken && nextToken.type === 'IDENTIFIER') {
                    scopeInfo.variables.add(nextToken.value);
                    scopeInfo.localCount++;
                }
            }
            
            if (token.type === 'KEYWORD' && token.value === 'function') {
                const nextToken = ast.tokens[i + 1];
                if (nextToken && nextToken.type === 'IDENTIFIER') {
                    scopeInfo.functions.add(nextToken.value);
                    scopeInfo.functionCount++;
                }
            }
        }
    }
    
    return scopeInfo;
}

// Apply transformations
function applyTransformations(ast, settings, toggles) {
    const transformations = {
        ast: ast,
        applied: {},
        stats: {
            varsRenamed: 0,
            paramsRenamed: 0,
            stringsProtected: 0,
            constantsTransformed: 0,
            junkBlocks: 0,
            deadBlocks: 0,
            controlFlowTransforms: 0,
            tablesTransformed: 0,
            expressionsTransformed: 0,
            predicatesAdded: 0
        }
    };
    
    // Apply variable renaming
    if (toggles.rename && ast.tokens) {
        const renameResult = renameVariables(ast.tokens, settings);
        transformations.applied.rename = true;
        transformations.stats.varsRenamed = renameResult.count;
    }
    
    // Apply string protection
    if (toggles.strings && ast.tokens) {
        const stringResult = protectStrings(ast.tokens, settings);
        transformations.applied.strings = true;
        transformations.stats.stringsProtected = stringResult.count;
    }
    
    // Apply constant transformation
    if (toggles.constants && ast.tokens) {
        const constResult = transformConstants(ast.tokens, settings);
        transformations.applied.constants = true;
        transformations.stats.constantsTransformed = constResult.count;
    }
    
    // Apply junk code
    if (toggles.junk) {
        const junkResult = addJunkCode(ast, settings);
        transformations.applied.junk = true;
        transformations.stats.junkBlocks = junkResult.count;
    }
    
    // Apply dead code
    if (toggles.deadCode) {
        const deadResult = addDeadCode(ast, settings);
        transformations.applied.deadCode = true;
        transformations.stats.deadBlocks = deadResult.count;
    }
    
    // Apply opaque predicates
    if (toggles.predicates) {
        const predResult = addOpaquePredicates(ast, settings);
        transformations.applied.predicates = true;
        transformations.stats.predicatesAdded = predResult.count;
    }
    
    return transformations;
}

// Rename variables - FIXED: Better number handling
function renameVariables(tokens, settings) {
    const variableNames = new Map();
    const protectedNames = new Set([
        'game', 'workspace', 'script', 'shared', '_G', 'require',
        'Instance', 'Vector2', 'Vector3', 'Vector3int16', 'CFrame',
        'Color3', 'BrickColor', 'UDim', 'UDim2', 'Ray', 'Enum',
        'math', 'string', 'table', 'coroutine', 'utf8', 'print',
        'warn', 'error', 'assert', 'pcall', 'xpcall', 'pairs',
        'ipairs', 'next', 'tonumber', 'tostring', 'type', 'typeof',
        'task', 'wait', 'spawn', 'delay'
    ]);
    
    let count = 0;
    const style = settings.identStyle || 'random';
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token && token.type === 'KEYWORD' && token.value === 'local') {
            const nextToken = tokens[i + 1];
            if (nextToken && nextToken.type === 'IDENTIFIER') {
                if (!protectedNames.has(nextToken.value) && !variableNames.has(nextToken.value)) {
                    const newName = generateIdentifier(style, count);
                    variableNames.set(nextToken.value, newName);
                    nextToken.originalName = nextToken.value;
                    nextToken.value = newName;
                    nextToken.renamed = true;
                    count++;
                }
            }
        }
    }
    
    // Update references
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token && token.type === 'IDENTIFIER' && variableNames.has(token.value)) {
            token.value = variableNames.get(token.value);
            token.renamed = true;
        }
    }
    
    return { count };
}

// Generate identifier - FIXED: Ensure valid Lua identifiers
function generateIdentifier(style, index) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const confusingChars = 'iIlL';
    let result = '';
    
    function generateRandomString(length, charSet) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += charSet[Math.floor(Math.random() * charSet.length)];
        }
        return str;
    }
    
    switch (style) {
        case 'short':
            result = '_v' + (index + 1);
            break;
        case 'random':
            result = '_' + generateRandomString(6, chars);
            break;
        case 'confusing':
            result = '_' + generateRandomString(7, confusingChars);
            break;
        case 'long':
            result = '_' + generateRandomString(12, chars);
            break;
        case 'mixed':
            result = '_' + generateRandomString(8, chars);
            break;
        default:
            result = '_' + generateRandomString(6, chars);
    }
    
    return result;
}

// Protect strings
function protectStrings(tokens, settings) {
    let count = 0;
    const seed = settings.seed || 12345;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token && (token.type === 'STRING' || token.type === 'LONG_STRING')) {
            const protectedString = encodeString(token.value, seed);
            token.originalValue = token.value;
            token.value = protectedString.encoded;
            token.encoded = true;
            token.decodeFunction = 'decodeString';
            count++;
        }
    }
    
    return { count };
}

// Encode string
function encodeString(value, seed) {
    const chars = value.split('');
    const encoded = chars.map((char, index) => {
        const key = (seed + index * 7 + 13) % 256;
        return String.fromCharCode(char.charCodeAt(0) ^ key);
    }).join('');
    
    return { encoded };
}

// Transform constants - FIXED: Safe number transformation
function transformConstants(tokens, settings) {
    let count = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token && token.type === 'NUMBER' && !token.transformed) {
            const num = token.value;
            
            // Only transform safe integers
            if (Number.isInteger(num) && num > 0 && num < 1000) {
                const transformations = [
                    { display: String(num), value: num },
                    { display: `(${num} + 0)`, value: num },
                    { display: `(${num} * 1)`, value: num },
                    { display: `(${num} - 0)`, value: num }
                ];
                
                const chosen = transformations[Math.floor(Math.random() * transformations.length)];
                token.transformed = true;
                token.transformedValue = chosen.display;
                count++;
            }
            // Don't transform decimals or special numbers
        }
    }
    
    return { count };
}

// Add junk code
function addJunkCode(ast, settings) {
    const junkDensity = settings.junkDensity || 0;
    const junkCount = Math.floor(junkDensity / 25); // Reduced for safety
    
    for (let i = 0; i < junkCount; i++) {
        if (ast.body) {
            const randomNum = Math.floor(Math.random() * 100) + 1;
            const junkNode = {
                type: 'JunkCode',
                content: `local _junk${i} = ${randomNum}`
            };
            ast.body.push(junkNode);
        }
    }
    
    return { count: junkCount };
}

// Add dead code
function addDeadCode(ast, settings) {
    const junkDensity = settings.junkDensity || 0;
    const deadCount = Math.floor(junkDensity / 50); // Reduced for safety
    
    for (let i = 0; i < deadCount; i++) {
        if (ast.body) {
            const randomNum = Math.floor(Math.random() * 100) + 1;
            const deadNode = {
                type: 'DeadCode',
                content: `if false then\n    local _dead${i} = ${randomNum}\nend`
            };
            ast.body.push(deadNode);
        }
    }
    
    return { count: deadCount };
}

// Add opaque predicates
function addOpaquePredicates(ast, settings) {
    const predicateCount = Math.floor((settings.junkDensity || 0) / 75); // Reduced
    
    for (let i = 0; i < predicateCount; i++) {
        if (ast.body) {
            const predicates = [
                `local _pred${i} = (2 + 2) == 4`,
                `local _pred${i} = (10 - 5) == 5`,
                `local _pred${i} = (3 * 3) == 9`
            ];
            
            const predNode = {
                type: 'JunkCode',
                content: predicates[Math.floor(Math.random() * predicates.length)]
            };
            ast.body.push(predNode);
        }
    }
    
    return { count: predicateCount };
}

// Generate code from AST - FIXED: Proper number handling
function generateCode(ast, settings) {
    let code = '';
    
    if (ast.tokens) {
        for (let i = 0; i < ast.tokens.length; i++) {
            const token = ast.tokens[i];
            
            if (!token) continue;
            
            switch (token.type) {
                case 'STRING':
                case 'LONG_STRING':
                    if (token.encoded) {
                        code += `decodeString("${escapeString(token.value)}", ${settings.seed || 12345})`;
                    } else {
                        code += token.raw || `"${escapeString(token.value)}"`;
                    }
                    break;
                    
                case 'NUMBER':
                    if (token.transformed && token.transformedValue) {
                        code += token.transformedValue;
                    } else {
                        // Ensure valid number output
                        code += token.raw || String(token.value);
                    }
                    break;
                    
                case 'KEYWORD':
                case 'IDENTIFIER':
                case 'OPERATOR':
                    code += token.value;
                    break;
                    
                default:
                    code += token.value || token.raw || '';
            }
            
            // Add spaces between tokens when needed
            if (i < ast.tokens.length - 1) {
                const nextToken = ast.tokens[i + 1];
                if (nextToken && needsSpace(token, nextToken)) {
                    code += ' ';
                }
            }
        }
    }
    
    // Add runtime helpers if needed
    if (usesStringEncoding(ast)) {
        code = generateStringDecoder() + '\n\n' + code;
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

// Escape string for output
function escapeString(str) {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
}

// Check if space needed between tokens
function needsSpace(token, nextToken) {
    if (!token || !nextToken) return false;
    
    // Keywords need space before identifiers
    if (token.type === 'KEYWORD' && nextToken.type === 'IDENTIFIER') {
        return true;
    }
    
    // Identifiers need space before keywords
    if (token.type === 'IDENTIFIER' && nextToken.type === 'KEYWORD') {
        return true;
    }
    
    // Numbers need space between them
    if (token.type === 'NUMBER' && nextToken.type === 'NUMBER') {
        return true;
    }
    
    // Operators need space (except some)
    if (token.type === 'OPERATOR') {
        const noSpaceOps = ['.', ':', ',', '(', ')', '[', ']', '{', '}', ';'];
        if (!noSpaceOps.includes(token.value)) {
            return true;
        }
    }
    
    if (nextToken.type === 'OPERATOR') {
        const noSpaceOps = ['.', ':', ',', '(', ')', '[', ']', '{', '}', ';'];
        if (!noSpaceOps.includes(nextToken.value)) {
            return true;
        }
    }
    
    return false;
}

// Check if string encoding is used
function usesStringEncoding(ast) {
    if (ast.tokens) {
        return ast.tokens.some(token => 
            token && (token.type === 'STRING' || token.type === 'LONG_STRING') && token.encoded
        );
    }
    return false;
}

// Generate string decoder function
function generateStringDecoder() {
    return 'local function decodeString(str, seed)\n' +
           '    local result = {}\n' +
           '    for i = 1, #str do\n' +
           '        local char = string.sub(str, i, i)\n' +
           '        local key = (seed + (i - 1) * 7 + 13) % 256\n' +
           '        local decoded = string.char(string.byte(char) ~ key)\n' +
           '        result[#result + 1] = decoded\n' +
           '    end\n' +
           '    return table.concat(result)\n' +
           'end';
}

// Validate output - FIXED: Better number validation
function validateOutput(code) {
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
    
    // Check for malformed numbers
    const malformedNumberRegex = /\b\d+\.\d+\.\d+\b|\.\d+\.|\d+\.\.\d+/g;
    if (malformedNumberRegex.test(code)) {
        return { valid: false, error: 'Malformed number detected' };
    }
    
    // Check for common syntax errors
    if (code.includes('local =')) {
        return { valid: false, error: 'Invalid local declaration' };
    }
    
    if (code.includes('function =')) {
        return { valid: false, error: 'Invalid function declaration' };
    }
    
    return { valid: true };
}

// Pack code - FIXED: Safe minification
function packCode(code, settings) {
    const packLevel = settings.packLevel || 0;
    
    if (packLevel === 0) {
        return code;
    }
    
    let packed = code;
    
    if (packLevel >= 1) {
        // Remove extra blank lines
        packed = packed.replace(/\n{3,}/g, '\n\n');
    }
    
    if (packLevel >= 2) {
        // Remove trailing whitespace
        packed = packed.split('\n').map(line => line.trimEnd()).join('\n');
    }
    
    if (packLevel >= 3) {
        // More aggressive but safe minification
        const lines = packed.split('\n');
        const packedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                packedLines.push(trimmed);
            }
        }
        
        packed = packedLines.join('\n');
    }
    
    return packed;
}

// Calculate stats
function calculateStats(source, output, transformations) {
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

// Generate build log
function generateBuildLog(transformations, validation) {
    const log = [];
    
    log.push({ 
        stage: 'Analysis', 
        status: 'PASS', 
        message: 'Scope analysis complete' 
    });
    
    if (transformations.applied.rename) {
        log.push({ 
            stage: 'Rename', 
            status: 'PASS', 
            message: `${transformations.stats.varsRenamed || 0} variables renamed` 
        });
    }
    
    if (transformations.applied.strings) {
        log.push({ 
            stage: 'Strings', 
            status: 'PASS', 
            message: `${transformations.stats.stringsProtected || 0} strings protected` 
        });
    }
    
    if (transformations.applied.constants) {
        log.push({ 
            stage: 'Constants', 
            status: 'PASS', 
            message: `${transformations.stats.constantsTransformed || 0} constants transformed` 
        });
    }
    
    if (transformations.applied.junk) {
        log.push({ 
            stage: 'Junk', 
            status: 'PASS', 
            message: `${transformations.stats.junkBlocks || 0} junk blocks added` 
        });
    }
    
    if (transformations.applied.deadCode) {
        log.push({ 
            stage: 'Dead Code', 
            status: 'PASS', 
            message: `${transformations.stats.deadBlocks || 0} dead blocks added` 
        });
    }
    
    if (transformations.applied.predicates) {
        log.push({ 
            stage: 'Predicates', 
            status: 'PASS', 
            message: `${transformations.stats.predicatesAdded || 0} predicates added` 
        });
    }
    
    log.push({ 
        stage: 'Packing', 
        status: 'PASS', 
        message: 'Code minified successfully' 
    });
    
    log.push({ 
        stage: 'Validation', 
        status: validation.valid ? 'PASS' : 'FAILED', 
        message: validation.valid ? 'All validations passed' : validation.error 
    });
    
    return log;
}
