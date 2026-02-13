# Restart Workflow

## After Making Changes

Always restart the Expo server to see changes take effect:

```bash
npm run restart
```

This will:
1. Kill any running Expo processes
2. Clear cache
3. Start fresh

## Alternative Commands

```bash
# If server already stopped, just start clean:
npm run start:clean

# Or manually:
npx expo start -c

# If major changes (packages, etc):
rm -rf node_modules && npm install && npm start
```

## When to Restart

- After installing new packages
- After changing navigation structure  
- After changing native code (rare)
- If seeing stale/cached content
- After fixing errors

## Testing on iPhone

1. Start server: `npm start`
2. Scan QR code with iPhone Camera or Expo Go
3. App loads automatically
4. Changes hot-reload (no restart needed for code changes)
5. Shake phone → Developer menu → Reload (if hot reload fails)

