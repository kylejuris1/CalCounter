# Expo App Structure & Conventions

## Project Structure

```
marococo-nativeapp/
├── App.tsx                 # Entry point (Capital A = React component)
├── src/
│   ├── navigation/         # Navigation logic
│   ├── screens/            # Full-screen views (Capital letter)
│   ├── components/         # Reusable UI (Capital letter)
│   ├── services/           # API/backend communication (lowercase)
│   ├── constants/          # Theme, config (lowercase)
│   └── utils/              # Helper functions (lowercase)
└── backend/                # Backend (UNCHANGED from web app)
```

## Naming Conventions

- **React Components:** Capital letter (App.tsx, HomeScreen.tsx, ProfileCard.tsx)
- **Utilities/Services:** lowercase (auth.ts, config.ts, utils.ts)
- **Screens:** Always end with "Screen" (WelcomeScreen, HomeScreen)
- **Navigation:** End with "Navigator" (RootNavigator, AuthNavigator)

## Code Conversion Rules (Web → Mobile)

### HTML → React Native Components
- `<div>` → `<View>`
- `<button>` → `<TouchableOpacity>` or `<Pressable>`
- `<h1>`, `<p>`, `<span>` → `<Text>`
- `<img>` → `<Image>`
- `<input>` → `<TextInput>`
- `<a>` → `<TouchableOpacity>` with navigation

### Styling
- NO Tailwind CSS or className
- Use `StyleSheet.create({})`
- All dimensions are numbers (no 'px')
- Colors are strings: '#FAF9F7'
- fontWeight MUST be string: '400', '500', '600', '700', 'bold'

### Events
- `onClick` → `onPress`
- `onChange` → `onChangeText` (for TextInput)

## Backend Integration

- Backend code is UNCHANGED (exact copy from web app)
- API calls use `fetch()` (same as web)
- Change API_URL from `localhost` to Mac's IP: `192.168.110.191:5015`
- All API logic in `/src/services/auth.ts`

## Navigation Flow

```
RootNavigator (checks auth)
├── AuthNavigator (if not authenticated)
│   ├── Welcome → SignUp
│   └── Welcome → Auth (Login)
└── AppNavigator (if authenticated)
    ├── MainTabNavigator (Bottom tabs)
    │   ├── Home
    │   ├── Browse
    │   ├── Messages
    │   └── Profile
    └── IndividualProfile (overlay)
```

## When Adding New Features

1. **New Screen:**
   - Create in `/src/screens/ScreenName.tsx`
   - Add to appropriate Navigator
   - Add type to `/src/navigation/types.ts`

2. **New Component:**
   - Create in `/src/components/ComponentName.tsx`
   - Import and use in screens

3. **New API Call:**
   - Add method to `/src/services/auth.ts`
   - Follow existing pattern

4. **Copying from Web App:**
   - Convert HTML → React Native components
   - Convert Tailwind → StyleSheet
   - Keep logic identical
   - Test incrementally

