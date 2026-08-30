const RobloxTests = {
    name: 'Roblox Tests',
    tests: [
        {
            name: 'GetService',
            source: 'local Players = game:GetService("Players")',
            expectValid: true
        },
        {
            name: 'LocalPlayer',
            source: 'local player = game:GetService("Players").LocalPlayer',
            expectValid: true
        },
        {
            name: 'Character',
            source: 'local character = player.Character or player.CharacterAdded:Wait()',
            expectValid: true
        },
        {
            name: 'WaitForChild',
            source: 'local humanoid = character:WaitForChild("Humanoid")',
            expectValid: true
        },
        {
            name: 'TweenService',
            source: 'local tweenService = game:GetService("TweenService")',
            expectValid: true
        },
        {
            name: 'UserInputService',
            source: 'local uis = game:GetService("UserInputService")',
            expectValid: true
        }
    ]
};

module.exports = RobloxTests;
