import { Router } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCustomerIdFromUserId } from '../utils/helpers.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Get all documents
router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters: any = { page: 1, limit: 10 };
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.documentType) filters.documentType = req.query.documentType;

    if (req.user.role === 'CUSTOMER') {
      const customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
      filters.customerId = customerId;
    } else if (req.query.customerId) {
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

// Upload document
router.post('/', authenticate, upload.single('file'), async (req: any, res) => {
  try {
    let customerId = req.body.customerId;

    // CUSTOMER users must use their own customerId
    if (req.user.role === 'CUSTOMER') {
      customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
    }

    // ADMIN/AGENT must provide customerId
    if (!customerId) {
      res.status(400).json({ success: false, error: 'customerId is required' });
      return;
    }

    const doc = await documentService.create({
      customerId,
      documentType: req.body.documentType || 'OTHER',
      originalName: req.file?.originalname || req.body.fileName || 'Untitled',
      fileName: req.file?.originalname || req.body.fileName || 'Untitled',
      fileType: req.file?.mimetype || 'application/octet-stream',
      mimeType: req.file?.mimetype || 'application/octet-stream',
      fileSize: req.file?.size || 0,
      url: '',
      storagePath: '',
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
    const status = req.body.status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
    const doc = await documentService.updateVerificationStatus(req.params.id, status);
    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    await documentService.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
