const express = require('express');
const router = express.Router();
const { cancelarInscripcion } = require('../controllers/inscripcionController');

// POST /api/cancelar-inscripcion
router.post('/', cancelarInscripcion);

module.exports = router;
