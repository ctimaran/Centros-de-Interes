const pool = require('../config/db');

const getProyectos = async (req, res) => {
    const { grado, curso } = req.params;
    
    if (!grado || !curso) {
        return res.status(400).json({ error: 'El grado y el curso del estudiante son requeridos' });
    }

    try {
        // Retornamos TODOS los proyectos. Utilizamos FIND_IN_SET para buscar el grado dentro del campo asignacion, y una subconsulta para calcular los inscritos del curso
        const query = `
            SELECT p.*, 
                   (SELECT COUNT(*) FROM estudiantes e WHERE e.proyecto_id = p.id AND e.curso = ?) AS inscritos_del_curso
            FROM proyectos p 
            WHERE FIND_IN_SET(?, p.asignacion) > 0
        `;
        const [proyectos] = await pool.query(query, [curso, grado]);
        
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
