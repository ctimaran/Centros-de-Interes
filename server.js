const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la SPA (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const proyectosRoutes = require('./src/routes/proyectosRoutes');
const inscripcionRoutes = require('./src/routes/inscripcionRoutes');
const estudianteRoutes = require('./src/routes/estudianteRoutes');
const cancelarInscripcionRoutes = require('./src/routes/cancelarInscripcionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Endpoints de la API REST
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/inscripcion', inscripcionRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/cancelar-inscripcion', cancelarInscripcionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'La API del sistema de inscripciones está funcionando correctamente.' 
    });
});

// Fallback para la SPA: Cualquier ruta no controlada por /api renderiza el index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint no encontrado' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
