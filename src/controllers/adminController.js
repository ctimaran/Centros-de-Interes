const pool = require('../config/db');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');
const exceljs = require('exceljs');

// Configuración de multer para almacenar en memoria RAM
const upload = multer({ storage: multer.memoryStorage() });

const cargarEstudiantes = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                
                // Opcional: Limpiamos la tabla para una carga limpia
                // NOTA: Esto eliminará todos los datos actuales. Si se desea agregar, se puede quitar el DELETE.
                await connection.query('DELETE FROM estudiantes');

                for (const row of results) {
                    const documento = row.documento_identidad;
                    const nombre = row.nombre;
                    const grado = row.grado;
                    const curso = row.curso || null; // Capturamos el curso

                    if (documento && nombre && grado) {
                        await connection.query(
                            'INSERT INTO estudiantes (documento, nombre, grado, curso) VALUES (?, ?, ?, ?)',
                            [documento, nombre, grado, curso]
                        );
                    }
                }

                await connection.commit();
                res.json({ status: 'success', message: 'Estudiantes cargados correctamente.' });
            } catch (error) {
                await connection.rollback();
                console.error('Error cargando estudiantes:', error);
                res.status(500).json({ error: 'Error al insertar los estudiantes en la base de datos.' });
            } finally {
                connection.release();
            }
        });
};

const cargarProyectos = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                
                // Limpiamos la tabla. 
                // Cuidado: Si se borran los proyectos, los estudiantes perderán su asignación por el ON DELETE SET NULL.
                await connection.query('DELETE FROM proyectos');

                for (const row of results) {
                    const id = row.id_proyecto;
                    const nombre = row.nombre;
                    const descripcion = row.descripcion || null;
                    const area = row.area || null;
                    const asignacion = row.asignacion || null; // Capturamos la asignación (ej. "9,10,11")
                    const cupos_totales = parseInt(row.cupos_totales, 10);
                    const max_por_curso = parseInt(row.max_por_curso, 10) || cupos_totales;

                    if (id && nombre && !isNaN(cupos_totales)) {
                        await connection.query(
                            'INSERT INTO proyectos (id, nombre, descripcion, area, asignacion, cupos_totales, cupos_disponibles, max_por_curso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [id, nombre, descripcion, area, asignacion, cupos_totales, cupos_totales, max_por_curso] // Inicializamos disponibles = totales
                        );
                    }
                }

                await connection.commit();
                res.json({ status: 'success', message: 'Proyectos cargados correctamente.' });
            } catch (error) {
                await connection.rollback();
                console.error('Error cargando proyectos:', error);
                res.status(500).json({ error: 'Error al insertar los proyectos en la base de datos.' });
            } finally {
                connection.release();
            }
        });
};

const descargarResultados = async (req, res) => {
    try {
        const query = `
            SELECT e.documento, e.nombre, e.grado, p.nombre as proyecto_nombre 
            FROM estudiantes e 
            LEFT JOIN proyectos p ON e.proyecto_id = p.id
        `;
        const [rows] = await pool.query(query);

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Resultados de Inscripción');

        worksheet.columns = [
            { header: 'Documento', key: 'documento', width: 20 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Grado', key: 'grado', width: 10 },
            { header: 'Proyecto Elegido', key: 'proyecto_nombre', width: 30 }
        ];

        rows.forEach((row) => {
            worksheet.addRow({
                documento: row.documento,
                nombre: row.nombre,
                grado: row.grado,
                proyecto_nombre: row.proyecto_nombre || 'Sin asignar'
            });
        });

        // Configurar Headers para forzar la descarga del Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="resultados_inscripcion.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ error: 'Error interno del servidor al generar el archivo Excel.' });
    }
};

const reiniciarEstudiante = async (req, res) => {
    const { documento_identidad } = req.body;
    if (!documento_identidad) {
        return res.status(400).json({ error: 'Falta el documento de identidad.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar si el estudiante existe y tiene proyecto
        const [estudiantes] = await connection.query(
            'SELECT proyecto_id FROM estudiantes WHERE documento = ?',
            [documento_identidad]
        );

        if (estudiantes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        const proyectoId = estudiantes[0].proyecto_id;

        if (proyectoId) {
            // Actualizar estudiante
            await connection.query(
                'UPDATE estudiantes SET proyecto_id = NULL WHERE documento = ?',
                [documento_identidad]
            );

            // Aumentar cupo
            await connection.query(
                'UPDATE proyectos SET cupos_disponibles = cupos_disponibles + 1 WHERE id = ?',
                [proyectoId]
            );
        } else {
             await connection.rollback();
             return res.status(400).json({ error: 'El estudiante no tiene ningún proyecto asignado.' });
        }

        await connection.commit();
        res.json({ status: 'success', message: 'La elección del estudiante ha sido reiniciada.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reiniciando estudiante:', error);
        res.status(500).json({ error: 'Error al reiniciar el estudiante.' });
    } finally {
        connection.release();
    }
};

const reiniciarTodos = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Resetear estudiantes
        await connection.query('UPDATE estudiantes SET proyecto_id = NULL');

        // Resetear proyectos
        await connection.query('UPDATE proyectos SET cupos_disponibles = cupos_totales');

        await connection.commit();
        res.json({ status: 'success', message: 'Se han reiniciado todas las elecciones exitosamente.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reiniciando todos:', error);
        res.status(500).json({ error: 'Error al reiniciar todos los estudiantes.' });
    } finally {
        connection.release();
    }
};

module.exports = {
    upload,
    cargarEstudiantes,
    cargarProyectos,
    descargarResultados,
    reiniciarEstudiante,
    reiniciarTodos
};
