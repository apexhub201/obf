const CONFIG = {
    VERSION: '1.0.0',
    DEFAULT_SEED: 12345,
    MAX_OUTPUT_SIZE: 1000000,
    SUPPORTED_EXTENSIONS: ['lua', 'luau'],
    LUA_KEYWORDS: [
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false',
        'for', 'function', 'goto', 'if', 'in', 'local', 'nil',
        'not', 'or', 'repeat', 'return', 'then', 'true', 'until',
        'while', 'continue'
    ],
    LUA_BUILTINS: [
        'assert', 'collectgarbage', 'dofile', 'error', 'getmetatable',
        'ipairs', 'load', 'loadfile', 'next', 'pairs', 'pcall',
        'print', 'rawequal', 'rawget', 'rawlen', 'rawset', 'require',
        'select', 'setmetatable', 'tonumber', 'tostring', 'type',
        'xpcall', 'warn', 'wait', 'spawn', 'delay', 'task', 'typeof',
        'game', 'workspace', 'script', 'shared', '_G', 'Instance',
        'Vector2', 'Vector3', 'Vector3int16', 'CFrame', 'Color3',
        'BrickColor', 'UDim', 'UDim2', 'Ray', 'Enum', 'math',
        'string', 'table', 'coroutine', 'utf8'
    ],
    ROBLOX_PROPERTIES: [
        'Name', 'Parent', 'Character', 'CharacterAdded', 'LocalPlayer',
        'WalkSpeed', 'Health', 'Position', 'MouseButton1Click',
        'InputBegan', 'InputChanged', 'Heartbeat', 'Connect', 'Create',
        'Play', 'GetService', 'WaitForChild', 'Value', 'Size', 'Text',
        'Frame', 'Visible', 'Color', 'Font', 'Position', 'Size'
    ],
    IDENTIFIER_STYLES: ['short', 'random', 'confusing', 'long', 'mixed'],
    STRING_MODES: ['none', 'split', 'encoded', 'pool', 'runtime', 'adaptive'],
    CONTROL_FLOW_LEVELS: ['off', 'low', 'medium', 'high', 'extreme'],
    PRESETS: ['safe', 'balanced', 'strong', 'extreme']
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
