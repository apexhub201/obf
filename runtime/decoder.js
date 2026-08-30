class Decoder {
    static decodeString(encoded, seed) {
        const chars = encoded.split('');
        const decoded = chars.map((char, index) => {
            const key = (seed + index * 7 + 13) % 256;
            return String.fromCharCode(char.charCodeAt(0) ^ key);
        }).join('');
        
        return decoded;
    }

    static generateStringDecoder() {
        return `local function decodeString(str, seed)
    local result = {}
    for i = 1, #str do        local char = string.sub(str, i, i)
        local key = (seed + (i - 1) * 7 + 13) % 256
        local decoded = string.char(string.byte(char) ~ key)
        result[#result + 1] = decoded
    end
    return table.concat(result)
end`;
    }
}

module.exports = { Decoder };
