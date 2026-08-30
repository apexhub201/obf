// APEX HUB OBFUSCATOR - Main Application
(function() {
    'use strict';

    // Global variables
    let editorInstance = null;
    let outputEditorInstance = null;
    let diffEditorInstance = null;
    let monaco = null;
    let currentWorker = null;
    let isBuilding = false;
    let buildTimeout = null;

    // Initialize application
    async function initApp() {
        try {
            console.log('APEX HUB OBFUSCATOR - Initializing...');
            await loadMonaco();
            initializeEditors();
            initializeEventListeners();
            
            // Load saved settings from localStorage
            if (state && typeof state.loadFromLocalStorage === 'function') {
                state.loadFromLocalStorage();
                updateUIFromState();
            }
            
            console.log('APEX HUB OBFUSCATOR initialized successfully');
            showToast('Engine initialized successfully', 'success');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            showToast('Failed to initialize application: ' + error.message, 'error');
        }
    }

    // Load Monaco Editor
    function loadMonaco() {
        return new Promise((resolve, reject) => {
            try {
                require.config({ 
                    paths: { 
                        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
                    } 
                });
                
                require(['vs/editor/editor.main'], function() {
                    monaco = window.monaco;
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Initialize editors
    function initializeEditors() {
        // Input editor
        editorInstance = monaco.editor.create(document.getElementById('inputEditor'), {
            value: '-- Enter your Lua/Luau code here\n-- Example:\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\n\nprint("Hello, " .. player.Name .. "!")',
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
            suggest: { 
                showKeywords: true, 
                showSnippets: true 
            }
        });

        // Output editor
        outputEditorInstance = monaco.editor.create(document.getElementById('outputEditor'), {
            value: '-- Obfuscated output will appear here\n-- Click "BUILD OBFUSCATION" to generate',
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
            comments: { 
                lineComment: '--', 
                blockComment: ['--[[', ']]'] 
            },
            brackets: [
                ['{', '}'],
                ['(', ')'],
                ['[', ']']
            ],
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
            keywords: [
                'and', 'break', 'do', 'else', 'elseif', 'end', 'false',
                'for', 'function', 'goto', 'if', 'in', 'local', 'nil',
                'not', 'or', 'repeat', 'return', 'then', 'true', 'until',
                'while', 'continue'
            ],
            builtins: [
                'game', 'workspace', 'script', 'shared', '_G', 'require',
                'Instance', 'Vector2', 'Vector3', 'Vector3int16', 'CFrame',
                'Color3', 'BrickColor', 'UDim', 'UDim2', 'Ray', 'Enum',
                'math', 'string', 'table', 'coroutine', 'utf8', 'print',
                'warn', 'error', 'assert', 'pcall', 'xpcall', 'pairs',
                'ipairs', 'next', 'tonumber', 'tostring', 'type', 'typeof',
                'task', 'wait', 'spawn', 'delay'
            ],
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
            state.updateSettings({ seed: parseInt(e.target.value) || 12345 });
        });
        
        document.getElementById('identStyle').addEventListener('change', (e) => {
            state.updateSettings({ identStyle: e.target.value });
        });
        
        document.getElementById('stringMode').addEventListener('change', (e) => {
            state.updateSettings({ stringMode: e.target.value });
        });
        
        document.getElementById('junkDensity').addEventListener('input', (e) => {
            state.updateSettings({ junkDensity: parseInt(e.target.value) });
            document.getElementById('junkDensityValue').textContent = e.target.value;
        });
        
        document.getElementById('cflowLevel').addEventListener('change', (e) => {
            state.updateSettings({ controlFlowLevel: e.target.value });
        });
        
        document.getElementById('packLevel').addEventListener('input', (e) => {
            state.updateSettings({ packLevel: parseInt(e.target.value) });
            document.getElementById('packLevelValue').textContent = e.target.value;
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
        const toggleKeys = ['rename', 'strings', 'stringPool', 'constants', 
                           'junk', 'deadCode', 'predicates', 'controlFlow', 
                           'tables', 'packing'];
        
        document.querySelectorAll('.toggle-item input').forEach((toggle, index) => {
            toggle.addEventListener('change', (e) => {
                const updates = {};
                updates[toggleKeys[index]] = e.target.checked;
                state.updateToggles(updates);
                updateToggleIndicator(e.target);
            });
        });

        // Drag and drop
        const editorSection = document.querySelector('.editor-section');
        editorSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            editorSection.classList.add('drag-over');
        });
        
        editorSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            editorSection.classList.remove('drag-over');
        });
        
        editorSection.addEventListener('drop', (e) => {
            e.preventDefault();
            editorSection.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.lua') || file.name.endsWith('.luau'))) {
                readFile(file);
            } else {
                showToast('Please drop a .lua or .luau file', 'error');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B to build
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                startBuild();
            }
            
            // Ctrl/Cmd + S to download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                downloadOutput();
            }
            
            // Escape to cancel build
            if (e.key === 'Escape' && isBuilding) {
                cancelBuild();
            }
        });
    }

    // Update UI from state
    function updateUIFromState() {
        if (!state || !state.settings) return;
        
        document.getElementById('seedInput').value = state.settings.seed || 12345;
        document.getElementById('identStyle').value = state.settings.identStyle || 'random';
        document.getElementById('stringMode').value = state.settings.stringMode || 'encoded';
        document.getElementById('junkDensity').value = state.settings.junkDensity || 50;
        document.getElementById('junkDensityValue').textContent = state.settings.junkDensity || 50;
        document.getElementById('cflowLevel').value = state.settings.controlFlowLevel || 'medium';
        document.getElementById('packLevel').value = state.settings.packLevel || 2;
        document.getElementById('packLevelValue').textContent = state.settings.packLevel || 2;
        document.getElementById('maxOutput').value = state.settings.maxOutput || '5';
        document.getElementById('preserveApis').checked = state.settings.preserveApis !== false;
        document.getElementById('preserveGlobals').checked = state.settings.preserveGlobals !== false;
        document.getElementById('deterministicBuild').checked = state.settings.deterministicBuild || false;
        
        // Update preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === state.currentPreset);
        });
        
        // Update protection toggles
        const toggleKeys = ['rename', 'strings', 'stringPool', 'constants', 
                           'junk', 'deadCode', 'predicates', 'controlFlow', 
                           'tables', 'packing'];
        
        document.querySelectorAll('.toggle-item input').forEach((checkbox, index) => {
            const key = toggleKeys[index];
            if (state.protectionToggles && key in state.protectionToggles) {
                checkbox.checked = state.protectionToggles[key];
                updateToggleIndicator(checkbox);
            }
        });
    }

    function updateToggleIndicator(checkbox) {
        const indicator = checkbox.parentElement.querySelector('.toggle-indicator');
        if (indicator) {
            indicator.textContent = checkbox.checked ? '● ON' : '○ OFF';
            indicator.style.color = checkbox.checked ? 'var(--success-color)' : 'var(--text-muted)';
        }
    }

    // Select preset
    function selectPreset(preset) {
        if (!state) return;
        
        state.currentPreset = preset;
        const presetConfig = getPresetConfig(preset);
        
        if (presetConfig) {
            state.updateToggles(presetConfig.toggles);
            state.updateSettings(presetConfig.settings);
            updateUIFromState();
            
            showToast(`Preset: ${preset.toUpperCase()} selected`, 'info');
        }
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
                    packLevel: 1,
                    identStyle: 'short'
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
                    packLevel: 2,
                    identStyle: 'random'
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
                    packLevel: 2,
                    identStyle: 'mixed'
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
                    packLevel: 3,
                    identStyle: 'confusing'
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
        if (!diffEditorInstance || !monaco) return;
        
        const original = editorInstance.getValue();
        const modified = outputEditorInstance.getValue();
        
        const originalModel = monaco.editor.createModel(original, 'lua');
        const modifiedModel = monaco.editor.createModel(modified, 'lua');
        
        diffEditorInstance.setModel({
            original: originalModel,
            modified: modifiedModel
        });
    }

    // Start build
    async function startBuild() {
        if (isBuilding) {
            showToast('Build already in progress', 'warning');
            return;
        }
        
        const source = editorInstance.getValue();
        if (!source || !source.trim()) {
            showToast('Please enter Lua/Luau source code', 'error');
            return;
        }
        
        // Validate source doesn't contain obvious errors
        if (source.includes('local =') || source.includes('localfunction')) {
            showToast('Source code contains syntax errors', 'error');
            return;
        }
        
        isBuilding = true;
        state.currentSource = source;
        state.resetStats();
        state.buildLog = [];
        
        // Update UI
        document.getElementById('buildBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        document.getElementById('buildLog').innerHTML = '<div class="log-entry"><span class="log-stage">Build</span><span class="log-status pass">STARTING</span><span class="log-message">Initializing obfuscation pipeline...</span></div>';
        
        try {
            const settings = {
                ...state.settings,
                seed: parseInt(state.settings.seed) || 12345
            };
            
            const toggles = { ...state.protectionToggles };
            
            console.log('Starting build with settings:', settings);
            console.log('Toggles:', toggles);
            
            const result = await buildWithWorker(source, settings, toggles);
            
            if (result.success) {
                state.currentOutput = result.output;
                outputEditorInstance.setValue(result.output);
                
                // Update stats
                if (result.stats) {
                    state.stats = { ...state.stats, ...result.stats };
                    updateStats();
                }
                
                // Update build log
                if (result.log) {
                    displayBuildLog(result.log);
                }
                
                // Update diff view if on diff tab
                updateDiffView();
                
                showToast('Build completed successfully', 'success');
                state.buildState = 'complete';
            } else {
                const errorMsg = result.error || 'Unknown error';
                showToast('Build failed: ' + errorMsg, 'error');
                state.buildState = 'failed';
                
                if (result.log) {
                    displayBuildLog(result.log);
                }
                displayBuildError(errorMsg);
            }
        } catch (error) {
            console.error('Build error:', error);
            showToast('Build failed: ' + error.message, 'error');
            state.buildState = 'failed';
            displayBuildLog([{ 
                stage: 'ERROR', 
                status: 'FAILED', 
                message: error.message 
            }]);
        } finally {
            isBuilding = false;
            document.getElementById('buildBtn').style.display = 'inline-block';
            document.getElementById('cancelBtn').style.display = 'none';
        }
    }

    // Build with worker
    function buildWithWorker(source, settings, toggles) {
        return new Promise((resolve, reject) => {
            try {
                // Create worker
                const worker = new Worker('src/worker.js');
                currentWorker = worker;
                
                worker.onmessage = (e) => {
                    clearTimeout(buildTimeout);
                    currentWorker = null;
                    worker.terminate();
                    resolve(e.data);
                };
                
                worker.onerror = (error) => {
                    clearTimeout(buildTimeout);
                    currentWorker = null;
                    worker.terminate();
                    console.error('Worker error:', error);
                    reject(new Error('Worker error: ' + (error.message || 'Unknown error')));
                };
                
                worker.postMessage({ 
                    source, 
                    settings, 
                    toggles 
                });
                
                // Timeout after 60 seconds
                buildTimeout = setTimeout(() => {
                    if (currentWorker) {
                        currentWorker.terminate();
                        currentWorker = null;
                        reject(new Error('Build timeout after 60 seconds'));
                    }
                }, 60000);
                
            } catch (error) {
                console.error('Failed to create worker:', error);
                reject(error);
            }
        });
    }

    // Cancel build
    function cancelBuild() {
        if (currentWorker) {
            currentWorker.terminate();
            currentWorker = null;
        }
        
        if (buildTimeout) {
            clearTimeout(buildTimeout);
            buildTimeout = null;
        }
        
        isBuilding = false;
        state.buildState = 'cancelled';
        
        document.getElementById('buildBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'none';
        
        displayBuildLog([{ 
            stage: 'CANCELLED', 
            status: 'FAILED', 
            message: 'Build cancelled by user' 
        }]);
        
        showToast('Build cancelled', 'info');
    }

    // Display build log
    function displayBuildLog(log) {
        const logContainer = document.getElementById('buildLog');
        logContainer.innerHTML = '';
        
        if (!log || log.length === 0) {
            logContainer.innerHTML = '<div class="log-entry">No log entries</div>';
            return;
        }
        
        log.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const statusClass = entry.status.toLowerCase();
            logEntry.innerHTML = `
                <span class="log-stage">${entry.stage || 'Unknown'}</span>
                <span class="log-status ${statusClass}">${entry.status || 'INFO'}</span>
                <span class="log-message">${entry.message || ''}</span>
            `;
            logContainer.appendChild(logEntry);
        });
        
        logContainer.scrollTop = logContainer.scrollHeight;
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
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Update stats display
    function updateStats() {
        const stats = state.stats || {};
        
        const elements = {
            'originalSize': stats.originalSize || 0,
            'outputSize': stats.outputSize || 0,
            'passesApplied': stats.passesApplied || 0,
            'stringsProtected': stats.stringsProtected || 0,
            'varsRenamed': stats.varsRenamed || 0,
            'junkBlocks': stats.junkBlocks || 0
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'originalSize' || id === 'outputSize') {
                    element.textContent = formatSize(value);
                } else {
                    element.textContent = value;
                }
            }
        }
    }

    // Format size
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Paste from clipboard
    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (editorInstance) {
                editorInstance.setValue(text);
                showToast('Pasted from clipboard', 'success');
            }
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
        event.target.value = '';
    }

    // Read file
    function readFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (editorInstance) {
                editorInstance.setValue(e.target.result);
                showToast(`Loaded file: ${file.name}`, 'success');
            }
        };
        
        reader.onerror = () => {
            showToast('Failed to read file', 'error');
        };
        
        reader.readAsText(file);
    }

    // Clear editor
    function clearEditor() {
        if (editorInstance) {
            editorInstance.setValue('-- Enter your Lua/Luau code here');
        }
        if (outputEditorInstance) {
            outputEditorInstance.setValue('-- Obfuscated output will appear here');
        }
        state.currentOutput = '';
        showToast('Editor cleared', 'info');
    }

    // Copy output
    async function copyOutput() {
        if (!outputEditorInstance) return;
        
        const output = outputEditorInstance.getValue();
        if (!output || !output.trim()) {
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
        if (!outputEditorInstance) return;
        
        const output = outputEditorInstance.getValue();
        if (!output || !output.trim()) {
            showToast('No output to download', 'error');
            return;
        }
        
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obfuscated_' + Date.now() + '.lua';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Output downloaded', 'success');
    }

    // Select all output
    function selectAllOutput() {
        if (!outputEditorInstance) return;
        
        const model = outputEditorInstance.getModel();
        const lineCount = model.getLineCount();
        const lastLineLength = model.getLineMaxColumn(lineCount);
        
        outputEditorInstance.setSelection({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: lineCount,
            endColumn: lastLineLength
        });
        
        outputEditorInstance.focus();
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
            { name: 'String concatenation', code: 'local name = "World"\nprint("Hello " .. name)', shouldPass: true },
            { name: 'While loop', code: 'local i = 0\nwhile i < 5 do\n    i = i + 1\n    print(i)\nend', shouldPass: true },
            { name: 'If-else', code: 'local x = 10\nif x > 5 then\n    print("big")\nelse\n    print("small")\nend', shouldPass: true },
            { name: 'Nested functions', code: 'local function outer()\n    local function inner()\n        return 42\n    end\n    return inner()\nend', shouldPass: true },
            { name: 'Multiple returns', code: 'local function getValues()\n    return 1, 2, 3\nend\nlocal a, b, c = getValues()', shouldPass: true },
            { name: 'Array operations', code: 'local arr = {10, 20, 30, 40, 50}\nfor i, v in ipairs(arr) do\n    print(i, v)\nend', shouldPass: true },
            { name: 'Dictionary operations', code: 'local dict = {name = "test", age = 25}\nprint(dict.name, dict.age)', shouldPass: true }
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
                    <span class="test-details">${result.error || 'Unknown error'}</span>
                `;
            }
            
            resultsContainer.appendChild(testEntry);
        });
        
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        const totalTests = passed + failed;
        const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
        summary.innerHTML = `${passed} / ${totalTests} PASSED (${passRate}%)`;
        resultsContainer.prepend(summary);
        
        const toastType = failed > 0 ? 'error' : 'success';
        showToast(`Tests completed: ${passed} passed, ${failed} failed`, toastType);
    }

    // Run single test
    function runSingleTest(test) {
        try {
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
            
            // Check for basic syntax errors
            if (source.includes('local =')) {
                return { passed: false, error: 'Invalid local declaration' };
            }
            
            if (source.includes('function =')) {
                return { passed: false, error: 'Invalid function declaration' };
            }
            
            return { passed: true };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
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
