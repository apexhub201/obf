const StrongPreset = {
    name: 'strong',
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
};

module.exports = StrongPreset;
