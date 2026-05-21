const express = require('express');
const router = express.Router();
const { getProyectos } = require('../controllers/proyectosController');

// GET /api/proyectos
router.get('/', getProyectos);

module.exports = router;
