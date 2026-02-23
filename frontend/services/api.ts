// Import API configuration
import { API_BASE_URL } from '../config/api';
import type { OnboardingAnswers } from '../hooks/useOnboarding';
import type { RecommendedGoals } from '../hooks/useOnboarding';

/**
 * Upload image to backend
 */
export async function uploadImage(uri: string, signal?: AbortSignal): Promise<string> {
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri,
    name: filename,
    type,
  } as any);

  const uploadUrl = `${API_BASE_URL}/api/upload`;
  
  try {
    console.log('=== UPLOAD REQUEST START ===');
    console.log('Upload URL:', uploadUrl);
    console.log('Image URI:', uri);
    console.log('Filename:', filename);
    console.log('Content Type:', type);
    console.log('FormData created:', formData);
    
    const startTime = Date.now();
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      signal,
      // DO NOT set Content-Type header - React Native sets it automatically with boundary
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('=== UPLOAD RESPONSE RECEIVED ===');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log('Request duration:', duration + 'ms');
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== UPLOAD FAILED ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Response Body:', errorText);
      throw new Error(`Failed to upload image (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('=== UPLOAD SUCCESS ===');
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('Image URL:', data.imageUrl);
    return data.imageUrl;
  } catch (error: any) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Network-specific error details
    if (error?.message?.includes('Network request failed')) {
      console.error('NETWORK ERROR DETAILS:');
      console.error('- This usually means the request never reached the server');
      console.error('- Check if backend is running on:', API_BASE_URL);
      console.error('- Check if device and computer are on same Wi-Fi network');
      console.error('- Check Windows Firewall settings for port 5000');
      console.error('- Try accessing in browser:', `${API_BASE_URL}/health`);
    }
    
    // Fetch-specific error details
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      console.error('FETCH ERROR DETAILS:');
      console.error('- Check CORS configuration on backend');
      console.error('- Verify API_BASE_URL is correct:', API_BASE_URL);
    }
    
    throw error;
  }
}

/**
 * Analyze food image
 */
export async function analyzeFood(imageUrl: string, signal?: AbortSignal) {
  const analyzeUrl = `${API_BASE_URL}/api/analyze`;
  
  try {
    console.log('=== ANALYSIS REQUEST START ===');
    console.log('Analysis URL:', analyzeUrl);
    console.log('Image URL to analyze:', imageUrl);
    
    const startTime = Date.now();
    
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
      signal,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('=== ANALYSIS RESPONSE RECEIVED ===');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Request duration:', duration + 'ms');
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== ANALYSIS FAILED ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Response Body:', errorText);
      throw new Error(`Failed to analyze food (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('=== ANALYSIS SUCCESS ===');
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('=== ANALYSIS ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Network-specific error details
    if (error?.message?.includes('Network request failed')) {
      console.error('NETWORK ERROR DETAILS:');
      console.error('- Check if backend is running on:', API_BASE_URL);
      console.error('- Check if device and computer are on same Wi-Fi network');
    }
    
    throw error;
  }
}

/** Timeout for upload+analyze (allows Render cold start ~60s + upload + OpenAI) */
const UPLOAD_ANALYZE_TIMEOUT_MS = 120000;

/**
 * Upload and analyze food image in one call.
 * Uses a single timeout for the whole flow so the app doesn't hang on Render cold start.
 */
export async function uploadAndAnalyzeFood(uri: string): Promise<{ data: any }> {
  console.log('=== UPLOAD AND ANALYZE START ===');
  console.log('Image URI:', uri);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_ANALYZE_TIMEOUT_MS);

  try {
    const imageUrl = await uploadImage(uri, controller.signal);
    console.log('Upload successful, proceeding to analysis...');
    const analysis = await analyzeFood(imageUrl, controller.signal);
    console.log('=== UPLOAD AND ANALYZE COMPLETE ===');
    return analysis;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('=== UPLOAD AND ANALYZE TIMEOUT ===');
      throw new Error(
        'Request timed out. The server may be waking up—please try again in a moment.'
      );
    }
    console.error('=== UPLOAD AND ANALYZE FAILED ===');
    console.error('Failed at step:', error?.message?.includes('upload') ? 'UPLOAD' : 'ANALYSIS');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Submit onboarding as guest. Creates guest account and saves responses. Returns guestId.
 */
export async function submitGuestOnboarding(
  answers: OnboardingAnswers,
  goals: RecommendedGoals
): Promise<{ guestId: string }> {
  const url = `${API_BASE_URL}/api/guest/onboarding`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers,
      goals: {
        calorieGoal: goals.calorieGoal,
        proteinGoal: goals.proteinGoal,
        carbsGoal: goals.carbsGoal,
        fatGoal: goals.fatGoal,
        fiberGoal: goals.fiberGoal ?? undefined,
        sugarGoal: goals.sugarGoal ?? undefined,
        sodiumGoal: goals.sodiumGoal ?? undefined,
        waterGoalMl: goals.waterGoalMl ?? undefined,
      },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to save onboarding');
  }
  return response.json();
}

/**
 * Link guest account to the current authenticated user (after email OTP). Requires access token.
 */
export async function linkGuest(guestId: string, accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}/api/auth/link-guest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ guestId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to link account');
  }
}

/**
 * Ensure an app_users row exists for the authenticated user (e.g. signed in without prior guest).
 */
export async function ensureAppUser(accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}/api/auth/ensure-app-user`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to ensure app user');
  }
}

/**
 * Delete account data for the authenticated user. Requires valid session.
 */
export async function deleteAccount(accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}/api/auth/delete-account`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to delete account');
  }
}
