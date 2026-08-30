const CallbackTests = {
    name: 'Callback Tests',
    tests: [
        {
            name: 'Simple callback',
            source: 'local function callback()\n    print("called")\nend\ncallback()',
            expectValid: true
        },
        {
            name: 'Callback with arguments',
            source: 'local function callback(x, y)\n    return x + y\nend\nlocal result = callback(1, 2)',
            expectValid: true
        },
        {
            name: 'Event connection',
            source: 'game:GetService("Players").LocalPlayer.CharacterAdded:Connect(function(character)\n    print(character.Name)\nend)',
            expectValid: true
        },
        {
            name: 'Multiple callbacks',
            source: 'local function cb1() end\nlocal function cb2() end\ncb1()\ncb2()',
            expectValid: true
        }
    ]
};

module.exports = CallbackTests;
