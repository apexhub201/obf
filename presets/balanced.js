const BalancedPreset = {
    name: 'balanced',
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
};

module.exports = BalancedPreset;
