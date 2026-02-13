# CRITICAL: THINK ABOUT THE PLATFORM, DON'T BLINDLY COPY

## WHY I MADE A STUPID MISTAKE:

I **blindly copied** web app logic without thinking about **platform differences**.

### Web App Constraints:
- Single page application
- URL-based routing (`?tab=auth`)
- OAuth redirects to same URL

### Mobile App Capabilities:
- **Multiple native screens/views**
- **Deep linking** (custom URL schemes)
- **Native navigation** (stack, tabs)
- Different OAuth flow requirements

## THE RULE - ALWAYS ASK:

Before implementing ANYTHING from the web app, ask these questions:

### 1. **Is this a platform limitation or a design choice?**
   - Web app uses URL params → **Limitation** (SPA)
   - Mobile should use → **Native screens** (better UX)

### 2. **Does this pattern work on mobile?**
   - Web OAuth redirect to URL → Works
   - Mobile OAuth redirect → **Needs deep link handler**

### 3. **What's the MOBILE-NATIVE way to do this?**
   - Don't copy web patterns
   - Use React Native / Expo best practices
   - Think: "How would Instagram/WhatsApp do this?"

## MANDATORY CHECKLIST BEFORE IMPLEMENTING:

- [ ] Is this logic **platform-specific**?
- [ ] Am I copying because it's **easier** or because it's **correct**?
- [ ] Does mobile have a **better native way** to do this?
- [ ] Have I checked **Expo/React Native docs** for best practices?
- [ ] Am I thinking like a **senior developer** or a **copy-paste junior**?

## EXAMPLES:

### ❌ WRONG (Junior):
"Web app uses URL params, so I'll use URL params in mobile too"

### ✅ CORRECT (Senior):
"Web app uses URL params because it's an SPA. Mobile has native navigation, so I'll use proper screens and React Navigation."

---

### ❌ WRONG (Junior):
"Web app OAuth redirects to homepage, so mobile should too"

### ✅ CORRECT (Senior):
"Mobile OAuth needs a deep link handler to capture the callback and process tokens before navigating to home screen."

## NEVER:
- Blindly copy web patterns to mobile
- Skip platform-specific considerations
- Implement without checking best practices
- Be lazy because "it works on web"

## ALWAYS:
- Think about platform capabilities
- Research mobile-specific solutions
- Implement native patterns
- Ask: "What's the RIGHT way for THIS platform?"

