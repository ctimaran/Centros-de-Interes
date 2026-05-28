const express = require('express');
const router = express.Router();
const { getProyectos } = require('../controllers/proyectosController');

// GET /api/proyectos/:grado/:curso
router.get('/:grado/:curso', getProyectos);

module.exports = router;
