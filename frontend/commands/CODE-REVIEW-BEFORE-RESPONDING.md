# MANDATORY: REVIEW ALL CODE BEFORE RESPONDING

## CRITICAL RULE:

**BEFORE** you finish implementing and respond to the user:

### 1. **REVIEW ENTIRE CODE FLOW**

Ask yourself:
- Does this make logical sense for **this specific platform** (mobile/web)?
- Is every step of the flow properly implemented?
- Are there any missing pieces?
- Does the code actually **work end-to-end**?

### 2. **CHECK FOR MISSING HANDLERS**

Common junior mistakes:
- ❌ OAuth redirect URL configured, but **no handler** to process it
- ❌ Deep link registered, but **no listener** to handle it
- ❌ API endpoint called, but **no error handling**
- ❌ Navigation set up, but **route doesn't exist**

### 3. **TRACE THE FULL USER JOURNEY**

For EVERY feature, trace the complete flow:

**Example: LinkedIn Login**
1. ✅ User clicks "Sign in with LinkedIn"
2. ✅ App calls Supabase OAuth
3. ✅ Browser opens LinkedIn
4. ✅ User logs in
5. ✅ LinkedIn redirects to `marococo://auth/callback`
6. ❌ **MISSING**: Deep link handler to process callback
7. ❌ **MISSING**: Extract tokens and create session
8. ❌ **RESULT**: User back on login screen, not logged in

**If ANY step is missing, FIX IT before responding.**

### 4. **ASK: DOES THIS ACTUALLY WORK?**

Before saying "here's the code":
- Can I trace the full flow?
- Are all handlers/listeners in place?
- Would this work if I were the user?
- Is there ANY missing piece?

## MANDATORY REVIEW CHECKLIST:

Before EVERY response:

- [ ] Full user journey traced
- [ ] All handlers/listeners implemented
- [ ] No missing pieces in the flow
- [ ] Code follows platform best practices
- [ ] Error handling in place
- [ ] Logic makes sense for THIS platform

## IF YOU FIND ISSUES:

**FIX THEM IMMEDIATELY** in the same response. Don't wait for the user to discover your mistakes.

### Example:

❌ BAD:
"Here's the OAuth code [incomplete, missing handler]"
[User tests, it doesn't work]
[User messages back]
"Oh, we need a handler too, here it is"

✅ GOOD:
"Here's the complete OAuth flow:
1. OAuth URL generation ✅
2. Browser opening ✅
3. Deep link handler ✅
4. Token processing ✅
5. Session storage ✅
6. Navigation to home ✅

Everything is implemented end-to-end."

## COST TO USER:

Every time you forget something:
- User has to test
- User has to report the issue
- User has to send another message
- User pays for extra messages

**This is stealing their money through incompetence.**

## THE STANDARD:

Think like a **SENIOR DEVELOPER**:
- Review your own code
- Catch your mistakes
- Implement complete solutions
- Don't waste user's time or money

