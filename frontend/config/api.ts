/**
 * API Configuration
 * 
 * To change the API URL:
 * 1. Update the API_BASE_URL constant below
 * 2. Or set EXPO_PUBLIC_API_URL environment variable
 * 
 * To find your computer's IP address:
 * - Windows: Open Command Prompt and run `ipconfig`
 * - Mac/Linux: Open Terminal and run `ifconfig`
 * - Look for "IPv4 Address" under your active network adapter
 */

// Default API URL for development
// 
// IMPORTANT: Change this to your computer's IP address when testing on a physical device!
// 
// 🔥 MOBILE HOTSPOT USERS:
//   If you're connecting via mobile hotspot (not same Wi-Fi network):
//   1. Make sure your computer is sharing internet via hotspot
//   2. Find your computer's IP on the hotspot network:
//      - Windows: Open Command Prompt → run `ipconfig`
//      - Look for the adapter that shows your hotspot connection
//      - Common hotspot IP ranges: 192.168.137.x or 192.168.43.x
//   3. Use that IP address here (e.g., 'http://192.168.137.1:5000')
//
// 📶 SAME NETWORK USERS:
//   If you're on the same Wi-Fi network:
//   - Windows: Open Command Prompt → run `ipconfig` → look for "IPv4 Address"
//   - Mac/Linux: Open Terminal → run `ifconfig` → look for "inet" under your active adapter
//
// Examples:
//   For mobile hotspot: 'http://192.168.137.1:5000' (common hotspot gateway)
//   For same network: 'http://192.168.1.36:5000' (your router's network)
//   For emulator/web: 'http://localhost:5000'
//
// You can also set EXPO_PUBLIC_API_URL environment variable instead of changing this file
const DEFAULT_API_URL = 'http://localhost:5000';

// Production API URL (used when not in development mode)
const PRODUCTION_API_URL = 'https://your-production-api.com';

/**
 * Get the API base URL
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable
 * 2. REACT_APP_API_URL environment variable (for web)
 * 3. DEFAULT_API_URL (development) or PRODUCTION_API_URL (production)
 */
export const getApiBaseUrl = (): string => {
  // Check for Expo environment variable (prefixed with EXPO_PUBLIC_)
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Check for React environment variable (for web builds)
  if (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Use default based on environment
  // @ts-ignore - __DEV__ is a global in React Native
  return __DEV__ ? DEFAULT_API_URL : PRODUCTION_API_URL;
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

