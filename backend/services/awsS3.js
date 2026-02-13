import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

console.log('=== AWS S3 CLIENT INITIALIZATION ===');
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'MISSING');
console.log('AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT' : 'MISSING');
console.log('S3 Bucket Name:', process.env.AWS_S3_BUCKET_NAME);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload image to AWS S3
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} fileName - Name for the uploaded file
 * @param {string} contentType - MIME type of the image
 * @returns {Promise<string>} S3 URL of the uploaded image
 */
export async function uploadToS3(imageBuffer, fileName, contentType = 'image/jpeg') {
  console.log('=== S3 UPLOAD FUNCTION CALLED ===');
  console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME);
  console.log('Region:', process.env.AWS_REGION);
  console.log('File name:', fileName);
  console.log('Content type:', contentType);
  console.log('Buffer size:', imageBuffer?.length, 'bytes');
  
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }
  
  const key = `food-images/${Date.now()}-${fileName}`;
  console.log('S3 Key:', key);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType,
    // ACL removed - use bucket policy for public access instead
    // This avoids "bucket does not allow ACLs" errors
  });

  try {
    console.log('=== SENDING TO S3 ===');
    const startTime = Date.now();
    
    await s3Client.send(command);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('=== S3 UPLOAD SUCCESS ===');
    console.log('Upload duration:', duration + 'ms');
    
    // Construct S3 URL - handle different region formats
    const region = process.env.AWS_REGION;
    let imageUrl;
    
    // For us-east-1, use s3.amazonaws.com (no region in URL)
    if (region === 'us-east-1') {
      imageUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
    } else {
      // For other regions, use s3-{region}.amazonaws.com format (hyphen, not dot)
      // This is the correct format for all non-us-east-1 regions
      imageUrl = `https://${bucketName}.s3-${region}.amazonaws.com/${key}`;
    }
    
    console.log('Generated S3 URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('=== S3 UPLOAD ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    
    if (error?.$metadata) {
      console.error('AWS Request ID:', error.$metadata.requestId);
      console.error('HTTP Status Code:', error.$metadata.httpStatusCode);
      console.error('AWS Metadata:', JSON.stringify(error.$metadata, null, 2));
    }
    
    if (error?.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // Provide more specific error messages
    if (error?.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${bucketName}" does not exist. Please create it first.`);
    } else if (error?.name === 'AccessDenied') {
      throw new Error(`Access denied to S3 bucket. Check IAM permissions and bucket policy.`);
    } else if (error?.name === 'InvalidAccessKeyId') {
      throw new Error(`Invalid AWS Access Key ID. Check your .env file.`);
    } else if (error?.name === 'SignatureDoesNotMatch') {
      throw new Error(`AWS Secret Access Key is incorrect. Check your .env file.`);
    } else if (error?.code === 'InvalidToken') {
      throw new Error(`AWS credentials are invalid or expired.`);
    } else if (error?.name === 'InvalidRequest' && error?.message?.includes('ACL')) {
      throw new Error(`Bucket does not allow ACLs. Remove ACL from upload and use bucket policy for public access.`);
    }
    
    throw new Error(`Failed to upload image to S3: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Delete image from AWS S3
 * @param {string} imageUrl - Full S3 URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteFromS3(imageUrl) {
  try {
    console.log('=== S3 DELETE FUNCTION CALLED ===');
    console.log('Image URL:', imageUrl);
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }
    
    // Extract the S3 key from the URL
    // URL format: https://bucket-name.s3-region.amazonaws.com/key
    // or: https://bucket-name.s3.amazonaws.com/key (for us-east-1)
    let key;
    
    try {
      // Try to extract key from URL
      const urlMatch = imageUrl.match(/https?:\/\/[^\/]+\/(.+)$/);
      if (urlMatch && urlMatch[1]) {
        key = decodeURIComponent(urlMatch[1]);
      } else {
        throw new Error('Could not extract key from URL');
      }
    } catch (error) {
      console.error('Error extracting key from URL:', error);
      throw new Error(`Invalid S3 URL format: ${imageUrl}`);
    }
    
    console.log('Extracted S3 Key:', key);
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    console.log('=== DELETING FROM S3 ===');
    const startTime = Date.now();
    
    await s3Client.send(command);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('=== S3 DELETE SUCCESS ===');
    console.log('Delete duration:', duration + 'ms');
    console.log('Deleted key:', key);
  } catch (error) {
    console.error('=== S3 DELETE ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    
    if (error?.$metadata) {
      console.error('AWS Request ID:', error.$metadata.requestId);
      console.error('HTTP Status Code:', error.$metadata.httpStatusCode);
    }
    
    // Don't throw error - deletion failure shouldn't break the flow
    // Just log it and continue
    console.warn('⚠️  Failed to delete image from S3, but continuing anyway');
  }
}

/**
 * Generate a presigned URL for direct upload (alternative approach)
 * @param {string} fileName - Name for the file
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Presigned URL
 */
export async function generatePresignedUrl(fileName, contentType = 'image/jpeg') {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const key = `food-images/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { presignedUrl, key };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}
