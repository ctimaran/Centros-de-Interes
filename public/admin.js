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
});
