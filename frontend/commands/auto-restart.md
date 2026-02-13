# Auto-Restart After Changes

## Automatically Restart Expo

After making changes to:
- Navigation files
- Configuration files  
- Adding new packages
- Fixing errors

Run this command automatically:

```bash
npm run restart
```

## When to Auto-Restart

- After fixing any error
- After installing packages
- After changing navigation structure
- After major code changes
- Before telling user to test

## Command Behavior

The `npm run restart` command will:
1. Kill any running Expo processes
2. Clear cache (.expo, node_modules/.cache)
3. Start Expo fresh with clean state

## Alternative

If you only need clean cache (server already stopped):
```bash
npm run start:clean
```

