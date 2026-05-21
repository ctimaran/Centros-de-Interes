const express = require('express');
const router = express.Router();
const { inscribirEstudiante } = require('../controllers/inscripcionController');

// POST /api/inscripcion
router.post('/', inscribirEstudiante);

module.exports = router;
