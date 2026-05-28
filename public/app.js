document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    let currentStudent = null; // Almacenará el estado global del estudiante

    // --- Plantillas de las Vistas ---
    const templates = {
        login: `
            <div class="login-container view active" id="view-login">
                <h2>Ingreso de Estudiantes</h2>
                <p>Por favor, digita tu Documento de Identidad para verificar tu estado o elegir un centro de interés.</p>
                <input type="text" id="documento-input" placeholder="Ej. 100100100" autocomplete="off">
                <button id="btn-ingresar">Ingresar</button>
            </div>
        `,
        projects: `
            <div class="projects-container view active" id="view-projects">
                <h2>Oferta de Centros de Interés</h2>
                <p>Hola <strong><span id="student-name"></span></strong>. Aún no has elegido tu proyecto. Selecciona uno de los disponibles a continuación:</p>
                <div class="projects-grid" id="projects-grid">
                    <!-- Las tarjetas de proyectos se inyectarán aquí -->
                </div>
            </div>
        `,
        status: `
            <div class="status-container view active" id="view-status">
                <span class="check-mark">✓</span>
                <h2>¡Estás Inscrito!</h2>
                <p><strong>Estudiante:</strong> <span id="status-name"></span> (<span id="status-grade"></span>)</p>
                <p><strong>Centro de Interés:</strong> <span id="status-project"></span></p>
                <div class="status-actions">
                    <button class="btn-cancel" id="btn-cancelar">Liberar mi cupo</button>
                    <button class="btn-outline" id="btn-salir">Salir</button>
                </div>
            </div>
        `
    };

    // --- Motor de Renderizado SPA ---
    const render = (viewName) => {
        appContainer.innerHTML = templates[viewName];
        attachEvents(viewName);
    };

    // --- Vinculación de Eventos según la Vista ---
    const attachEvents = (viewName) => {
        if (viewName === 'login') {
            const btnIngresar = document.getElementById('btn-ingresar');
            const inputDoc = document.getElementById('documento-input');
            
            btnIngresar.addEventListener('click', handleLogin);
            inputDoc.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
            inputDoc.focus();
        } 
        else if (viewName === 'projects') {
            document.getElementById('student-name').textContent = currentStudent.nombre;
            loadProjects();
        } 
        else if (viewName === 'status') {
            document.getElementById('status-name').textContent = currentStudent.nombre;
            document.getElementById('status-grade').textContent = currentStudent.grado;
            document.getElementById('status-project').textContent = currentStudent.proyecto_nombre;
            document.getElementById('btn-cancelar').addEventListener('click', handleCancel);
            document.getElementById('btn-salir').addEventListener('click', () => {
                currentStudent = null;
                render('login');
            });
        }
    };

    // --- Controladores Lógicos (API Fetch) ---

    // 1. Manejo del Login
    const handleLogin = async () => {
        const input = document.getElementById('documento-input');
        const documento = input.value.trim();

        if (!documento) {
            alert('Por favor, ingresa tu documento de identidad.');
            input.focus();
            return;
        }

        try {
            const response = await fetch(`/api/estudiante/${documento}`);
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Ocurrió un error al verificar el documento.');
                return;
            }

            currentStudent = data.data;

            // Enrutamiento basado en el estado del estudiante
            if (currentStudent.proyecto_id) {
                render('status');
            } else {
                render('projects');
            }
        } catch (error) {
            console.error('Error en Login:', error);
            alert('Error de conexión con el servidor. Inténtalo más tarde.');
        }
    };

    // 2. Cargar y Renderizar Proyectos
    const loadProjects = async () => {
        try {
            const response = await fetch(`/api/proyectos/${currentStudent.grado}/${currentStudent.curso}`);
            const data = await response.json();

            if (!response.ok) {
                alert('Error al cargar la lista de centros de interés.');
                return;
            }

            const projectsGrid = document.getElementById('projects-grid');
            projectsGrid.innerHTML = '';

            data.data.forEach(project => {
                const cuposAgotados = project.cupos_disponibles === 0;
                const limiteCursoAlcanzado = project.inscritos_del_curso >= project.max_por_curso;
                const isAvailable = !cuposAgotados && !limiteCursoAlcanzado;
                
                const card = document.createElement('div');
                card.className = `card ${!isAvailable ? 'disabled' : ''}`;
                
                // Aplicamos estilos de deshabilitado si aplica (la clase .disabled usualmente los opaca)
                if (!isAvailable) {
                    card.style.opacity = '0.6';
                    card.style.pointerEvents = 'none';
                }

                let actionHtml = '';
                if (cuposAgotados) {
                    actionHtml = `<div class="no-cupos" style="color: #666; font-weight: bold; text-align: center; padding: 0.8rem;">Cupos Agotados</div>`;
                } else if (limiteCursoAlcanzado) {
                    actionHtml = `<div class="no-cupos" style="color: #666; font-weight: bold; text-align: center; padding: 0.8rem;">Límite máximo por grupo alcanzado</div>`;
                } else {
                    actionHtml = `<button onclick="inscribirEstudiante(${project.id}, '${project.nombre}')">Inscribirme</button>`;
                }

                card.innerHTML = `
                    <div>
                        <span class="area-badge">${project.area || 'General'}</span>
                        <h3>${project.nombre}</h3>
                        <p class="description">${project.descripcion}</p>
                        <p class="cupos">Cupos disponibles: ${project.cupos_disponibles} / ${project.cupos_totales}</p>
                    </div>
                    ${actionHtml}
                `;
                projectsGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            alert('Error de conexión al cargar los proyectos.');
        }
    };

    // 3. Función global para inscribirse
    window.inscribirEstudiante = async (proyecto_id, proyecto_nombre) => {
        if (!confirm(`¿Estás seguro que deseas inscribirte en "${proyecto_nombre}"?`)) return;

        try {
            const response = await fetch('/api/inscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documento: currentStudent.documento,
                    proyecto_id: proyecto_id
                })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Ocurrió un error al realizar la inscripción.');
                // Recargar proyectos por si otro estudiante tomó el último cupo
                loadProjects();
                return;
            }

            // Actualizar el estado global y cambiar a la vista de éxito
            currentStudent.proyecto_id = data.data.proyecto_id;
            currentStudent.proyecto_nombre = data.data.proyecto_nombre;
            render('status');

        } catch (error) {
            console.error('Error en Inscripción:', error);
            alert('Error de conexión al intentar inscribirse.');
        }
    };

    // 4. Cancelar Inscripción (Liberar Cupo)
    const handleCancel = async () => {
        if (!confirm('¿Estás seguro de que deseas liberar tu cupo? Si lo haces, podrías perderlo si otro estudiante lo toma.')) return;

        try {
            const response = await fetch('/api/cancelar-inscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documento_identidad: currentStudent.documento })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Ocurrió un error al cancelar tu inscripción.');
                return;
            }

            alert('Tu cupo ha sido liberado exitosamente.');
            
            // Actualizar estado y devolver a la vista de proyectos
            currentStudent.proyecto_id = null;
            currentStudent.proyecto_nombre = null;
            render('projects');

        } catch (error) {
            console.error('Error en Cancelación:', error);
            alert('Error de conexión al intentar cancelar la inscripción.');
        }
    };

    // --- Inicialización: Mostrar el Login al cargar ---
    render('login');
});
