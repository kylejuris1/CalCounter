// Import API configuration
import { API_BASE_URL } from '../config/api';

/**
 * Upload image to backend
 */
export async function uploadImage(uri: string): Promise<string> {
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
export async function analyzeFood(imageUrl: string) {
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

/**
 * Upload and analyze food image in one call
 */
export async function uploadAndAnalyzeFood(uri: string) {
  console.log('=== UPLOAD AND ANALYZE START ===');
  console.log('Image URI:', uri);
  
  try {
    const imageUrl = await uploadImage(uri);
    console.log('Upload successful, proceeding to analysis...');
    const analysis = await analyzeFood(imageUrl);
    console.log('=== UPLOAD AND ANALYZE COMPLETE ===');
    return analysis;
  } catch (error: any) {
    console.error('=== UPLOAD AND ANALYZE FAILED ===');
    console.error('Failed at step:', error?.message?.includes('upload') ? 'UPLOAD' : 'ANALYSIS');
    throw error;
  }
}
