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
    const customerId = req.body.customerId;

    // For CUSTOMER role, get their customerId
    if (req.user.role === 'CUSTOMER') {
      const custId = await getCustomerIdFromUserId(req.user.userId);
      if (!custId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
      // Override customerId with their own
      req.body.customerId = custId;
    }

    if (!customerId && req.user.role === 'CUSTOMER') {
      res.status(400).json({ success: false, error: 'Customer ID required' });
      return;
    }

    let fileUrl = null;

    // Upload file to Supabase Storage if file provided
    if (req.file) {
      const uploadResult = await storageService.uploadDocument(
        req.file.buffer,
        req.file.originalname,
        req.body.customerId
      );
      fileUrl = uploadResult.url;
    }

    const doc = await documentService.create({
      customerId: req.body.customerId,
      documentType: req.body.documentType,
      fileName: req.file?.originalname || req.body.fileName,
      fileUrl: fileUrl,
      fileSize: req.file?.size || parseInt(req.body.fileSize) || null,
      mimeType: req.file?.mimetype || req.body.mimeType,
      description: req.body.description,
      uploadedById: req.user.userId,
    });

    res.json({ success: true, data: doc });
  } catch (error: any) {
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
    // Get document to check if it has a file
    const doc = await documentService.getById(req.params.id);

    // Delete file from storage if exists
    if (doc.fileUrl) {
      try {
        // Extract path from URL (simplified - in production use proper URL parsing)
        const urlParts = doc.fileUrl.split('/documents/');
        if (urlParts.length > 1) {
          await storageService.deleteDocument(urlParts[1]);
        }
      } catch {
        // Continue even if file deletion fails
        console.error('Failed to delete file from storage');
      }
    }

    await documentService.delete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document download URL
router.get('/:id/download', authenticate, async (req: any, res) => {
  try {
    const doc = await documentService.getById(req.params.id);

    if (!doc.fileUrl) {
      res.status(404).json({ success: false, error: 'No file associated with this document' });
      return;
    }

    // For public buckets, return the URL directly
    // For private buckets, generate a signed URL
    res.json({
      success: true,
      data: {
        url: doc.fileUrl,
        fileName: doc.fileName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
