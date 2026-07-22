import { Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { documentService } from '../services/document.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Multer config for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  },
});

// Get all documents
router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'uploadedAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      customerId: req.query.customerId as string,
      documentType: req.query.documentType as string,
    };

    // Customers see only their documents
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.userId;
    }

    const result = await documentService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my documents (customer)
router.get('/my', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }
    const documents = await documentService.getByCustomer(req.user.userId);
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await documentService.getById(req.params.id as string);
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Upload document
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validate([
    body('customerId').notEmpty(),
    body('documentType').isIn([
      'ID_PROOF', 'ADDRESS_PROOF', 'MEDICAL_REPORT',
      'CLAIM_DOCUMENT', 'POLICY_DOCUMENT', 'PHOTO', 'SIGNATURE', 'OTHER',
    ]),
  ]),
  async (req: any, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const document = await documentService.upload(
        { ...req.body, uploadedById: req.user.userId },
        req.file
      );
      res.status(201).json({ success: true, data: document });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get download URL
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { url, expiresIn } = await documentService.getDownloadUrl(req.params.id as string);
    res.json({ success: true, data: { url, expiresIn } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Verify document (Admin/Agent)
router.patch('/:id/verify', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const document = await documentService.verify(req.params.id, req.user.userId);
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete document (Admin/Agent)
router.delete('/:id', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const result = await documentService.delete(req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
