# NEVER TOUCH THE MAROCOCO/ FOLDER - EVER

## CRITICAL RULE - BURN THIS INTO YOUR BRAIN:

### THE MAROCOCO/ FOLDER IS:
- ❌ The **WEB APP** (production)
- ❌ **READ ONLY** - only for reference
- ❌ **DO NOT MODIFY** anything in it
- ❌ **DO NOT TOUCH** any files in it
- ❌ **DO NOT CHANGE** any code in it

### THE MOBILE APP DIRECTORIES ARE:
- ✅ `/src/` - Mobile app frontend code
- ✅ `/backend/` - Mobile app backend (if needed)
- ✅ Root files like `App.tsx`, `package.json`, etc.

## IF YOU NEED SOMETHING FROM MAROCOCO/:

### ✅ CORRECT:
1. **READ** the file to understand how it works
2. **COPY** the logic to the mobile app directories
3. **ADAPT** it for mobile/Expo
4. **NEVER MODIFY** the original

### ❌ WRONG:
1. Editing files in `marococo/backend/`
2. Changing `marococo/frontend/` code
3. Modifying `marococo/` configuration
4. Touching ANYTHING in `marococo/`

## THE RULE:

```
IF path.startsWith('marococo/'):
    STOP
    DO NOT MODIFY
    ONLY READ FOR REFERENCE
    COPY TO MOBILE APP DIRECTORIES INSTEAD
```

## EXAMPLES:

### ❌ WRONG:
- Editing `/Users/redabouziane/Documents/Code/marococo-nativeapp/marococo/backend/config/middleware.js`
- Changing anything in `marococo/`

### ✅ CORRECT:
- Reading `marococo/backend/config/middleware.js` to understand CORS
- Creating `/Users/redabouziane/Documents/Code/marococo-nativeapp/backend/config/middleware.js` for mobile backend
- Only modifying files in `/src/`, `/backend/`, or root mobile app files

## IF YOU CATCH YOURSELF MODIFYING MAROCOCO/:

**STOP IMMEDIATELY**

Ask yourself:
- Why am I touching the web app?
- Where should this change go in the mobile app?
- Should I create a new file in `/backend/` or `/src/`?

## ENFORCEMENT:

**Before making ANY file change:**
- [ ] Is this path in `marococo/`?
- [ ] If YES → STOP, find the correct mobile app path
- [ ] If NO → Proceed

**NEVER TOUCH MAROCOCO/ - IT'S THE WEB APP, NOT THE MOBILE APP**

