const pool = require('../config/db');

const getProyectos = async (req, res) => {
    try {
        // Retornamos los proyectos. El frontend puede filtrar los que tienen cupos_disponibles > 0 si es necesario, 
        // o podemos filtrarlo directamente aquí según la regla de negocio.
        const [proyectos] = await pool.query('SELECT * FROM proyectos WHERE cupos_disponibles > 0');
        
        res.json({
            status: 'success',
            data: proyectos
        });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener los proyectos' });
    }
};

module.exports = {
    getProyectos
};
