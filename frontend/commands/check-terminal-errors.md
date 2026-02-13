# Always Check Terminal for Errors

## CRITICAL: Check All Terminal Output

Before confirming anything works or is fixed, ALWAYS:

1. **Read the ENTIRE terminal output**
2. **Look for error messages** (ERROR, WARN, Failed, Exception)
3. **Check bundling status** (iOS Bundled, Android Bundled)
4. **Verify no runtime errors** after app loads

## Common Error Patterns to Watch For

- `ERROR` - Something failed
- `Cannot find module` - Missing dependency
- `TypeError` - Wrong data type
- `Exception in HostFunction` - Native module error
- `Bundling failed` - Build error
- `expected X but got Y` - Type mismatch

## When You See Errors

1. **Read the full error message** (not just the first line)
2. **Identify the file/line** where error occurs
3. **Fix the root cause** (not just symptoms)
4. **Test again** before confirming

## Never Assume It Works

- Don't say "it should work now" without testing
- Don't say "try it" without verifying first
- Always check terminal output after changes
- Run test commands to verify fixes

## Testing Commands

```bash
# Start and monitor
npm start  # Watch for errors in output

# Check if app bundles
npx expo start --non-interactive &
sleep 15
# Read logs, look for "Bundled" success
pkill -f "expo start"
```

