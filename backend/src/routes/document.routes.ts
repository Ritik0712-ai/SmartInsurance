import { Router } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.service.js';
import { storageService } from '../services/storage.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCustomerIdFromUserId } from '../utils/helpers.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Get all documents
router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters: any = { page: 1, limit: 10 };
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.documentType) filters.documentType = req.query.documentType;

    // For CUSTOMER role, convert userId to customerId
    if (req.user.role === 'CUSTOMER') {
      const customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
      filters.customerId = customerId;
    } else if (req.query.customerId) {
      // ADMIN/AGENT can filter by customerId
      filters.customerId = req.query.customerId;
    }

    const result = await documentService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const doc = await documentService.getById(req.params.id);
    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Upload document with file
router.post('/', authenticate, upload.single('file'), async (req: any, res) => {
  try {
    let customerId = req.body.customerId;

    // For CUSTOMER role, automatically get their customerId
    if (req.user.role === 'CUSTOMER') {
      customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
    }

    // ADMIN/AGENT can upload without customerId (will be stored with their userId as fallback)
    if (!customerId) {
      customerId = req.user.userId;
    }

    let fileUrl = null;

    // Upload file to Supabase Storage if file provided
    if (req.file) {
      try {
        const uploadResult = await storageService.uploadDocument(
          req.file.buffer,
          req.file.originalname,
          customerId
        );
        fileUrl = uploadResult.url;
      } catch (storageError: any) {
        // Storage might not be configured - continue without file URL
        console.error('Storage upload failed:', storageError.message);
      }
    }

    const doc = await documentService.create({
      customerId,
      documentType: req.body.documentType,
      fileName: req.file?.originalname || req.body.fileName,
      fileUrl: fileUrl,
      fileSize: req.file?.size || parseInt(req.body.fileSize) || null,
      mimeType: req.file?.mimetype || req.body.mimeType,
      description: req.body.description,
      uploadedById: req.user.userId,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify document
router.patch('/:id/verify', authenticate, async (req: any, res) => {
  try {
    const doc = await documentService.verify(req.params.id, req.user.userId, req.body.status);
    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const doc = await documentService.getById(req.params.id);

    // Delete file from storage if exists
    if (doc?.fileUrl) {
      try {
        const pathMatch = doc.fileUrl.match(/\/storage\/v1\/object\/public\/(.+)$/);
        if (pathMatch) {
          await storageService.deleteDocument(pathMatch[1]);
        }
      } catch (storageError: any) {
        console.error('Storage delete failed:', storageError.message);
      }
    }

    await documentService.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get download URL
router.get('/:id/download', authenticate, async (req: any, res) => {
  try {
    const doc = await documentService.getById(req.params.id);
    res.json({ success: true, data: { url: doc?.fileUrl } });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

export default router;
