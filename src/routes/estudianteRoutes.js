const express = require('express');
const router = express.Router();
const { getEstudiante } = require('../controllers/estudianteController');

// GET /api/estudiante/:documento
router.get('/:documento', getEstudiante);

module.exports = router;
