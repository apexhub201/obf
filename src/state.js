class State {
    constructor() {
        this.currentPreset = 'strong';
        this.settings = {
            seed: CONFIG.DEFAULT_SEED,
            identStyle: 'random',
            stringMode: 'encoded',
            junkDensity: 50,
            controlFlowLevel: 'medium',
            packLevel: 2,
            maxOutput: '5',
            preserveApis: true,
            preserveGlobals: true,
            deterministicBuild: false
        };
        this.protectionToggles = {
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
        };
        this.buildState = 'idle'; // idle | building | cancelled | complete | failed
        this.buildLog = [];
        this.stats = {
            originalSize: 0,
            outputSize: 0,
            originalLines: 0,
            outputLines: 0,
            varsRenamed: 0,
            paramsRenamed: 0,
            stringsProtected: 0,
            constantsTransformed: 0,
            junkBlocks: 0,
            deadBlocks: 0,
            controlFlowTransforms: 0,
            tablesTransformed: 0,
            passesApplied: 0,
            passesRolledBack: 0
        };
        this.worker = null;
        this.currentSource = '';
        this.currentOutput = '';
    }

    updateSettings(updates) {
        Object.assign(this.settings, updates);
        this.saveToLocalStorage();
    }

    updateToggles(updates) {
        Object.assign(this.protectionToggles, updates);
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('apexSettings', JSON.stringify({
                preset: this.currentPreset,
                settings: this.settings,
                toggles: this.protectionToggles
            }));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('apexSettings');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.preset) this.currentPreset = data.preset;
                if (data.settings) Object.assign(this.settings, data.settings);
                if (data.toggles) Object.assign(this.protectionToggles, data.toggles);
                return true;
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
        return false;
    }

    resetStats() {
        this.stats = {
            originalSize: 0,
            outputSize: 0,
            originalLines: 0,
            outputLines: 0,
            varsRenamed: 0,
            paramsRenamed: 0,
            stringsProtected: 0,
            constantsTransformed: 0,
            junkBlocks: 0,
            deadBlocks: 0,
            controlFlowTransforms: 0,
            tablesTransformed: 0,
            passesApplied: 0,
            passesRolledBack: 0
        };
    }
}

const state = new State();
