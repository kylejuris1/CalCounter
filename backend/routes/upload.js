import multer from 'multer';
import { uploadToS3 } from '../services/awsS3.js';

// Configure multer for memory storage (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('=== MULTER FILE FILTER ===');
    console.log('File fieldname:', file.fieldname);
    console.log('File originalname:', file.originalname);
    console.log('File mimetype:', file.mimetype);
    console.log('File encoding:', file.encoding);
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted (image type)');
      cb(null, true);
    } else {
      console.error('File rejected (not an image):', file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * Upload image endpoint
 * POST /api/upload
 * Expects: multipart/form-data with 'image' field
 */
export const uploadImage = async (req, res, next) => {
  console.log('=== UPLOAD ENDPOINT CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  try {
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, async (err) => {
      console.log('=== MULTER CALLBACK ===');
      
      if (err) {
        console.error('=== MULTER ERROR ===');
        console.error('Error type:', err.constructor?.name);
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error stack:', err.stack);
        return res.status(400).json({ error: err.message });
      }

      console.log('Request file:', req.file ? 'PRESENT' : 'MISSING');
      
      if (!req.file) {
        console.error('=== NO FILE RECEIVED ===');
        console.error('Request body keys:', Object.keys(req.body || {}));
        console.error('Request files:', Object.keys(req.files || {}));
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: 'No image file provided',
          details: 'Expected multipart/form-data with "image" field'
        });
      }

      console.log('=== FILE RECEIVED ===');
      console.log('File fieldname:', req.file.fieldname);
      console.log('File originalname:', req.file.originalname);
      console.log('File mimetype:', req.file.mimetype);
      console.log('File size:', req.file.size, 'bytes');
      console.log('File buffer length:', req.file.buffer?.length);

      try {
        console.log('=== UPLOADING TO S3 ===');
        console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME);
        console.log('Region:', process.env.AWS_REGION);
        
        // Upload to S3
        const imageUrl = await uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('=== S3 UPLOAD SUCCESS ===');
        console.log('Image URL:', imageUrl);

        res.json({
          success: true,
          imageUrl,
          message: 'Image uploaded successfully',
        });
      } catch (error) {
        console.error('=== S3 UPLOAD ERROR ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error code:', error?.code);
        console.error('Error name:', error?.name);
        console.error('Error stack:', error?.stack);
        
        if (error?.$metadata) {
          console.error('AWS Metadata:', JSON.stringify(error.$metadata, null, 2));
        }
        
        res.status(500).json({ 
          error: 'Failed to upload image to S3',
          details: error?.message || 'Unknown S3 error'
        });
      }
    });
  } catch (error) {
    console.error('=== UPLOAD ENDPOINT ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    next(error);
  }
};
