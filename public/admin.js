document.addEventListener('DOMContentLoaded', () => {
    const formEstudiantes = document.getElementById('form-estudiantes');
    const formProyectos = document.getElementById('form-proyectos');
    const btnDescargar = document.getElementById('btn-descargar');

    // Manejador para carga de Estudiantes
    formEstudiantes.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('file-estudiantes');
        if (!fileInput.files.length) return alert('Por favor selecciona un archivo CSV.');

        const confirmacion = confirm('Atención: Esto eliminará los estudiantes actuales y cargará los nuevos del archivo. ¿Deseas continuar?');
        if (!confirmacion) return;

        const formData = new FormData();
        formData.append('archivo', fileInput.files[0]);

        try {
            const response = await fetch('/api/admin/cargar-estudiantes', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || 'Estudiantes cargados exitosamente.');
                formEstudiantes.reset();
            } else {
                alert(data.error || 'Error al cargar estudiantes.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al intentar cargar el archivo de estudiantes.');
        }
    });

    // Manejador para carga de Proyectos
    formProyectos.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('file-proyectos');
        if (!fileInput.files.length) return alert('Por favor selecciona un archivo CSV.');

        const confirmacion = confirm('Atención: Esto eliminará los proyectos actuales (desasignando a estudiantes). ¿Deseas continuar?');
        if (!confirmacion) return;

        const formData = new FormData();
        formData.append('archivo', fileInput.files[0]);

        try {
            const response = await fetch('/api/admin/cargar-proyectos', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || 'Proyectos cargados exitosamente.');
                formProyectos.reset();
            } else {
                alert(data.error || 'Error al cargar proyectos.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al intentar cargar el archivo de proyectos.');
        }
    });

    // Manejador para descarga del archivo Excel
    btnDescargar.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/descargar-resultados');
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.error || 'Ocurrió un error al generar el archivo Excel.');
                return;
            }

            // Procesar el Blob para disparar la descarga
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resultados_inscripcion.xlsx';
            document.body.appendChild(a);
            a.click(); // Forzar clic
            
            // Limpieza del DOM
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al intentar descargar los resultados.');
        }
    });

    const formReiniciarEstudiante = document.getElementById('form-reiniciar-estudiante');
    const btnReiniciarTodos = document.getElementById('btn-reiniciar-todos');

    // Manejador para reiniciar un estudiante específico
    formReiniciarEstudiante.addEventListener('submit', async (e) => {
        e.preventDefault();
        const documento = document.getElementById('doc-estudiante-reinicio').value.trim();
        if (!documento) return;

        const confirmacion = confirm(`¿Estás seguro que deseas reiniciar la elección del estudiante con documento ${documento}?`);
        if (!confirmacion) return;

        try {
            const response = await fetch('/api/admin/reiniciar-estudiante', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documento_identidad: documento })
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                formReiniciarEstudiante.reset();
            } else {
                alert(data.error || 'Error al reiniciar estudiante.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al intentar reiniciar al estudiante.');
        }
    });

    // Manejador para reiniciar todos los estudiantes
    btnReiniciarTodos.addEventListener('click', async () => {
        const confirmacion1 = confirm('¡ADVERTENCIA DE SEGURIDAD!\n\nEstás a punto de desasignar a TODOS los estudiantes de sus respectivos proyectos y restaurar los cupos globales. Esta acción es destructiva y afectará a todo el sistema.\n\n¿Deseas continuar con el proceso de reinicio masivo?');
        
        if (!confirmacion1) return;

        const confirmacion2 = confirm('¿ESTÁS ABSOLUTAMENTE SEGURO?\n\nPor favor, confirma por segunda vez para proceder con el reinicio de todos los estudiantes.');

        if (!confirmacion2) return;

        try {
            const response = await fetch('/api/admin/reiniciar-todos', {
                method: 'POST'
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.error || 'Error al reiniciar todos los estudiantes.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al intentar reiniciar todos los estudiantes.');
        }
    });

    // Manejador para Cerrar Sesión Administrativa
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Enviamos credenciales falsas para forzar al navegador a borrar las credenciales cacheadas de Basic Auth
            fetch(window.location.href, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa('logout:logout')
                }
            }).then(() => {
                // Al recibir el 401, redirigimos inmediatamente a la página de inicio
                window.location.href = '/';
            }).catch(() => {
                // Por si acaso hay un error de red, también redirigimos
                window.location.href = '/';
            });
        });
    }
});
