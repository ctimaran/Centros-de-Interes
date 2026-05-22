const pool = require('../config/db');

const getProyectos = async (req, res) => {
    const grado = req.params.grado;
    
    if (!grado) {
        return res.status(400).json({ error: 'El grado del estudiante es requerido' });
    }

    try {
        // Retornamos los proyectos. Utilizamos FIND_IN_SET para buscar el grado dentro del campo asignacion.
        const query = 'SELECT * FROM proyectos WHERE FIND_IN_SET(?, asignacion) > 0 AND cupos_disponibles > 0';
        const [proyectos] = await pool.query(query, [grado]);
        
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
