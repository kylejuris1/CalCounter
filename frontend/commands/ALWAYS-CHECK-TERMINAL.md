# ALWAYS CHECK TERMINAL LOGS

## MANDATORY - NEVER SKIP THIS

### After Running ANY Command:

1. **Wait for command to complete**
2. **Read the FULL terminal output**
3. **Look for errors:**
   - ERROR
   - WARN
   - Failed
   - Exception
   - Cannot find
   - undefined
   - null

4. **If errors found:**
   - STOP immediately
   - Don't tell user "it should work"
   - FIX THE ERROR FIRST
   - Test again
   - Only then respond to user

5. **When starting app:**
   - Wait at least 20 seconds for bundling
   - Check bundle succeeded
   - Look for runtime errors
   - Check app actually loaded

### Before Saying "Test Now":

- ✅ Terminal shows no errors
- ✅ App bundled successfully  
- ✅ No runtime exceptions
- ✅ Verified the fix addresses the issue

### Terminal Management:

- Reuse existing terminals when possible
- Kill old processes before starting new ones
- Don't create 20 terminals
- Clean up after yourself

## NEVER:
- Say "test now" without checking logs first
- Ignore error messages
- Assume it works without verification
- Create unnecessary terminals

