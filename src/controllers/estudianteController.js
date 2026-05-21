const pool = require('../config/db');

const getEstudiante = async (req, res) => {
    const { documento } = req.params;

    try {
        const query = `
            SELECT e.documento, e.nombre, e.grado, e.proyecto_id, 
                   p.nombre as proyecto_nombre, p.descripcion as proyecto_descripcion, p.area as proyecto_area
            FROM estudiantes e 
            LEFT JOIN proyectos p ON e.proyecto_id = p.id 
            WHERE e.documento = ?
        `;
        const [rows] = await pool.query(query, [documento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado en el sistema.' });
        }

        const estudiante = rows[0];

        res.json({
            status: 'success',
            data: {
                documento: estudiante.documento,
                nombre: estudiante.nombre,
                grado: estudiante.grado,
                proyecto_id: estudiante.proyecto_id,
                proyecto_nombre: estudiante.proyecto_nombre || null,
                proyecto_descripcion: estudiante.proyecto_descripcion || null,
                proyecto_area: estudiante.proyecto_area || null
            }
        });
    } catch (error) {
        console.error('Error al obtener el estudiante:', error);
        res.status(500).json({ error: 'Error interno del servidor al consultar el estudiante.' });
    }
};

module.exports = {
    getEstudiante
};
