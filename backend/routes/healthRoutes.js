const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth, healthController.getDashboardData);
router.post('/profile', auth, healthController.updateProfile);
router.post('/hb', auth, healthController.addHbReading);
router.get('/diet/:status', auth, healthController.getDietPlan);

module.exports = router;
