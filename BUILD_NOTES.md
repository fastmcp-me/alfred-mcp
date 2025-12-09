# Build Notes

## TypeScript Compilation Issue

The TypeScript compiler may encounter heap memory issues when compiling all files together due to complex type recursion in the tool files.

### Workarounds

1. **For Smithery Deployment (HTTP Mode)**:
   - Smithery handles builds on their platform
   - No local build required
   - Simply connect your GitHub repo

2. **For STDIO Mode (Claude Desktop)**:
   - Use npx which handles compilation automatically:
     ```bash
     npx -y @alfred/mcp-server
     ```

3. **For Local Development**:
   - Build with increased Node.js memory:
     ```bash
     NODE_OPTIONS="--max-old-space-size=8192" npx tsc
     ```
   - Or compile files individually if needed

## Why This Happens

The issue occurs due to:
- Complex Zod schema recursion in tool input validation
- Deep type inference chains
- Multiple circular type references between SDK types

This is a known TypeScript compiler limitation and does not affect runtime code quality.

## Alternative: Use Smithery Build

The recommended approach is to use Smithery's build system which handles these TypeScript complexities automatically.
