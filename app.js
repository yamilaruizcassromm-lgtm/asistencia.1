// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wvbmmhnmqzsdqdioczbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Ym1taG5tcXpzZHFkaW9jemJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDkyNzcsImV4cCI6MjEwNjcyNTI3N30.4tbsLLGvbvjbc-LnxUNDrjtO7P92hiW-fae4t9RRez4';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let fechaSeleccionadaInput = document.getElementById('fecha-asistencia');
let historialGlobalData = [];

document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    fechaSeleccionadaInput.value = hoy;

    verificarConexion();
    cargarDatosCompletos();

    document.getElementById('form-alumno').addEventListener('submit', agregarAlumno);
    document.getElementById('btn-guardar-asistencia').addEventListener('click', guardarAsistencia);
    fechaSeleccionadaInput.addEventListener('change', cargarDatosCompletos);
    document.getElementById('btn-exportar').addEventListener('click', exportarHistorialACSV);
});

async function verificarConexion() {
    const estadoBadge = document.getElementById('conexion-estado');
    try {
        const { error } = await supabaseClient.from('alumnos').select('id', { count: 'exact', head: true });
        if (error) throw error;
        estadoBadge.className = "badge-estado success";
        estadoBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Conectado a Supabase`;
    } catch (err) {
        console.error("Error de conexión:", err);
        estadoBadge.className = "badge-estado error";
        estadoBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Error de Conexión`;
    }
}

async function cargarDatosCompletos() {
    const fechaActual = fechaSeleccionadaInput.value;
    const tbodyAsistencia = document.getElementById('lista-asistencia-body');
    const tbodyGestion = document.getElementById('lista-alumnos-gestion');

    tbodyAsistencia.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-4">Cargando pase de lista...</td></tr>`;
    tbodyGestion.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Cargando listado...</td></tr>`;

    try {
        const { data: alumnos, error: errorAlumnos } = await supabaseClient
            .from('alumnos')
            .select('*')
            .order('nombre', { ascending: true });

        if (errorAlumnos) throw errorAlumnos;

        if (!alumnos || alumnos.length === 0) {
            tbodyAsistencia.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-4">No hay alumnos registrados.</td></tr>`;
            tbodyGestion.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">No hay alumnos registrados.</td></tr>`;
            cargarHistorialAsistencias();
            return;
        }

        const { data: asistencias, error: errorAsistencias } = await supabaseClient
            .from('asistencias')
            .select('*')
            .eq('fecha', fechaActual);

        if (errorAsistencias) throw errorAsistencias;

        const mapaAsistencias = {};
        if (asistencias) {
            asistencias.forEach(a => {
                mapaAsistencias[a.alumno_id] = a.presente;
            });
        }

        tbodyAsistencia.innerHTML = '';
        alumnos.forEach(alumno => {
            const estadoPresente = mapaAsistencias[alumno.id] !== undefined ? mapaAsistencias[alumno.id] : true;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${escapeHtml(alumno.nombre)}</td>
                <td class="text-center">
                    <label class="switch-container">
                        <input type="checkbox" data-id="${alumno.id}" class="switch-input check-asistencia" ${estadoPresente ? 'checked' : ''}>
                        <div class="switch-slider"></div>
                        <span class="switch-label">${estadoPresente ? 'Presente' : 'Ausente'}</span>
                    </label>
                </td>
            `;
            tbodyAsistencia.appendChild(tr);
        });

        document.querySelectorAll('.check-asistencia').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const label = e.target.parentElement.querySelector('.switch-label');
                label.textContent = e.target.checked ? 'Presente' : 'Ausente';
            });
        });

        tbodyGestion.innerHTML = '';
        alumnos.forEach((alumno, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-muted" style="width: 50px;">${index + 1}</td>
                <td style="font-weight: 500;">${escapeHtml(alumno.nombre)}</td>
                <td class="text-center">
                    <button onclick="eliminarAlumno(${alumno.id})" class="btn-icon-danger" title="Eliminar alumno">
                        <i class="fa-solid fa-trash-can"></i> Eliminar
                    </button>
                </td>
            `;
            tbodyGestion.appendChild(tr);
        });

        cargarHistorialAsistencias();

    } catch (err) {
        console.error("Error al cargar datos:", err);
        tbodyAsistencia.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-4">Error al cargar datos.</td></tr>`;
        tbodyGestion.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Error al cargar datos.</td></tr>`;
    }
}

async function agregarAlumno(e) {
    e.preventDefault();
    const input = document.getElementById('nombre-alumno');
    const nombre = input.value.trim();
    if (!nombre) return;

    try {
        const { error } = await supabaseClient.from('alumnos').insert([{ nombre }]);
        if (error) throw error;

        input.value = '';
        cargarDatosCompletos();
    } catch (err) {
        console.error("Error al registrar alumno:", err);
        alert("Error al registrar el alumno en la base de datos.");
    }
}

async function eliminarAlumno(id) {
    if (!confirm("¿Estás seguro de eliminar este alumno? Se eliminarán también sus registros históricos.")) return;

    try {
        const { error } = await supabaseClient.from('alumnos').delete().eq('id', id);
        if (error) throw error;
        cargarDatosCompletos();
    } catch (err) {
        console.error("Error al eliminar alumno:", err);
        alert("No se pudo eliminar el alumno.");
    }
}

async function guardarAsistencia() {
    const fecha = fechaSeleccionadaInput.value;
    if (!fecha) {
        alert("Por favor selecciona una fecha válida.");
        return;
    }

    const registros = [];
    document.querySelectorAll('.check-asistencia').forEach(checkbox => {
        registros.push({
            alumno_id: parseInt(checkbox.getAttribute('data-id')),
            fecha: fecha,
            presente: checkbox.checked
        });
    });

    if (registros.length === 0) {
        alert("No hay alumnos para guardar.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('asistencias')
            .upsert(registros, { onConflict: 'alumno_id,fecha' });

        if (error) throw error;

        alert("¡Asistencia guardada correctamente!");
        cargarHistorialAsistencias();
    } catch (err) {
        console.error("Error al guardar asistencia:", err);
        alert("Hubo un error al guardar la asistencia en Supabase.");
    }
}

async function cargarHistorialAsistencias() {
    const contenedor = document.getElementById('historial-contenedor');
    contenedor.innerHTML = `<p class="text-muted text-center py-2">Actualizando historial...</p>`;

    try {
        const { data, error } = await supabaseClient
            .from('asistencias')
            .select(`
                fecha,
                presente,
                alumnos ( nombre )
            `)
            .order('fecha', { ascending: false });

        if (error) throw error;

        historialGlobalData = data || [];

        if (historialGlobalData.length === 0) {
            contenedor.innerHTML = `<p class="text-muted text-center py-4">No hay registros de asistencia guardados.</p>`;
            return;
        }

        const agrupado = {};
        historialGlobalData.forEach(item => {
            if (!agrupado[item.fecha]) {
                agrupado[item.fecha] = [];
            }
            if (item.alumnos) {
                agrupado[item.fecha].push({
                    nombre: item.alumnos.nombre,
                    presente: item.presente
                });
            }
        });

        contenedor.innerHTML = '';
        for (const [fecha, registros] of Object.entries(agrupado)) {
            const presentes = registros.filter(r => r.presente).length;
            const ausentes = registros.length - presentes;

            let filasHTML = '';
            registros.forEach(r => {
                const tagClase = r.presente ? 'tag-presente' : 'tag-ausente';
                const tagTexto = r.presente ? 'Presente' : 'Ausente';
                filasHTML += `
                    <div class="detalle-fila">
                        <span>${escapeHtml(r.nombre)}</span>
                        <span class="tag-estado ${tagClase}">${tagTexto}</span>
                    </div>
                `;
            });

            const div = document.createElement('div');
            div.className = "historial-item";
            div.innerHTML = `
                <div class="historial-item-header">
                    <strong><i class="fa-solid fa-calendar-day text-indigo"></i> ${fecha}</strong>
                    <span class="historial-badge">P: ${presentes} | A: ${ausentes}</span>
                </div>
                <div class="historial-detalles">
                    ${filasHTML}
                </div>
            `;
            contenedor.appendChild(div);
        }

    } catch (err) {
        console.error("Error al cargar historial:", err);
        contenedor.innerHTML = `<p class="text-muted text-center py-4">Error al cargar el historial.</p>`;
    }
}

function exportarHistorialACSV() {
    if (!historialGlobalData || historialGlobalData.length === 0) {
        alert("No hay datos de asistencia para exportar.");
        return;
    }

    let csvContent = "\uFEFF";
    csvContent += "Fecha,Alumno,Estado\n";

    historialGlobalData.forEach(item => {
        if (item.alumnos) {
            const fecha = item.fecha;
            const nombre = `"${item.alumnos.nombre.replace(/"/g, '""')}"`;
            const estado = item.presente ? "Presente" : "Ausente";
            csvContent += `${fecha},${nombre},${estado}\n`;
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asistencia_alumnos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}