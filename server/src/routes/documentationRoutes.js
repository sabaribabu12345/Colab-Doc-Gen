const express = require('express');
const router = express.Router();
const documentationController = require('../controllers/documentationController');
const { asyncHandler } = require('../utils/errorHandler');

router.post('/upload', asyncHandler(documentationController.generateDocumentation.bind(documentationController)));
router.get('/download', asyncHandler(documentationController.downloadPDF.bind(documentationController)));

module.exports = router; 