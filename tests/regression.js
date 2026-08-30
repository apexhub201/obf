const RegressionTests = {
    name: 'Regression Tests',
    tests: [
        {
            name: 'Complex program',
            source: `local Players = game:GetService("Players")
local player = Players.LocalPlayer

local function setupCharacter(character)
    local humanoid = character:WaitForChild("Humanoid")
    humanoid.WalkSpeed = 16
    humanoid.Health = 100
end

player.CharacterAdded:Connect(setupCharacter)
player.CharacterAdded:Connect(function(character)
    print("Character added:", character.Name)
end)`,
            expectValid: true
        },
        {
            name: 'Scope shadowing',
            source: `local x = 1

do
    local x = 2
    print(x)
end

print(x)`,
            expectValid: true
        },
        {
            name: 'Complex expressions',
            source: `local a = 10
local b = 20
local c = (a + b) * 2
local d = a * b / (a + b)
local e = a ^ 2 + b ^ 2`,
            expectValid: true
        },
        {
            name: 'String manipulation',
            source: `local name = "World"
local greeting = "Hello " .. name
local upper = string.upper(greeting)
local lower = string.lower(greeting)
local len = string.len(greeting)`,
            expectValid: true
        },
        {
            name: 'Table operations',
            source: `local data = {
    name = "Test",
    values = {1, 2, 3, 4, 5},
    nested = {a = 1, b = 2}
}

for key, value in pairs(data) do
    print(key, value)
end

for index, value in ipairs(data.values) do
    print(index, value)
end`,
            expectValid: true
        }
    ]
};

module.exports = RegressionTests;
