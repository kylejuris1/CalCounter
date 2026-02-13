# Testing Workflow for Expo App

## ALWAYS Test Before Confirming

Before telling the user that something is fixed or works:

1. **Test the build:**
```bash
cd /Users/redabouziane/Documents/Code/marococo-nativeapp
npm install  # If packages changed
npx expo start --non-interactive &
sleep 15  # Wait for bundle
# Check logs for errors
pkill -f "expo start"
```

2. **If you made code changes:**
   - Test with simplified version first
   - Then restore full version
   - Always verify no errors in logs

3. **Common issues to check:**
   - TypeScript errors: `npx tsc --noEmit`
   - Package versions: Check Expo warnings
   - React Native prop types (string vs boolean)
   - Navigation setup

## Testing Checklist

- [ ] App bundles without errors
- [ ] No TypeScript errors
- [ ] Package versions match Expo SDK
- [ ] No runtime errors in logs
- [ ] Navigation works (if applicable)

## If Errors Occur

1. Read the full error message
2. Check package versions first
3. Clear cache: `rm -rf .expo node_modules/.cache`
4. Reinstall if needed: `rm -rf node_modules && npm install`
5. Test incrementally (basic → complex)

