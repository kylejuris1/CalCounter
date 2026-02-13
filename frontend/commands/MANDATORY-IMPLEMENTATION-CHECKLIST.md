# MANDATORY IMPLEMENTATION CHECKLIST

## BEFORE WRITING ANY CODE - ANSWER THESE:

### 1. **VERIFY THE API/METHOD EXISTS**
- [ ] Have I checked the **official documentation**?
- [ ] Does this method/function actually exist?
- [ ] Am I assuming something exists without verifying?
- [ ] Have I used this exact API before, or am I guessing?

**If you're not 100% sure → SEARCH THE DOCS or CHECK THE CODEBASE**

### 2. **UNDERSTAND THE PLATFORM**
- [ ] Is this web-specific logic I'm copying to mobile?
- [ ] Does mobile have different requirements?
- [ ] Am I thinking about THIS platform's constraints?
- [ ] Have I considered mobile-native patterns?

### 3. **TRACE THE COMPLETE FLOW**
- [ ] Can I trace every step from start to finish?
- [ ] Are there any missing handlers/listeners?
- [ ] Does every step logically connect to the next?
- [ ] What happens at EACH stage?

### 4. **CHECK FOR MISSING PIECES**
- [ ] Are all event listeners in place?
- [ ] Are all callbacks handled?
- [ ] Is error handling complete?
- [ ] Are there any gaps in the flow?

### 5. **VERIFY WITH EXISTING CODE**
- [ ] How does the web app do this?
- [ ] What can I reuse vs what needs to change?
- [ ] Are there similar patterns in the codebase?
- [ ] Have I checked how THIS project uses this library?

### 6. **TEST MENTALLY BEFORE IMPLEMENTING**
- [ ] If I were the user, would this work?
- [ ] Can I walk through the entire flow in my head?
- [ ] Are there any edge cases I'm missing?
- [ ] Would a senior developer approve this approach?

---

## AFTER WRITING CODE - REVIEW CHECKLIST:

### 7. **VERIFY ALL METHODS ARE REAL**
- [ ] Every method I called actually exists
- [ ] Every import is correct
- [ ] Every API is used correctly
- [ ] No assumptions about what "should" exist

### 8. **COMPLETE FLOW CHECK**
- [ ] User action → Expected outcome works
- [ ] All intermediate steps are handled
- [ ] Error states are covered
- [ ] Success states navigate correctly

### 9. **LOGS AND DEBUGGING**
- [ ] Added logs at every critical step
- [ ] Can trace the flow from logs
- [ ] Error messages are clear
- [ ] Success confirmations are visible

### 10. **FINAL SANITY CHECK**
- [ ] Would this actually work if deployed?
- [ ] Have I tested similar code before?
- [ ] Am I confident this is correct?
- [ ] Or am I hoping it works?

---

## RED FLAGS - STOP IF YOU SEE THESE:

### 🚩 "I think this method exists..."
**STOP → VERIFY IN DOCS**

### 🚩 "This should work like the web app..."
**STOP → CHECK PLATFORM DIFFERENCES**

### 🚩 "I'll just try this approach..."
**STOP → RESEARCH BEST PRACTICE**

### 🚩 "The user can test and tell me if it works..."
**STOP → YOU SHOULD KNOW IF IT WORKS**

### 🚩 "I'm not 100% sure but..."
**STOP → GET 100% SURE FIRST**

---

## EXAMPLE - OAUTH FLOW:

### ❌ WRONG (What I Did):
1. "I need to process OAuth URL"
2. "There should be a method like `getSessionFromUrl()`"
3. Implement without checking
4. User tests → Error: method doesn't exist
5. User wastes time and money

### ✅ CORRECT (What I Should Do):
1. "I need to process OAuth URL"
2. **CHECK:** Supabase JS SDK docs for OAuth methods
3. **FIND:** `supabase.auth.setSession({ access_token, refresh_token })`
4. **VERIFY:** This is the correct method
5. Parse URL manually to extract tokens
6. Call verified method
7. Implement with confidence
8. User tests → Works first time ✅

---

## THE RULE:

**NEVER implement without verifying the API exists.**

**ALWAYS check documentation before assuming.**

**NEVER hope it works - KNOW it works.**

---

## FAILURE COST:

Every time I implement without verifying:
- User tests → fails
- User messages back (costs money)
- User loses trust
- User wastes time
- I look incompetent

## SUCCESS BENEFIT:

When I verify first:
- Code works first try
- User saves money
- User saves time
- User trusts me
- I look professional

