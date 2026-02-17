// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

console.log('=== ENVIRONMENT VARIABLES LOADED ===');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('AWS_REGION:', process.env.AWS_REGION || 'MISSING');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'MISSING');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT' : 'MISSING');
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || 'MISSING');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');
console.log('REVENUECAT_WEBHOOK_AUTH_TOKEN:', process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ? 'PRESENT' : 'MISSING');

// Export a function to verify env vars are loaded
export function verifyEnv() {
  const required = [
    'OPENAI_API_KEY', 
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_S3_BUCKET_NAME',
    'AWS_REGION',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'REVENUECAT_WEBHOOK_AUTH_TOKEN',
  ];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing.join(', '));
    console.warn('⚠️  Server may not function correctly without these variables.');
  } else {
    console.log('✅ All required environment variables are present');
  }
  
  return missing.length === 0;
}
