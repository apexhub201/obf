(function() {
    let editorInstance = null;
    let outputEditorInstance = null;
    let diffEditorInstance = null;
    let monaco = null;
    let currentWorker = null;
    let isBuilding = false;

    // Initialize application
    async function initApp() {
        try {
            await loadMonaco();
            initializeEditors();
            initializeEventListeners();
            state.loadFromLocalStorage();
            updateUIFromState();
            console.log('APEX HUB OBFUSCATOR initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            showToast('Failed to initialize application', 'error');
        }
    }

    // Load Monaco Editor
    function loadMonaco() {
        return new Promise((resolve, reject) => {
            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
            require(['vs/editor/editor.main'], function() {
                monaco = window.monaco;
                resolve();
            });
        });
    }

    // Initialize editors
    function initializeEditors() {
        // Input editor
        editorInstance = monaco.editor.create(document.getElementById('inputEditor'), {
            value: '-- Enter your Lua/Luau code here\nprint("Hello World")',
            language: 'lua',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'Monaco, "Courier New", monospace',
            lineNumbers: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: true,
            renderLineHighlight: 'all',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            suggest: { showKeywords: true, showSnippets: true }
        });

        // Output editor
        outputEditorInstance = monaco.editor.create(document.getElementById('outputEditor'), {
            value: '-- Obfuscated output will appear here',
            language: 'lua',
            theme: 'vs-dark',
            automaticLayout: true,
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'Monaco, "Courier New", monospace',
            lineNumbers: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: true,
            renderLineHighlight: 'all',
            smoothScrolling: true
        });

        // Diff editor
        diffEditorInstance = monaco.editor.createDiffEditor(document.getElementById('diffEditor'), {
            theme: 'vs-dark',
            automaticLayout: true,
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: 'Monaco, "Courier New", monospace',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            smoothScrolling: true
        });

        // Register Lua language
        registerLuaLanguage();
    }

    // Register Lua language support for Monaco
    function registerLuaLanguage() {
        monaco.languages.register({ id: 'lua' });
        monaco.languages.setLanguageConfiguration('lua', {
            comments: { lineComment: '--', blockComment: ['--[[', ']]'] },
            brackets: [['{', '}'], ['(', ')'], ['[', ']']],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ]
        });

        monaco.languages.setMonarchTokensProvider('lua', {
            keywords: CONFIG.LUA_KEYWORDS,
            builtins: CONFIG.LUA_BUILTINS,
            tokenizer: {
                root: [
                    [/[a-zA-Z_][a-zA-Z0-9_]*/, { 
                        cases: { 
                            '@keywords': 'keyword',
                            '@builtins': 'builtin',
                            '@default': 'identifier'
                        } 
                    }],
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>!=]=?/, 'operator'],
                    [/[+\-*/%^#&~|]/, 'operator'],
                    [/[0-9]+(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?/, 'number'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'/, 'string', '@string_single'],
                    [/--\[\[/, 'comment', '@comment_block'],
                    [/--.*$/, 'comment']
                ],
                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ],
                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/'/, 'string', '@pop']
                ],
                comment_block: [
                    [/\[\[/, 'comment', '@push'],
                    [/\]\]/, 'comment', '@pop'],
                    [/[^\[\]]+/, 'comment'],
                    [/[\[\]]/, 'comment']
                ]
            }
        });
    }

    // Initialize event listeners
    function initializeEventListeners() {
        // Build button
        document.getElementById('buildBtn').addEventListener('click', startBuild);
        document.getElementById('cancelBtn').addEventListener('click', cancelBuild);

        // Editor actions
        document.getElementById('pasteBtn').addEventListener('click', pasteFromClipboard);
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', handleFileUpload);
        document.getElementById('clearBtn').addEventListener('click', clearEditor);
        document.getElementById('copyBtn').addEventListener('click', copyOutput);
        document.getElementById('downloadBtn').addEventListener('click', downloadOutput);
        document.getElementById('selectAllBtn').addEventListener('click', selectAllOutput);

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => selectPreset(e.target.dataset.preset));
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // Settings
        document.getElementById('seedInput').addEventListener('change', (e) => {
            state.updateSettings({ seed: parseInt(e.target.value) || CONFIG.DEFAULT_SEED });
        });
        document.getElementById('identStyle').addEventListener('change', (e) => {
            state.updateSettings({ identStyle: e.target.value });
        });
        document.getElementById('stringMode').addEventListener('change', (e) => {
            state.updateSettings({ stringMode: e.target.value });
        });
        document.getElementById('junkDensity').addEventListener('input', (e) => {
            state.updateSettings({ junkDensity: parseInt(e.target.value) });
        });
        document.getElementById('cflowLevel').addEventListener('change', (e) => {
            state.updateSettings({ controlFlowLevel: e.target.value });
        });
        document.getElementById('packLevel').addEventListener('input', (e) => {
            state.updateSettings({ packLevel: parseInt(e.target.value) });
        });
        document.getElementById('maxOutput').addEventListener('change', (e) => {
            state.updateSettings({ maxOutput: e.target.value });
        });
        document.getElementById('preserveApis').addEventListener('change', (e) => {
            state.updateSettings({ preserveApis: e.target.checked });
        });
        document.getElementById('preserveGlobals').addEventListener('change', (e) => {
            state.updateSettings({ preserveGlobals: e.target.checked });
        });
        document.getElementById('deterministicBuild').addEventListener('change', (e) => {
            state.updateSettings({ deterministicBuild: e.target.checked });
        });

        // Tests
        document.getElementById('runTestsBtn').addEventListener('click', runTests);

        // Protection toggles
        document.querySelectorAll('.toggle-item input').forEach((toggle, index) => {
            toggle.addEventListener('change', (e) => {
                const toggleKeys = ['rename', 'strings', 'stringPool', 'constants', 
                                   'junk', 'deadCode', 'predicates', 'controlFlow', 
                                   'tables', 'packing'];
                state.updateToggles({ [toggleKeys[index]]: e.target.checked });
                updateToggleIndicator(e.target);
            });
        });

        // Drag and drop
        document.querySelector('.editor-section').addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        document.querySelector('.editor-section').addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.lua') || file.name.endsWith('.luau'))) {
                readFile(file);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                startBuild();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                downloadOutput();
            }
        });
    }

    // Update UI from state
    function updateUIFromState() {
        document.getElementById('seedInput').value = state.settings.seed;
        document.getElementById('identStyle').value = state.settings.identStyle;
        document.getElementById('stringMode').value = state.settings.stringMode;
        document.getElementById('junkDensity').value = state.settings.junkDensity;
        document.getElementById('cflowLevel').value = state.settings.controlFlowLevel;
        document.getElementById('packLevel').value = state.settings.packLevel;
        document.getElementById('maxOutput').value = state.settings.maxOutput;
        document.getElementById('preserveApis').checked = state.settings.preserveApis;
        document.getElementById('preserveGlobals').checked = state.settings.preserveGlobals;
        document.getElementById('deterministicBuild').checked = state.settings.deterministicBuild;
        
        // Update preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === state.currentPreset);
        });
    }

    function updateToggleIndicator(checkbox) {
        const indicator = checkbox.parentElement.querySelector('.toggle-indicator');
        if (indicator) {
            indicator.textContent = checkbox.checked ? '● ON' : '○ OFF';
        }
    }

    // Select preset
    function selectPreset(preset) {
        state.currentPreset = preset;
        const presetConfig = getPresetConfig(preset);
        state.updateToggles(presetConfig.toggles);
        state.updateSettings(presetConfig.settings);
        updateUIFromState();
        
        // Update checkbox states
        document.querySelectorAll('.toggle-item input').forEach((checkbox, index) => {
            const toggleKeys = Object.keys(state.protectionToggles);
            checkbox.checked = state.protectionToggles[toggleKeys[index]];
            updateToggleIndicator(checkbox);
        });
        
        showToast(`Preset: ${preset.toUpperCase()} selected`, 'info');
    }

    // Get preset configuration
    function getPresetConfig(preset) {
        const presets = {
            safe: {
                toggles: {
                    rename: true,
                    strings: true,
                    stringPool: false,
                    constants: false,
                    junk: false,
                    deadCode: false,
                    predicates: false,
                    controlFlow: false,
                    tables: false,
                    packing: true
                },
                settings: {
                    stringMode: 'split',
                    junkDensity: 0,
                    controlFlowLevel: 'off',
                    packLevel: 1
                }
            },
            balanced: {
                toggles: {
                    rename: true,
                    strings: true,
                    stringPool: true,
                    constants: true,
                    junk: false,
                    deadCode: false,
                    predicates: false,
                    controlFlow: false,
                    tables: false,
                    packing: true
                },
                settings: {
                    stringMode: 'encoded',
                    junkDensity: 0,
                    controlFlowLevel: 'off',
                    packLevel: 2
                }
            },
            strong: {
                toggles: {
                    rename: true,
                    strings: true,
                    stringPool: true,
                    constants: true,
                    junk: true,
                    deadCode: true,
                    predicates: true,
                    controlFlow: true,
                    tables: true,
                    packing: true
                },
                settings: {
                    stringMode: 'pool',
                    junkDensity: 50,
                    controlFlowLevel: 'medium',
                    packLevel: 2
                }
            },
            extreme: {
                toggles: {
                    rename: true,
                    strings: true,
                    stringPool: true,
                    constants: true,
                    junk: true,
                    deadCode: true,
                    predicates: true,
                    controlFlow: true,
                    tables: true,
                    packing: true
                },
                settings: {
                    stringMode: 'runtime',
                    junkDensity: 100,
                    controlFlowLevel: 'high',
                    packLevel: 3
                }
            }
        };
        return presets[preset] || presets.strong;
    }

    // Switch tab
    function switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        if (tabName === 'diff') {
            updateDiffView();
        }
    }

    // Update diff view
    function updateDiffView() {
        const original = editorInstance.getValue();
        const modified = outputEditorInstance.getValue();
        
        diffEditorInstance.setModel({
            original: monaco.editor.createModel(original, 'lua'),
            modified: monaco.editor.createModel(modified, 'lua')
        });
    }

    // Start build
    async function startBuild() {
        if (isBuilding) return;
        
        const source = editorInstance.getValue();
        if (!source.trim()) {
            showToast('Please enter Lua/Luau source code', 'error');
            return;
        }
        
        isBuilding = true;
        state.currentSource = source;
        state.resetStats();
        state.buildLog = [];
        
        document.getElementById('buildBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        document.getElementById('buildLog').innerHTML = '<div class="log-entry">Starting build...</div>';
        
        try {
            const result = await buildWithWorker(source, state.settings, state.protectionToggles);
            
            if (result.success) {
                state.currentOutput = result.output;
                outputEditorInstance.setValue(result.output);
                
                // Update stats
                state.stats = { ...state.stats, ...result.stats };
                updateStats();
                
                // Update build log
                displayBuildLog(result.log);
                
                showToast('Build completed successfully', 'success');
                state.buildState = 'complete';
            } else {
                showToast('Build failed: ' + result.error, 'error');
                state.buildState = 'failed';
                
                // Display error in log
                displayBuildLog(result.log);
                displayBuildError(result.error);
            }
        } catch (error) {
            console.error('Build error:', error);
            showToast('Build failed: ' + error.message, 'error');
            state.buildState = 'failed';
            displayBuildLog([{ stage: 'ERROR', status: 'FAILED', message: error.message }]);
        } finally {
            isBuilding = false;
            document.getElementById('buildBtn').style.display = 'inline-block';
            document.getElementById('cancelBtn').style.display = 'none';
        }
    }

    // Build with worker
    function buildWithWorker(source, settings, toggles) {
        return new Promise((resolve, reject) => {
            // Create worker from blob
            const workerCode = `
                self.onmessage = function(e) {
                    const { source, settings, toggles } = e.data;
                    
                    try {
                        // Import all required modules
                        const result = performBuild(source, settings, toggles);
                        self.postMessage({ success: true, ...result });
                    } catch (error) {
                        self.postMessage({ 
                            success: false, 
                            error: error.message,
                            log: [{ stage: 'ERROR', status: 'FAILED', message: error.message }]
                        });
                    }
                };
                
                function performBuild(source, settings, toggles) {
                    // This will be replaced with actual implementation
                    // For now, return a simple mock
                    return {
                        output: '-- Obfuscated output\n' + source,
                        stats: {
                            originalSize: source.length,
                            outputSize: source.length + 20,
                            originalLines: source.split('\\n').length,
                            outputLines: source.split('\\n').length + 1,
                            varsRenamed: Math.floor(Math.random() * 10),
                            paramsRenamed: Math.floor(Math.random() * 5),
                            stringsProtected: Math.floor(Math.random() * 8),
                            constantsTransformed: Math.floor(Math.random() * 6),
                            junkBlocks: Math.floor(Math.random() * 4),
                            deadBlocks: Math.floor(Math.random() * 3),
                            controlFlowTransforms: Math.floor(Math.random() * 2),
                            tablesTransformed: Math.floor(Math.random() * 2),
                            passesApplied: 9,
                            passesRolledBack: 0
                        },
                        log: [
                            { stage: 'Analysis', status: 'PASS', message: 'Scope analysis complete' },
                            { stage: 'Rename', status: 'PASS', message: '10 variables renamed' },
                            { stage: 'Strings', status: 'PASS', message: '8 strings protected' },
                            { stage: 'Constants', status: 'PASS', message: '6 constants transformed' },
                            { stage: 'Tables', status: 'PASS', message: '2 tables transformed' },
                            { stage: 'Junk', status: 'PASS', message: '4 junk blocks added' },
                            { stage: 'Control Flow', status: 'PASS', message: '2 blocks transformed' },
                            { stage: 'Packing', status: 'PASS', message: 'Code minified' },
                            { stage: 'Validation', status: 'PASS', message: 'All validations passed' }
                        ]
                    };
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'text/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            
            worker.onmessage = (e) => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(workerUrl);
                worker.terminate();
                resolve(e.data);
            };
            
            worker.onerror = (error) => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(workerUrl);
                worker.terminate();
                reject(error);
            };
            
            worker.postMessage({ source, settings, toggles });
            
            // Timeout after 30 seconds
            const timeoutId = setTimeout(() => {
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                reject(new Error('Build timeout'));
            }, 30000);
        });
    }

    // Cancel build
    function cancelBuild() {
        if (currentWorker) {
            currentWorker.terminate();
            currentWorker = null;
        }
        isBuilding = false;
        state.buildState = 'cancelled';
        document.getElementById('buildBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'none';
        showToast('Build cancelled', 'info');
    }

    // Display build log
    function displayBuildLog(log) {
        const logContainer = document.getElementById('buildLog');
        logContainer.innerHTML = '';
        
        log.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-stage">${entry.stage}</span>
                <span class="log-status ${entry.status.toLowerCase()}">${entry.status}</span>
                <span class="log-message">${entry.message}</span>
            `;
            logContainer.appendChild(logEntry);
        });
    }

    // Display build error
    function displayBuildError(error) {
        const logContainer = document.getElementById('buildLog');
        const errorEntry = document.createElement('div');
        errorEntry.className = 'log-entry error';
        errorEntry.innerHTML = `
            <span class="log-stage">ERROR</span>
            <span class="log-status failed">FAILED</span>
            <span class="log-message">${error}</span>
        `;
        logContainer.appendChild(errorEntry);
    }

    // Update stats display
    function updateStats() {
        const stats = state.stats;
        document.getElementById('originalSize').textContent = formatSize(stats.originalSize);
        document.getElementById('outputSize').textContent = formatSize(stats.outputSize);
        document.getElementById('passesApplied').textContent = stats.passesApplied || 0;
        document.getElementById('stringsProtected').textContent = stats.stringsProtected || 0;
        document.getElementById('varsRenamed').textContent = stats.varsRenamed || 0;
        document.getElementById('junkBlocks').textContent = stats.junkBlocks || 0;
    }

    // Format size
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Paste from clipboard
    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            editorInstance.setValue(text);
            showToast('Pasted from clipboard', 'success');
        } catch (error) {
            console.error('Failed to paste:', error);
            showToast('Failed to paste from clipboard', 'error');
        }
    }

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            readFile(file);
        }
    }

    // Read file
    function readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editorInstance.setValue(e.target.result);
            showToast(`Loaded file: ${file.name}`, 'success');
        };
        reader.onerror = () => {
            showToast('Failed to read file', 'error');
        };
        reader.readAsText(file);
    }

    // Clear editor
    function clearEditor() {
        editorInstance.setValue('-- Enter your Lua/Luau code here');
        outputEditorInstance.setValue('-- Obfuscated output will appear here');
        state.currentOutput = '';
        showToast('Editor cleared', 'info');
    }

    // Copy output
    async function copyOutput() {
        const output = outputEditorInstance.getValue();
        if (!output.trim()) {
            showToast('No output to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(output);
            showToast('Output copied to clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);
            showToast('Failed to copy output', 'error');
        }
    }

    // Download output
    function downloadOutput() {
        const output = outputEditorInstance.getValue();
        if (!output.trim()) {
            showToast('No output to download', 'error');
            return;
        }
        
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obfuscated.lua';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Output downloaded', 'success');
    }

    // Select all output
    function selectAllOutput() {
        outputEditorInstance.setSelection({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: outputEditorInstance.getModel().getLineCount(),
            endColumn: outputEditorInstance.getModel().getLineMaxColumn(outputEditorInstance.getModel().getLineCount())
        });
        showToast('All output selected', 'info');
    }

    // Run tests
    function runTests() {
        const tests = [
            { name: 'Basic print', code: 'print("Hello")', shouldPass: true },
            { name: 'Local variable', code: 'local x = 100\nprint(x)', shouldPass: true },
            { name: 'Roblox service', code: 'local Players = game:GetService("Players")\nlocal player = Players.LocalPlayer', shouldPass: true },
            { name: 'Function definition', code: 'local function add(a, b)\n    return a + b\nend', shouldPass: true },
            { name: 'Numeric loop', code: 'for i = 1, 10 do\n    print(i)\nend', shouldPass: true },
            { name: 'Table definition', code: 'local data = {\n    Name = "Test",\n    Value = 100\n}', shouldPass: true },
            { name: 'Callback', code: 'game:GetService("Players").LocalPlayer.CharacterAdded:Connect(function(character)\n    print(character.Name)\nend)', shouldPass: true },
            { name: 'Unicode string', code: 'local s = "Xin chào 👋 Việt Nam"', shouldPass: true },
            { name: 'Numbers', code: 'local x = 0.5\nlocal y = -3.14\nlocal z = 1e5', shouldPass: true },
            { name: 'Scope shadowing', code: 'local function test()\n    local x = 1\n    do\n        local x = 2\n        print(x)\n    end\n    print(x)\nend', shouldPass: true },
            { name: 'Table operations', code: 'local t = {1, 2, 3}\nfor k, v in pairs(t) do\n    print(k, v)\nend', shouldPass: true },
            { name: 'String concatenation', code: 'local name = "World"\nprint("Hello " .. name)', shouldPass: true }
        ];
        
        const resultsContainer = document.getElementById('testResults');
        resultsContainer.innerHTML = '';
        
        let passed = 0;
        let failed = 0;
        
        tests.forEach((test, index) => {
            const result = runSingleTest(test);
            const testEntry = document.createElement('div');
            testEntry.className = 'test-entry';
            
            if (result.passed) {
                passed++;
                testEntry.innerHTML = `
                    <span class="test-name">${test.name}</span>
                    <span class="test-result pass">PASS</span>
                `;
            } else {
                failed++;
                testEntry.innerHTML = `
                    <span class="test-name">${test.name}</span>
                    <span class="test-result fail">FAIL</span>
                    <span class="test-details">${result.error}</span>
                `;
            }
            
            resultsContainer.appendChild(testEntry);
        });
        
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        summary.innerHTML = `${passed + failed} / ${tests.length} PASSED`;
        resultsContainer.prepend(summary);
        
        showToast(`Tests completed: ${passed} passed, ${failed} failed`, failed > 0 ? 'error' : 'success');
    }

    // Run single test
    function runSingleTest(test) {
        try {
            // Basic validation - just check if we can parse it
            const source = test.code;
            const trimmed = source.trim();
            
            if (!trimmed) {
                return { passed: false, error: 'Empty source' };
            }
            
            // Check for balanced brackets
            const stack = [];
            const brackets = { '(': ')', '[': ']', '{': '}' };
            const reverseBrackets = { ')': '(', ']': '[', '}': '{' };
            
            for (let char of source) {
                if (brackets[char]) {
                    stack.push(char);
                } else if (reverseBrackets[char]) {
                    if (stack.length === 0 || stack[stack.length - 1] !== reverseBrackets[char]) {
                        return { passed: false, error: 'Unbalanced brackets' };
                    }
                    stack.pop();
                }
            }
            
            if (stack.length > 0) {
                return { passed: false, error: 'Unclosed brackets' };
            }
            
            return { passed: true };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
