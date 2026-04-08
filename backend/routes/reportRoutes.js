const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// POST /api/analyse-report — accepts multipart/form-data with field name "file"
// Auth is optional: saves reading to DB if logged in, still works anonymously
router.post('/', (req, res, next) => {
  reportController.uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, (req, res, next) => {
  // Try to attach user from token if present (optional auth)
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (_) {}
  }
  next();
}, reportController.analyseReport);

module.exports = router;
