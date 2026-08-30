class UI {
    constructor() {
        this.elements = {};
        this.cacheDom();
        this.bindEvents();
    }

    cacheDom() {
        this.elements = {
            buildBtn: document.getElementById('buildBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            pasteBtn: document.getElementById('pasteBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            fileInput: document.getElementById('fileInput'),
            buildLog: document.getElementById('buildLog'),
            statsGrid: document.getElementById('statsGrid'),
            toastContainer: document.getElementById('toastContainer'),
            settingsBtn: document.getElementById('settingsBtn'),
            runTestsBtn: document.getElementById('runTestsBtn'),
            testResults: document.getElementById('testResults'),
            seedInput: document.getElementById('seedInput'),
            identStyle: document.getElementById('identStyle'),
            stringMode: document.getElementById('stringMode'),
            junkDensity: document.getElementById('junkDensity'),
            cflowLevel: document.getElementById('cflowLevel'),
            packLevel: document.getElementById('packLevel'),
            maxOutput: document.getElementById('maxOutput'),
            preserveApis: document.getElementById('preserveApis'),
            preserveGlobals: document.getElementById('preserveGlobals'),
            deterministicBuild: document.getElementById('deterministicBuild')
        };
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Preset selection
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPreset(e.target.dataset.preset));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.elements.buildBtn.click();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.elements.downloadBtn.click();
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    selectPreset(preset) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });
    }

    updateBuildButton(isBuilding) {
        this.elements.buildBtn.style.display = isBuilding ? 'none' : 'inline-block';
        this.elements.cancelBtn.style.display = isBuilding ? 'inline-block' : 'none';
    }

    addLogEntry(stage, status, message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-stage">${stage}</span>
            <span class="log-status ${status.toLowerCase()}">${status}</span>
            <span class="log-message">${message}</span>
        `;
        this.elements.buildLog.appendChild(entry);
        this.elements.buildLog.scrollTop = this.elements.buildLog.scrollHeight;
    }

    clearLog() {
        this.elements.buildLog.innerHTML = '';
    }

    updateStats(stats) {
        const statElements = {
            originalSize: document.getElementById('originalSize'),
            outputSize: document.getElementById('outputSize'),
            passesApplied: document.getElementById('passesApplied'),
            stringsProtected: document.getElementById('stringsProtected'),
            varsRenamed: document.getElementById('varsRenamed'),
            junkBlocks: document.getElementById('junkBlocks')
        };

        for (const [key, element] of Object.entries(statElements)) {
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => this.elements.toastContainer.removeChild(toast), 300);
        }, 3000);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
