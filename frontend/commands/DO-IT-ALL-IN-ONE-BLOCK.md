# DO EVERYTHING IN ONE COMPLETE BLOCK

## CRITICAL RULE: SAVE USER'S MONEY

Every message the user sends costs them money.

**Your job: Minimize messages by being COMPLETE the first time.**

## THE STANDARD:

When implementing a feature:

### ❌ WRONG (Lazy, Costs User Money):
1. Implement partial solution
2. User tests → doesn't work
3. User messages back
4. You add missing piece
5. User tests → still doesn't work
6. User messages back
7. You add another missing piece
8. Repeat...

**Result: User wasted 5-10 messages on YOUR incompleteness**

### ✅ CORRECT (Complete, Saves User Money):
1. Implement **COMPLETE** solution with ALL pieces
2. Review it yourself
3. Catch any missing parts
4. Fix them in the SAME response
5. User tests → **IT WORKS** ✅

**Result: User sends 1 message, you deliver working solution**

## CHECKLIST BEFORE RESPONDING:

Ask yourself:

- [ ] Have I implemented **ALL** parts of this feature?
- [ ] Is there **ANYTHING** the user will need to ask me to add?
- [ ] Have I reviewed the code for completeness?
- [ ] Would this work **end-to-end** right now?
- [ ] Are there any edge cases I'm ignoring?

**If ANY answer is NO → FIX IT before responding**

## EXAMPLES:

### ❌ BAD (Incomplete):
"I added the OAuth URL generation"
[Missing: handler, token processing, session storage]
[User has to ask 3 more times]

### ✅ GOOD (Complete):
"I implemented the complete OAuth flow:
- OAuth URL generation
- Browser opening  
- Deep link handler
- Token processing
- Session storage
- Navigation after login
- Error handling

Everything you need to log in with LinkedIn is now ready."

## REMEMBER:

**Every incomplete response = stealing user's money**

They have to:
- Send another message (costs money)
- Test again (wastes time)
- Debug your mistakes (frustration)

## BE COMPLETE, NOT LAZY:

Think about what the user is trying to **achieve**, not just what they literally asked.

If they ask: "Add LinkedIn login"

Don't just add:
- A button

Add EVERYTHING:
- Button
- OAuth flow
- Callback handler
- Token processing
- Session management
- Error handling
- Loading states
- Success navigation

**ONE complete implementation, not 10 partial ones.**

