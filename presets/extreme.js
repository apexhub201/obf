const ExtremePreset = {
    name: 'extreme',
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
};

module.exports = ExtremePreset;
