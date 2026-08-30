// APEX HUB Obfuscator - Application Logic
require(['vs/editor/editor.main'], function() {
    // Monaco Editor instances
    const inputEditor = monaco.editor.create(document.getElementById('inputEditor'), {
        value: `-- Example Lua/Luau code\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\nlocal character = player.Character\n\nlocal function greet(name)\n    print("Hello " .. name)\nend\n\ngreet(player.Name)`,
        language: 'lua',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on'
    });

    const outputEditor = monaco.editor.create(document.getElementById('outputEditor'), {
        value: '',
        language: 'lua',
        theme: 'vs-dark',
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on'
    });

    // Update counters
    function updateCounters() {
        const inputCode = inputEditor.getValue();
        const inputLines = inputCode.split('\n').length;
        const inputChars = inputCode.length;
        document.getElementById('inputCounter').innerText = `Lines: ${inputLines} | Characters: ${inputChars}`;

        const outputCode = outputEditor.getValue();
        const outputLines = outputCode.split('\n').length;
        const outputChars = outputCode.length;
        document.getElementById('outputCounter').innerText = `Lines: ${outputLines} | Characters: ${outputChars}`;
        document.getElementById('outputSizeInfo').innerText = `Size: ${(outputChars/1024).toFixed(2)} KB`;
    }

    inputEditor.onDidChangeModelContent(updateCounters);
    outputEditor.onDidChangeModelContent(updateCounters);
    updateCounters();

    // Settings state
    const settings = {
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
        seed: Math.floor(Math.random() * 999999)
    };

    function syncUIFromSettings() {
        document.getElementById('optRenameVars').checked = settings.renameVariables;
        document.getElementById('optRenameFuncs').checked = settings.renameFunctions;
        document.getElementById('optStringProtect').checked = settings.stringProtection;
        document.getElementById('optConstTransform').checked = settings.constantTransform;
        document.getElementById('optControlFlow').checked = settings.controlFlow;
        document.getElementById('optDeadCode').checked = settings.deadCode;
        document.getElementById('optMinify').checked = settings.minify;
        document.getElementById('optPreserveGlobals').checked = settings.preserveGlobals;
        document.getElementById('optPreserveAPI').checked = settings.preserveAPI;
        document.getElementById('runtimeSelect').value = settings.targetRuntime;
    }

    function readSettingsFromUI() {
        settings.renameVariables = document.getElementById('optRenameVars').checked;
        settings.renameFunctions = document.getElementById('optRenameFuncs').checked;
        settings.stringProtection = document.getElementById('optStringProtect').checked;
        settings.constantTransform = document.getElementById('optConstTransform').checked;
        settings.controlFlow = document.getElementById('optControlFlow').checked;
        settings.deadCode = document.getElementById('optDeadCode').checked;
        settings.minify = document.getElementById('optMinify').checked;
        settings.preserveGlobals = document.getElementById('optPreserveGlobals').checked;
        settings.preserveAPI = document.getElementById('optPreserveAPI').checked;
        settings.targetRuntime = document.getElementById('runtimeSelect').value;
        settings.seed = Math.floor(Math.random() * 999999);
    }

    syncUIFromSettings();

    document.querySelectorAll('.toggle-item input').forEach(input => {
        input.addEventListener('change', readSettingsFromUI);
    });
    document.getElementById('runtimeSelect').addEventListener('change', readSettingsFromUI);

    // Presets
    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            if (preset === 'safe') {
                settings.renameVariables = true;
                settings.renameFunctions = true;
                settings.stringProtection = false;
                settings.constantTransform = false;
                settings.controlFlow = false;
                settings.deadCode = false;
                settings.minify = true;
            } else if (preset === 'balanced') {
                settings.renameVariables = true;
                settings.renameFunctions = true;
                settings.stringProtection = true;
                settings.constantTransform = true;
                settings.controlFlow = false;
                settings.deadCode = false;
                settings.minify = true;
            } else if (preset === 'strong') {
                settings.renameVariables = true;
                settings.renameFunctions = true;
                settings.stringProtection = true;
                settings.constantTransform = true;
                settings.controlFlow = true;
                settings.deadCode = true;
                settings.minify = true;
            } else if (preset === 'max') {
                settings.renameVariables = true;
                settings.renameFunctions = true;
                settings.stringProtection = true;
                settings.constantTransform = true;
                settings.controlFlow = true;
                settings.deadCode = true;
                settings.minify = true;
            }
            syncUIFromSettings();
        });
    });

    document.getElementById('resetSettingsBtn').addEventListener('click', () => {
        settings.renameVariables = true;
        settings.renameFunctions = true;
        settings.stringProtection = true;
        settings.constantTransform = true;
        settings.controlFlow = true;
        settings.deadCode = true;
        settings.minify = true;
        settings.preserveGlobals = true;
        settings.preserveAPI = true;
        settings.targetRuntime = 'roblox';
        syncUIFromSettings();
    });

    // Toast
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.borderColor = type === 'error' ? 'rgba(245,139,139,0.7)' : 'rgba(107,213,160,0.6)';
        toast.classList.add('show');
        clearTimeout(toast._hideTimeout);
        toast._hideTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // Obfuscate action
    document.getElementById('obfuscateBtn').addEventListener('click', () => {
        const source = inputEditor.getValue();
        if (!source || !source.trim()) {
            showToast('Please paste Lua/Luau code first.', 'error');
            return;
        }

        readSettingsFromUI();
        const obfuscator = new LuaObfuscator(settings);
        
        const btn = document.getElementById('obfuscateBtn');
        btn.style.opacity = '0.6';
        btn.textContent = '⚡ PROCESSING...';
        
        setTimeout(() => {
            try {
                const result = obfuscator.obfuscate(source);
                outputEditor.setValue(result);
                const originalLines = source.split('\n').length;
                const outputLines = result.split('\n').length;
                document.getElementById('outputOriginalInfo').innerText = `Original: ${originalLines} lines | Output: ${outputLines} lines`;
                showToast('✓ Obfuscation completed', 'success');
            } catch (e) {
                showToast('Obfuscation failed: ' + e.message, 'error');
            } finally {
                btn.style.opacity = '1';
                btn.textContent = '⚡ OBFUSCATE';
                updateCounters();
            }
        }, 80);
    });

    // Copy
    document.getElementById('copyBtn').addEventListener('click', () => {
        const code = outputEditor.getValue();
        if (!code) {
            showToast('No output to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(code).then(() => showToast('Copied to clipboard'));
    });

    // Download
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const code = outputEditor.getValue();
        if (!code) {
            showToast('No output to download', 'error');
            return;
        }
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obfuscated.lua';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Validate
    document.getElementById('validateBtn').addEventListener('click', () => {
        const code = outputEditor.getValue();
        if (!code) {
            showToast('No output to validate', 'error');
            return;
        }
        try {
            const obfuscator = new LuaObfuscator(settings);
            obfuscator.validateLuaSyntax(code);
            showToast('✓ Syntax is valid');
        } catch (e) {
            showToast('Validation error: ' + e.message, 'error');
        }
    });

    // Clear input/output
    document.getElementById('clearInputBtn').addEventListener('click', () => {
        inputEditor.setValue('');
    });
    document.getElementById('clearOutputBtn').addEventListener('click', () => {
        outputEditor.setValue('');
        updateCounters();
    });

    // Format input
    document.getElementById('formatInputBtn').addEventListener('click', () => {
        try {
            const code = inputEditor.getValue();
            const formatted = code.replace(/\n\s*\n/g, '\n');
            inputEditor.setValue(formatted);
            showToast('Input formatted (basic)');
        } catch (e) {
            showToast('Format error', 'error');
        }
    });

    updateCounters();
});
