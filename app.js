// APEX HUB Obfuscator - Application Logic
require(['vs/editor/editor.main'], function() {
    const inputEditor = monaco.editor.create(document.getElementById('inputEditor'), {
        value: `local Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\nlocal character = player.Character\n\nlocal function greet(name)\n    print("Hello " .. name)\nend\n\ngreet(player.Name)`,
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

    function updateCounters() {
        const inputCode = inputEditor.getValue();
        document.getElementById('inputCounter').textContent = 
            `Lines: ${inputCode.split('\n').length} | Chars: ${inputCode.length}`;
        
        const outputCode = outputEditor.getValue();
        document.getElementById('outputCounter').textContent = 
            `Lines: ${outputCode.split('\n').length} | Chars: ${outputCode.length}`;
    }

    inputEditor.onDidChangeModelContent(updateCounters);
    outputEditor.onDidChangeModelContent(updateCounters);
    updateCounters();

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + (isError ? 'error' : 'success');
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    function getSettings() {
        return {
            renameVariables: document.getElementById('optRename').checked,
            stringProtection: document.getElementById('optStringProtect').checked,
            stringPool: document.getElementById('optStringPool').checked,
            constantObfuscation: document.getElementById('optConstObf').checked,
            junkCode: document.getElementById('optJunk').checked,
            deadCode: document.getElementById('optDeadCode').checked,
            opaquePredicates: document.getElementById('optOpaque').checked,
            controlFlow: document.getElementById('optControlFlow').checked,
            minify: document.getElementById('optMinify').checked,
            packedOutput: document.getElementById('optPacked').checked,
            seed: Math.floor(Math.random() * 999999)
        };
    }

    function applyPreset(preset) {
        const presets = {
            safe: {
                renameVariables: true,
                stringProtection: false,
                stringPool: false,
                constantObfuscation: false,
                junkCode: false,
                deadCode: false,
                opaquePredicates: false,
                controlFlow: false,
                minify: true,
                packedOutput: true
            },
            balanced: {
                renameVariables: true,
                stringProtection: true,
                stringPool: true,
                constantObfuscation: true,
                junkCode: false,
                deadCode: false,
                opaquePredicates: false,
                controlFlow: false,
                minify: true,
                packedOutput: true
            },
            strong: {
                renameVariables: true,
                stringProtection: true,
                stringPool: true,
                constantObfuscation: true,
                junkCode: true,
                deadCode: true,
                opaquePredicates: true,
                controlFlow: false,
                minify: true,
                packedOutput: true
            },
            extreme: {
                renameVariables: true,
                stringProtection: true,
                stringPool: true,
                constantObfuscation: true,
                junkCode: true,
                deadCode: true,
                opaquePredicates: true,
                controlFlow: true,
                minify: true,
                packedOutput: true
            }
        };
        
        const settings = presets[preset];
        if (settings) {
            document.getElementById('optRename').checked = settings.renameVariables;
            document.getElementById('optStringProtect').checked = settings.stringProtection;
            document.getElementById('optStringPool').checked = settings.stringPool;
            document.getElementById('optConstObf').checked = settings.constantObfuscation;
            document.getElementById('optJunk').checked = settings.junkCode;
            document.getElementById('optDeadCode').checked = settings.deadCode;
            document.getElementById('optOpaque').checked = settings.opaquePredicates;
            document.getElementById('optControlFlow').checked = settings.controlFlow;
            document.getElementById('optMinify').checked = settings.minify;
            document.getElementById('optPacked').checked = settings.packedOutput;
        }
    }

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            applyPreset(btn.getAttribute('data-preset'));
        });
    });

    // Obfuscate button
    document.getElementById('obfuscateBtn').addEventListener('click', function() {
        const source = inputEditor.getValue();
        const btn = this;
        
        if (!source || !source.trim()) {
            showToast('Please paste Lua/Luau code first', true);
            return;
        }
        
        btn.classList.add('processing');
        btn.textContent = '⚡ PROCESSING...';
        
        // Show build log
        const buildLog = document.getElementById('buildLog');
        buildLog.classList.add('active');
        buildLog.textContent = 'Starting obfuscation...';
        
        setTimeout(() => {
            try {
                const settings = getSettings();
                const engine = new window.ApexObfuscator.LuaObfuscatorEngine(settings);
                const result = engine.obfuscate(source);
                
                outputEditor.setValue(result.code);
                updateCounters();
                
                // Update build log
                buildLog.textContent = result.log.join('\n');
                
                // Show stats
                const statsPanel = document.getElementById('statsPanel');
                statsPanel.classList.add('active');
                statsPanel.innerHTML = `
                    <span>Identifiers: ${result.stats.identifiersRenamed}</span>
                    <span>Strings: ${result.stats.stringsProtected}</span>
                    <span>Constants: ${result.stats.constantsTransformed}</span>
                    <span>Junk Blocks: ${result.stats.junkBlocksAdded}</span>
                    <span>Passes: ${result.stats.passesApplied}</span>
                `;
                
                showToast('✓ Obfuscation completed');
            } catch (error) {
                showToast('Obfuscation failed: ' + error.message, true);
                buildLog.textContent += '\n\nERROR: ' + error.message;
            } finally {
                btn.classList.remove('processing');
                btn.textContent = '⚡ OBFUSCATE';
            }
        }, 100);
    });

    // Test engine button
    document.getElementById('testEngineBtn').addEventListener('click', function() {
        const result = window.ApexObfuscator.runSelfTest();
        
        const buildLog = document.getElementById('buildLog');
        buildLog.classList.add('active');
        
        if (result.passed === result.total) {
            buildLog.textContent = `${result.passed} / ${result.total} TESTS PASSED`;
            showToast('✓ All tests passed');
        } else {
            buildLog.textContent = `${result.passed} / ${result.total} TESTS PASSED\n`;
            for (const r of result.results) {
                if (!r.passed) {
                    buildLog.textContent += `\nFAILED: ${r.input.substring(0, 50)}...`;
                    if (r.error) {
                        buildLog.textContent += `\n  Error: ${r.error}`;
                    }
                }
            }
            showToast('Some tests failed', true);
        }
    });
});
