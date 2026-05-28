const express = require('express');
const router = express.Router();
const { upload, cargarEstudiantes, cargarProyectos, descargarResultados, reiniciarEstudiante, reiniciarTodos } = require('../controllers/adminController');

// POST /api/admin/cargar-estudiantes
router.post('/cargar-estudiantes', upload.single('archivo'), cargarEstudiantes);

// POST /api/admin/cargar-proyectos
router.post('/cargar-proyectos', upload.single('archivo'), cargarProyectos);

// GET /api/admin/descargar-resultados
router.get('/descargar-resultados', descargarResultados);

// POST /api/admin/reiniciar-estudiante
router.post('/reiniciar-estudiante', reiniciarEstudiante);

// POST /api/admin/reiniciar-todos
router.post('/reiniciar-todos', reiniciarTodos);

module.exports = router;
