// APEX HUB Obfuscator - Simple App
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
        const inputLines = inputEditor.getValue().split('\n').length;
        const outputLines = outputEditor.getValue().split('\n').length;
        document.getElementById('inputCounter').textContent = inputLines + ' lines';
        document.getElementById('outputCounter').textContent = outputLines + ' lines';
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

    document.getElementById('obfuscateBtn').addEventListener('click', function() {
        const source = inputEditor.getValue();
        const btn = this;
        
        if (!source || !source.trim()) {
            showToast('Please paste Lua/Luau code first', true);
            return;
        }
        
        btn.classList.add('processing');
        btn.textContent = '⚡ PROCESSING...';
        
        setTimeout(() => {
            try {
                const obfuscator = new LuaObfuscator();
                const result = obfuscator.obfuscate(source);
                
                outputEditor.setValue(result);
                updateCounters();
                showToast('✓ Obfuscation completed');
            } catch (error) {
                showToast('Obfuscation failed: ' + error.message, true);
            } finally {
                btn.classList.remove('processing');
                btn.textContent = '⚡ OBFUSCATE';
            }
        }, 100);
    });
});
