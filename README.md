# APEX HUB OBFUSCATOR

## Advanced Lua / Luau Protection Suite

A professional-grade Lua/Luau obfuscation suite with advanced source transformation capabilities.

## Features

### Core Obfuscation
- **Lexical Analysis**: Full Lua/Luau lexer with token handling
- **AST Parsing**: Complete parser for Lua/Luau syntax
- **Scope Analysis**: Lexical scope graph with shadowing support
- **Identifier Renaming**: Multiple styles (short, random, confusing, long, mixed)
- **String Protection**: Split, encode, pool, runtime modes
- **Constant Transformation**: Number and boolean obfuscation
- **Table Transformation**: Safe reordering and encoding
- **Junk Code Injection**: Multiple junk patterns
- **Dead Code Insertion**: Unreachable blocks
- **Opaque Predicates**: Deterministic condition obfuscation
- **Control Flow Transformation**: Multiple levels including flattening
- **Code Packing**: Safe minification

### User Interface
- **Monaco Editor**: Full-featured code editor
- **Diff View**: Compare original and obfuscated code
- **Build Log**: Stage-by-stage progress
- **Statistics**: Detailed transformation metrics
- **Presets**: Safe, Balanced, Strong, Extreme
- **Advanced Settings**: Full control over all transformations
- **Test Suite**: Built-in regression tests

### Safety Features
- **AST Validation**: After every pass
- **Rollback**: Automatic on validation failure
- **Property/Method Safety**: Preserves Roblox API names
- **Protected Identifiers**: Whitelist for built-ins and globals
- **Output Validation**: Lexical and syntactical checks
- **Deterministic Builds**: With seed support

## Installation

```bash
# Clone the repository
git clone https://github.com/apex-hub/obfuscator.git

# Navigate to project directory
cd obfuscator

# Install dependencies (optional - for build tools)
npm install

# Start development server
python3 -m http.server 8080

# Or use live-server for auto-reload
npx live-server --port=8080
