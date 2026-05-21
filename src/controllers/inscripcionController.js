const pool = require('../config/db');

const inscribirEstudiante = async (req, res) => {
    const { documento, proyecto_id } = req.body;

    if (!documento || !proyecto_id) {
        return res.status(400).json({ error: 'El documento y el ID del proyecto son requeridos.' });
    }

    const connection = await pool.getConnection();

    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        // 1. Verificar existencia del estudiante y asegurar que no tenga proyecto (FOR UPDATE bloquea la fila)
        const [estudiantes] = await connection.query(
            'SELECT * FROM estudiantes WHERE documento = ? FOR UPDATE',
            [documento]
        );

        if (estudiantes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Estudiante no encontrado en el sistema.' });
        }

        const estudiante = estudiantes[0];

        if (estudiante.proyecto_id !== null) {
            await connection.rollback();
            return res.status(400).json({ error: 'El estudiante ya se encuentra inscrito en un centro de interés.' });
        }

        // 2. Verificar la existencia y disponibilidad de cupos del proyecto (FOR UPDATE para prevenir race conditions)
        const [proyectos] = await connection.query(
            'SELECT * FROM proyectos WHERE id = ? FOR UPDATE',
            [proyecto_id]
        );

        if (proyectos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'El centro de interés seleccionado no existe.' });
        }

        const proyecto = proyectos[0];

        if (proyecto.cupos_disponibles <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El centro de interés seleccionado ya no tiene cupos disponibles.' });
        }

        // 3. Registrar la inscripción y restar el cupo disponible
        await connection.query(
            'UPDATE estudiantes SET proyecto_id = ? WHERE documento = ?',
            [proyecto_id, documento]
        );

        await connection.query(
            'UPDATE proyectos SET cupos_disponibles = cupos_disponibles - 1 WHERE id = ?',
            [proyecto_id]
        );

        // Confirmar la transacción
        await connection.commit();

        res.json({
            status: 'success',
            message: 'Inscripción realizada con éxito.',
            data: {
                documento,
                proyecto_id,
                proyecto_nombre: proyecto.nombre
            }
        });

    } catch (error) {
        // En caso de cualquier fallo, revertimos los cambios
        await connection.rollback();
        console.error('Error en la transacción de inscripción:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la inscripción.' });
    } finally {
        // Siempre liberar la conexión de vuelta al pool
        connection.release();
    }
};

const cancelarInscripcion = async (req, res) => {
    // Soportar 'documento_identidad' como pidió el frontend o 'documento'
    const documento = req.body.documento_identidad || req.body.documento;

    if (!documento) {
        return res.status(400).json({ error: 'El documento de identidad es requerido.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verificar si el estudiante existe y bloquear su fila
        const [estudiantes] = await connection.query(
            'SELECT * FROM estudiantes WHERE documento = ? FOR UPDATE',
            [documento]
        );

        if (estudiantes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        const estudiante = estudiantes[0];

        // 2. Verificar si tiene un proyecto asignado
        if (estudiante.proyecto_id === null) {
            await connection.rollback();
            return res.status(400).json({ error: 'El estudiante no tiene ningún centro de interés asignado para cancelar.' });
        }

        const proyecto_id = estudiante.proyecto_id;

        // 3. Liberar el proyecto: actualizar estudiante a NULL y devolver +1 al cupo del proyecto
        await connection.query(
            'UPDATE estudiantes SET proyecto_id = NULL WHERE documento = ?',
            [documento]
        );

        await connection.query(
            'UPDATE proyectos SET cupos_disponibles = cupos_disponibles + 1 WHERE id = ?',
            [proyecto_id]
        );

        await connection.commit();

        res.json({
            status: 'success',
            message: 'Inscripción cancelada con éxito. El cupo ha sido liberado.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al cancelar inscripción:', error);
        res.status(500).json({ error: 'Error interno del servidor al cancelar la inscripción.' });
    } finally {
        connection.release();
    }
};

module.exports = {
    inscribirEstudiante,
    cancelarInscripcion
};
