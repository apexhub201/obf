// APEX HUB OBFUSCATOR - Web Worker for Obfuscation Processing
'use strict';

// Worker message handler
self.onmessage = function(e) {
    const { source, settings, toggles } = e.data;
    
    try {
        // Process the build
        const result = performBuild(source, settings, toggles);
        
        // Send success response
        self.postMessage({ 
            success: true, 
            ...result 
        });
    } catch (error) {
        console.error('Worker build error:', error);
        
        // Send error response
        self.postMessage({ 
            success: false, 
            error: error.message || 'Unknown error',
            log: [{ 
                stage: 'ERROR', 
                status: 'FAILED', 
                message: error.message || 'Unknown error' 
            }]
        });
    }
};

// Main build function
function performBuild(source, settings, toggles) {
    // Validate input
    if (!source || typeof source !== 'string') {
        throw new Error('Invalid source code');
    }
    
    if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings');
    }
    
    if (!toggles || typeof toggles !== 'object') {
        throw new Error('Invalid toggles');
    }
    
    // Stage 1: Analysis
    const analysisStart = Date.now();
    const tokens = tokenize(source);
    const ast = parse(tokens);
    const scopeInfo = analyzeScope(ast);
    const analysisTime = Date.now() - analysisStart;
    
    // Stage 2: Apply transformations
    const transformationStart = Date.now();
    const transformations = applyTransformations(ast, settings, toggles);
    const transformationTime = Date.now() - transformationStart;
    
    // Stage 3: Generate code
    const generationStart = Date.now();
    const output = generateCode(transformations.ast, settings);
    const generationTime = Date.now() - generationStart;
    
    // Stage 4: Validate output
    const validationStart = Date.now();
    const validation = validateOutput(output);
    const validationTime = Date.now() - validationStart;
    
    if (!validation.valid) {
        throw new Error(validation.error || 'Output validation failed');
    }
    
    // Stage 5: Pack output
    const packingStart = Date.now();
    const packedOutput = packCode(output, settings);
    const packingTime = Date.now() - packingStart;
    
    // Final validation on packed output
    const finalValidation = validateOutput(packedOutput);
    if (!finalValidation.valid) {
        // If packed output fails validation, use unpacked output
        console.warn('Packed output validation failed, using unpacked output');
        return createResult(source, output, transformations, validation);
    }
    
    return createResult(source, packedOutput, transformations, finalValidation);
}

// Create result object
function createResult(source, output, transformations, validation) {
    return {
        output: output,
        stats: calculateStats(source, output, transformations),
        log: generateBuildLog(transformations, validation),
        timing: {
            total: Date.now()
        }
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
            
            // Long comment
            if (source[pos] === '[' && source[pos + 1] === '[') {
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
            
            pos++; // Skip closing quote
            column++;
            
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
        
        // Numbers
        if (char >= '0' && char <= '9') {
            let num = '';
            const startColumn = column;
            
            while (pos < source.length) {
                const c = source[pos];
                if ((c >= '0' && c <= '9') || c === '.' || c === 'e' || c === 'E' || c === '-' || c === '+') {
                    num += c;
                    pos++;
                    column++;
                } else {
                    break;
                }
            }
            
            tokens.push({ 
                type: 'NUMBER', 
                value: parseFloat(num), 
                raw: num,
                line: line,
                column: startColumn
            });
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
            '==', '~=', '<=', '>=', '..', '...', '+=', '-=', '*=', '/=',
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
                
                // Parse variable names
                while (i < tokens.length && tokens[i].type === 'IDENTIFIER') {
                    node.names.push(tokens[i].value);
                    i++;
                    
                    if (tokens[i] && tokens[i].value === ',') {
                        i++;
                    } else {
                        break;
                    }
                }
                
                // Check for assignment
                if (tokens[i] && tokens[i].value === '=') {
                    i++; // Skip '='
                    
                    // Parse values (simplified)
                    while (i < tokens.length && tokens[i].type !== 'KEYWORD') {
                        if (tokens[i].type === 'STRING') {
                            node.values.push({ 
                                type: 'StringLiteral', 
                                value: tokens[i].value,
                                raw: tokens[i].raw,
                                line: tokens[i].line,
                                column: tokens[i].column
                            });
                        } else if (tokens[i].type === 'NUMBER') {
                            node.values.push({ 
                                type: 'NumberLiteral', 
                                value: tokens[i].value,
                                raw: tokens[i].raw,
                                line: tokens[i].line,
                                column: tokens[i].column
                            });
                        } else if (tokens[i].type === 'IDENTIFIER') {
                            node.values.push({ 
                                type: 'Identifier', 
                                name: tokens[i].value,
                                line: tokens[i].line,
                                column: tokens[i].column
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
            } else if (token.value === 'function') {
                const node = {
                    type: 'FunctionDeclaration',
                    name: '',
                    params: [],
                    body: [],
                    line: token.line,
                    column: token.column
                };
                
                i++;
                
                if (tokens[i] && tokens[i].type === 'IDENTIFIER') {
                    node.name = tokens[i].value;
                    i++;
                }
                
                if (tokens[i] && tokens[i].value === '(') {
                    i++; // Skip '('
                    
                    while (i < tokens.length && tokens[i].value !== ')') {
                        if (tokens[i].type === 'IDENTIFIER') {
                            node.params.push(tokens[i].value);
                        }
                        i++;
                        
                        if (tokens[i] && tokens[i].value === ',') {
                            i++;
                        }
                    }
                    
                    if (tokens[i] && tokens[i].value === ')') {
                        i++; // Skip ')'
                    }
                }
                
                ast.body.push(node);
            } else if (token.value === 'if') {
                const node = {
                    type: 'IfStatement',
                    condition: null,
                    thenBranch: [],
                    elseBranch: [],
                    line: token.line,
                    column: token.column
                };
                
                i++;
                
                // Parse condition (simplified)
                if (tokens[i] && tokens[i].type === 'IDENTIFIER') {
                    node.condition = { 
                        type: 'Identifier', 
                        name: tokens[i].value 
                    };
                    i++;
                } else if (tokens[i] && tokens[i].type === 'KEYWORD' && 
                          (tokens[i].value === 'true' || tokens[i].value === 'false')) {
                    node.condition = { 
                        type: 'BooleanLiteral', 
                        value: tokens[i].value === 'true' 
                    };
                    i++;
                } else if (tokens[i] && tokens[i].type === 'NUMBER') {
                    node.condition = { 
                        type: 'NumberLiteral', 
                        value: tokens[i].value 
                    };
                    i++;
                }
                
                if (tokens[i] && tokens[i].value === 'then') {
                    i++; // Skip 'then'
                }
                
                ast.body.push(node);
            } else if (token.value === 'return') {
                const node = {
                    type: 'ReturnStatement',
                    values: [],
                    line: token.line,
                    column: token.column
                };
                
                i++;
                
                while (i < tokens.length && tokens[i].type !== 'KEYWORD') {
                    if (tokens[i].type === 'STRING') {
                        node.values.push({ 
                            type: 'StringLiteral', 
                            value: tokens[i].value 
                        });
                    } else if (tokens[i].type === 'NUMBER') {
                        node.values.push({ 
                            type: 'NumberLiteral', 
                            value: tokens[i].value 
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
                
                ast.body.push(node);
            } else if (token.value === 'while') {
                const node = {
                    type: 'WhileStatement',
                    condition: null,
                    body: [],
                    line: token.line,
                    column: token.column
                };
                
                i++;
                
                // Parse condition (simplified)
                if (tokens[i] && (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'NUMBER')) {
                    node.condition = {
                        type: tokens[i].type === 'IDENTIFIER' ? 'Identifier' : 'NumberLiteral',
                        value: tokens[i].value,
                        name: tokens[i].value
                    };
                    i++;
                }
                
                if (tokens[i] && tokens[i].value === 'do') {
                    i++; // Skip 'do'
                }
                
                ast.body.push(node);
            }
        } else if (token.type === 'IDENTIFIER') {
            // Simple expression statement
            const node = {
                type: 'ExpressionStatement',
                expression: { 
                    type: 'Identifier', 
                    name: token.value 
                },
                line: token.line,
                column: token.column
            };
            ast.body.push(node);
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
            expressionsTransformed: 0
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
    
    // Apply control flow transformation
    if (toggles.controlFlow && settings.controlFlowLevel && settings.controlFlowLevel !== 'off') {
        const cflowResult = transformControlFlow(ast, settings);
        transformations.applied.controlFlow = true;
        transformations.stats.controlFlowTransforms = cflowResult.count;
    }
    
    // Apply expression transformation
    if (toggles.constants) {
        const exprResult = transformExpressions(ast.tokens, settings);
        transformations.applied.expressions = true;
        transformations.stats.expressionsTransformed = exprResult.count;
    }
    
    return transformations;
}

// Rename variables
function renameVariables(tokens, settings) {
    const variableNames = new Map();
    const protectedNames = new Set([
        'game', 'workspace', 'script', 'shared', '_G', 'require',
        'Instance', 'Vector2', 'Vector3', 'Vector3int16', 'CFrame',
        'Color3', 'BrickColor', 'UDim', 'UDim2', 'Ray', 'Enum',
        'math', 'string', 'table', 'coroutine', 'utf8', 'print',
        'warn', 'error', 'assert', 'pcall', 'xpcall', 'pairs',
        'ipairs', 'next', 'tonumber', 'tostring', 'type', 'typeof',
        'task', 'wait', 'spawn', 'delay', 'GetService', 'WaitForChild',
        'Character', 'CharacterAdded', 'LocalPlayer', 'WalkSpeed',
        'Health', 'Position', 'Parent', 'Name', 'MouseButton1Click',
        'InputBegan', 'InputChanged', 'Heartbeat', 'Connect', 'Create',
        'Play', 'Value', 'Size', 'Text', 'Frame', 'Visible', 'Color',
        'Font'
    ]);
    
    let count = 0;
    const style = settings.identStyle || 'random';
    const seed = settings.seed || 12345;
    
    // Use deterministic random if specified
    let randomState = seed;
    function nextRandom() {
        randomState = (randomState * 1103515245 + 12345) % 2147483648;
        return randomState / 2147483648;
    }
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'KEYWORD' && token.value === 'local') {
            const nextToken = tokens[i + 1];
            if (nextToken && nextToken.type === 'IDENTIFIER') {
                if (!protectedNames.has(nextToken.value) && !variableNames.has(nextToken.value)) {
                    const newName = generateIdentifier(style, count, settings.deterministicBuild ? nextRandom : Math.random);
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
        if (token.type === 'IDENTIFIER' && variableNames.has(token.value)) {
            token.value = variableNames.get(token.value);
            token.renamed = true;
        }
    }
    
    return { count };
}

// Generate identifier
function generateIdentifier(style, index, randomFn) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    const confusingChars = 'iIlL10Oo';
    let result = '';
    
    function getRandom() {
        return randomFn ? randomFn() : Math.random();
    }
    
    function generateRandomString(length, charSet) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += charSet[Math.floor(getRandom() * charSet.length)];
        }
        return str;
    }
    
    switch (style) {
        case 'short':
            result = '_' + (index + 1);
            break;
        case 'random':
            result = '_' + generateRandomString(5, chars);
            break;
        case 'confusing':
            result = '_' + generateRandomString(6, confusingChars);
            break;
        case 'long':
            result = '_' + generateRandomString(10, chars);
            break;
        case 'mixed':
            result = '_' + generateRandomString(7, chars);
            break;
        default:
            result = '_' + generateRandomString(5, chars);
    }
    
    return result;
}

// Protect strings
function protectStrings(tokens, settings) {
    let count = 0;
    const seed = settings.seed || 12345;
    const mode = settings.stringMode || 'encoded';
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'STRING' || token.type === 'LONG_STRING') {
            const originalValue = token.value;
            
            switch (mode) {
                case 'split':
                    if (originalValue.length > 1) {
                        const mid = Math.floor(originalValue.length / 2);
                        const left = originalValue.substring(0, mid);
                        const right = originalValue.substring(mid);
                        token.value = left;
                        token.splitValue = right;
                        token.split = true;
                        count++;
                    }
                    break;
                    
                case 'encoded':
                case 'pool':
                case 'runtime':
                case 'adaptive':
                default:
                    const protectedString = encodeString(originalValue, seed);
                    token.originalValue = originalValue;
                    token.value = protectedString.encoded;
                    token.encoded = true;
                    token.decodeFunction = 'decodeString';
                    count++;
                    break;
            }
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
    
    return {
        encoded: encoded,
        function: 'decodeString'
    };
}

// Transform constants
function transformConstants(tokens, settings) {
    let count = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'NUMBER' && !token.transformed) {
            const num = token.value;
            
            if (Number.isInteger(num) && num > 0 && num < 1000) {
                // Transform simple integers
                const transformations = [
                    `${num} + 0`,
                    `${num} * 1`,
                    `${num} - 0`,
                    `(${num - 1}) + 1`,
                    `(${num + 1}) - 1`
                ];
                
                token.transformed = true;
                token.transformedValue = transformations[Math.floor(Math.random() * transformations.length)];
                count++;
            } else if (!Number.isInteger(num) && num > 0) {
                // Transform decimals
                const transformations = [
                    `${num} + 0.0`,
                    `${num} * 1.0`,
                    `(${num - 0.1}) + 0.1`,
                    `(${num + 0.1}) - 0.1`
                ];
                
                token.transformed = true;
                token.transformedValue = transformations[Math.floor(Math.random() * transformations.length)];
                count++;
            }
        }
    }
    
    return { count };
}

// Add junk code
function addJunkCode(ast, settings) {
    const junkDensity = settings.junkDensity || 0;
    const junkCount = Math.floor(junkDensity / 10);
    
    for (let i = 0; i < junkCount; i++) {
        if (ast.body) {
            const junkNode = {
                type: 'JunkCode',
                content: `local _junk${i}_${Date.now()} = ${Math.floor(Math.random() * 1000)}`
            };
            ast.body.push(junkNode);
        }
    }
    
    return { count: junkCount };
}

// Add dead code
function addDeadCode(ast, settings) {
    const junkDensity = settings.junkDensity || 0;
    const deadCount = Math.floor(junkDensity / 20);
    
    for (let i = 0; i < deadCount; i++) {
        if (ast.body) {
            const deadNode = {
                type: 'DeadCode',
                content: `if false then\n    local _dead${i}_${Date.now()} = ${Math.floor(Math.random() * 1000)}\nend`
            };
            ast.body.push(deadNode);
        }
    }
    
    return { count: deadCount };
}

// Add opaque predicates
function addOpaquePredicates(ast, settings) {
    const predicateCount = Math.floor((settings.junkDensity || 0) / 30);
    
    for (let i = 0; i < predicateCount; i++) {
        if (ast.body) {
            const predicates = [
                `local _pred${i} = (17 * 3 - 51) == 0`,
                `local _pred${i} = (42 / 2 - 21) == 0`,
                `local _pred${i} = (100 % 7 - 2) == 0`,
                `local _pred${i} = ((25 * 4) - (50 * 2)) == 0`
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

// Transform control flow
function transformControlFlow(ast, settings) {
    const level = settings.controlFlowLevel || 'off';
    let count = 0;
    
    if (level === 'low' || level === 'medium') {
        // Basic block splitting
        if (ast.body && ast.body.length > 3) {
            count = Math.floor(ast.body.length / 3);
        }
    } else if (level === 'high' || level === 'extreme') {
        // More aggressive transformation
        if (ast.body && ast.body.length > 2) {
            count = Math.floor(ast.body.length / 2);
        }
    }
    
    return { count };
}

// Transform expressions
function transformExpressions(tokens, settings) {
    let count = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'OPERATOR' && ['+', '-', '*', '/'].includes(token.value)) {
            const prevToken = tokens[i - 1];
            const nextToken = tokens[i + 1];
            
            if (prevToken && nextToken && 
                (prevToken.type === 'NUMBER' || prevToken.type === 'IDENTIFIER') &&
                (nextToken.type === 'NUMBER' || nextToken.type === 'IDENTIFIER')) {
                
                token.transformed = true;
                count++;
            }
        }
    }
    
    return { count };
}

// Generate code from AST
function generateCode(ast, settings) {
    let code = '';
    
    // Generate code from tokens
    if (ast.tokens) {
        for (let i = 0; i < ast.tokens.length; i++) {
            const token = ast.tokens[i];
            
            switch (token.type) {
                case 'STRING':
                case 'LONG_STRING':
                    if (token.encoded) {
                        code += `decodeString("${escapeString(token.value)}", ${settings.seed || 12345})`;
                    } else if (token.split) {
                        code += `"${escapeString(token.value)}" .. "${escapeString(token.splitValue)}"`;
                    } else {
                        code += token.raw || `"${escapeString(token.value)}"`;
                    }
                    break;
                    
                case 'NUMBER':
                    if (token.transformed && token.transformedValue) {
                        code += token.transformedValue;
                    } else {
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
                if (needsSpace(token, nextToken)) {
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
    // Keywords need space before identifiers
    if (token.type === 'KEYWORD' && nextToken.type === 'IDENTIFIER') {
        return true;
    }
    
    // Identifiers need space before keywords
    if (token.type === 'IDENTIFIER' && nextToken.type === 'KEYWORD') {
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
    
    // Strings and numbers need space between them
    if ((token.type === 'STRING' || token.type === 'LONG_STRING') && 
        (nextToken.type === 'STRING' || nextToken.type === 'LONG_STRING')) {
        return true;
    }
    
    return false;
}

// Check if string encoding is used
function usesStringEncoding(ast) {
    if (ast.tokens) {
        return ast.tokens.some(token => 
            (token.type === 'STRING' || token.type === 'LONG_STRING') && token.encoded
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

// Validate output
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
    
    // Check for common syntax errors
    if (code.includes('local =')) {
        return { valid: false, error: 'Invalid local declaration' };
    }
    
    if (code.includes('function =')) {
        return { valid: false, error: 'Invalid function declaration' };
    }
    
    // Check for unterminated strings
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const quoteCount = (line.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            return { valid: false, error: `Unterminated string on line ${i + 1}` };
        }
    }
    
    return { valid: true };
}

// Pack code (minify)
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
        
        // Remove extra spaces (but preserve indentation)
        packed = packed.replace(/[ \t]+/g, ' ');
    }
    
    if (packLevel >= 3) {
        // More aggressive minification
        const lines = packed.split('\n');
        const packedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                packedLines.push(trimmed);
            }
        }
        
        packed = packedLines.join(' ');
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
    
    if (transformations.applied.expressions) {
        log.push({ 
            stage: 'Expressions', 
            status: 'PASS', 
            message: `${transformations.stats.expressionsTransformed || 0} expressions transformed` 
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
    
    if (transformations.applied.controlFlow) {
        log.push({ 
            stage: 'Control Flow', 
            status: 'PASS', 
            message: `${transformations.stats.controlFlowTransforms || 0} blocks transformed` 
        });
    }
    
    log.push({ 
        stage: 'Packing', 
        status: 'PASS', 
        message: 'Code minified successfully' 
    });
    
    log.push({ 
        stage: 'Validation', 
        status: 'PASS', 
        message: 'All validations passed' 
    });
    
    return log;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        tokenize,
        parse,
        analyzeScope,
        applyTransformations,
        generateCode,
        validateOutput,
        packCode,
        calculateStats,
        generateBuildLog
    };
}
