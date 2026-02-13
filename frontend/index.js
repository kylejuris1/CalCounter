import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import App from './App';

// Suppress Expo update warnings and errors
LogBox.ignoreLogs([
  'Failed to download remote update',
  'Updates',
  'expo-updates',
  'Remote update',
]);

registerRootComponent(App);

