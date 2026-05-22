const express = require('express');
const router = express.Router();
const { getProyectos } = require('../controllers/proyectosController');

// GET /api/proyectos/:grado
router.get('/:grado', getProyectos);

module.exports = router;
