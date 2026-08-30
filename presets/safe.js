const SafePreset = {
    name: 'safe',
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
};

module.exports = SafePreset;
