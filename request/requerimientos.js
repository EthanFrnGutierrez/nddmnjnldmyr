import { db } from "/firebase.js";
import {
    collection,
    onSnapshot,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// ========================================
// REFERENCIAS DEL DOM
// ========================================
const reqRef = collection(db, "requerimientos");
const tbody = document.querySelector('.adr-requerimientos-table tbody');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const btnFiltrar = document.getElementById('btnFiltrar');
const filtrosPanel = document.getElementById('filtrosPanel');
const modalDetalles = document.getElementById('modalDetalles');
const modalOverlay = modalDetalles.querySelector('.adr-modal-overlay');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnRegresar = document.getElementById('btnRegresar');
const notificacion = document.getElementById('notificacion');

// Variables globales
let todosLosRequerimientos = [];
let requerimientoActual = null;

/**
 * Normaliza texto eliminando tildes, mayúsculas y espacios extra
 */
function normalizeText(text) {
    return text.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Formatea fecha a formato dd/mm/yyyy
 */
function formatearFecha(fecha) {
    if (!fecha) return "-";

    // Si ya está en formato dd/mm/yyyy, retornar
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        return fecha;
    }

    // Si está en formato yyyy-mm-dd o dd-mm-yyyy, convertir
    let partes;
    if (fecha.includes('-')) {
        partes = fecha.split('-');
        if (partes[0].length === 4) {
            // formato yyyy-mm-dd
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        } else {
            // formato dd-mm-yyyy
            return partes.join('/');
        }
    }

    // Intentar parsear como Date
    try {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const año = date.getFullYear();
            return `${dia}/${mes}/${año}`;
        }
    } catch (e) { }

    return fecha;
}
// ========================================
// BOTÓN REGRESAR
// ========================================
//btnRegresar.addEventListener('click', () => {
//    window.history.back();
//});

// ========================================
// CARGAR DATOS DESDE FIRESTORE
// ========================================
onSnapshot(reqRef, (snapshot) => {
    todosLosRequerimientos = [];
    tbody.innerHTML = "";

    snapshot.forEach((docu) => {
        const data = docu.data();
        todosLosRequerimientos.push({
            id: docu.id,
            ...data
        });

        const fila = document.createElement("tr");
        fila.dataset.id = docu.id;
        fila.style.cursor = "pointer";

        fila.innerHTML = `
            <td data-label="ID">${docu.id.slice(0, 6).toUpperCase()}</td>
            <td data-label="FECHA">${formatearFecha(data.fecha)}</td>
            <td data-label="ÁREA">${data.area || ""}</td>
            <td data-label="TIPO">${data.tipo || ""}</td>
            <td data-label="MONTO">S/ ${parseFloat(data.monto || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
            <td data-label="ESTADO">
                <span class="adr-estado-badge adr-estado-${(data.estado || "PENDIENTE").toLowerCase().replace(" ", "-")}">
                    ${data.estado || "PENDIENTE"}
                </span>
            </td>
            <td data-label="ACCIONES">
                <button class="adr-btn-ver-detalles">
                    <i class="fas fa-eye"></i>
                    Ver Detalles
                </button>
            </td>
        `;

        // Click en la fila para abrir detalles
        fila.addEventListener('click', (e) => {
            if (!e.target.closest('.adr-btn-ver-detalles')) {
                abrirModalDetalles(docu.id);
            }
        });

        // Click en el botón para abrir detalles
        fila.querySelector('.adr-btn-ver-detalles').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalDetalles(docu.id);
        });

        tbody.appendChild(fila);
    });
});

// ========================================
// BÚSQUEDA
// ========================================
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm.length > 0) {
        clearSearchBtn.style.display = 'flex';
        filtrarRequerimientos(searchTerm);
    } else {
        clearSearchBtn.style.display = 'none';
        mostrarTodasLasFilas();
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    mostrarTodasLasFilas();
});

function filtrarRequerimientos(searchTerm) {
    const filas = tbody.querySelectorAll('tr');

    filas.forEach(fila => {
        const id = fila.querySelector('[data-label="ID"]')?.textContent.toLowerCase() || '';
        const titulo = fila.querySelector('[data-label="TÍTULO"]')?.textContent.toLowerCase() || '';
        const area = fila.querySelector('[data-label="ÁREA"]')?.textContent.toLowerCase() || '';
        const tipo = fila.querySelector('[data-label="TIPO"]')?.textContent.toLowerCase() || '';

        if (id.includes(searchTerm) || titulo.includes(searchTerm) ||
            area.includes(searchTerm) || tipo.includes(searchTerm)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

function mostrarTodasLasFilas() {
    const filas = tbody.querySelectorAll('tr');
    filas.forEach(fila => {
        fila.style.display = '';
    });
}

// ========================================
// PANEL DE FILTROS
// ========================================
btnFiltrar.addEventListener('click', () => {
    filtrosPanel.classList.toggle('active');
    btnFiltrar.classList.toggle('active');
});

// Aplicar Filtros
document.querySelector('.adr-btn-aplicar-filtros').addEventListener('click', () => {
    const filtros = {
        fechaDesde: document.getElementById('filtroFechaDesde').value,
        fechaHasta: document.getElementById('filtroFechaHasta').value,
        area: document.getElementById('filtroArea').value.toLowerCase(),
        tipo: document.getElementById('filtroTipo').value.toLowerCase(),
        montoMin: parseFloat(document.getElementById('filtroMontoMin').value) || 0,
        montoMax: parseFloat(document.getElementById('filtroMontoMax').value) || Infinity,
        estado: document.getElementById('filtroEstado').value
    };

    const filas = tbody.querySelectorAll('tr');
    let contadorVisibles = 0;

    filas.forEach(fila => {
        let mostrar = true;

        // Filtro por fecha
        if (filtros.fechaDesde || filtros.fechaHasta) {
            const fechaCelda = fila.querySelector('[data-label="FECHA"]').textContent.trim();
            const [dia, mes, año] = fechaCelda.split('/');
            const fechaFila = new Date(`${año}-${mes}-${dia}`);

            if (filtros.fechaDesde) {
                const fechaDesde = new Date(filtros.fechaDesde);
                if (fechaFila < fechaDesde) mostrar = false;
            }

            if (filtros.fechaHasta) {
                const fechaHasta = new Date(filtros.fechaHasta);
                if (fechaFila > fechaHasta) mostrar = false;
            }
        }

        // Filtro por área
        if (filtros.area) {
            const areaCelda = fila.querySelector('[data-label="ÁREA"]').textContent.toLowerCase();
            if (!areaCelda.includes(filtros.area)) mostrar = false;
        }

        // Filtro por tipo
        if (filtros.tipo) {
            const tipoCelda = fila.querySelector('[data-label="TIPO"]').textContent.toLowerCase();
            if (!tipoCelda.includes(filtros.tipo)) mostrar = false;
        }

        // Filtro por monto
        const montoCelda = fila.querySelector('[data-label="MONTO"]').textContent.replace('S/', '').replace(',', '').trim();
        const monto = parseFloat(montoCelda) || 0;

        if (monto < filtros.montoMin || monto > filtros.montoMax) {
            mostrar = false;
        }

        // Filtro por estado
        if (filtros.estado) {
            const estadoCelda = fila.querySelector('.adr-estado-badge').textContent.trim();
            if (estadoCelda !== filtros.estado) mostrar = false;
        }

        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) contadorVisibles++;
    });

    mostrarNotificacion(`Mostrando ${contadorVisibles} requerimiento(s)`);
});

// Limpiar Filtros
document.querySelector('.adr-btn-limpiar-filtros').addEventListener('click', () => {
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroArea').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroMontoMin').value = '';
    document.getElementById('filtroMontoMax').value = '';
    document.getElementById('filtroEstado').value = '';

    mostrarTodasLasFilas();
    mostrarNotificacion('Filtros limpiados');
});

// ========================================
// MODAL DE DETALLES
// ========================================
function abrirModalDetalles(requerimientoId) {
    const req = todosLosRequerimientos.find(r => r.id === requerimientoId);

    if (!req) {
        mostrarNotificacion('Requerimiento no encontrado', 'error');
        return;
    }

    requerimientoActual = req;

    // Llenar datos del modal
    document.getElementById('modalTituloReq').textContent = req.titulo || req.descripcion?.substring(0, 60) + '...' || 'Sin título';
    document.getElementById('modalId').textContent = req.id.slice(0, 8).toUpperCase();
    document.getElementById('modalFecha').textContent = formatearFecha(req.fecha) || '-';
    document.getElementById('modalArea').textContent = req.area || '-';
    document.getElementById('modalTipo').textContent = req.tipo || '-';
    document.getElementById('modalMonto').textContent = `S/ ${parseFloat(req.monto || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
    document.getElementById('modalEstado').textContent = req.estado || 'PENDIENTE';
    document.getElementById('modalDescripcion').textContent = req.descripcion || 'Sin descripción';

    // Cargar comentario existente (si lo hay)
    document.getElementById('modalComentario').value = req.comentarioAdmin || '';

    // 🔹 CARGAR PDFs
    loadPdfPreviewAdmin(req);

    modalDetalles.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    modalDetalles.classList.remove('active');
    document.body.style.overflow = '';
    requerimientoActual = null;
}

btnCerrarModal.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDetalles.classList.contains('active')) {
        cerrarModal();
    }
});

// ========================================
// CAMBIAR ESTADO
// ========================================
document.querySelectorAll('.adr-estado-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!requerimientoActual) return;

        const nuevoEstado = btn.dataset.estado;

        try {
            await updateDoc(doc(db, "requerimientos", requerimientoActual.id), {
                estado: nuevoEstado
            });

            document.getElementById('modalEstado').textContent = nuevoEstado;
            mostrarNotificacion(`Estado cambiado a: ${nuevoEstado}`);

            // Actualizar el estado visual del botón
            document.querySelectorAll('.adr-estado-btn').forEach(b => {
                b.style.opacity = '0.6';
            });
            btn.style.opacity = '1';

        } catch (error) {
            console.error("Error al cambiar estado:", error);
            mostrarNotificacion('Error al cambiar el estado', 'error');
        }
    });
});

// ========================================
// GUARDAR COMENTARIO
// ========================================
document.getElementById('btnGuardarComentario').addEventListener('click', async () => {
    if (!requerimientoActual) return;

    const comentario = document.getElementById('modalComentario').value.trim();

    try {
        await updateDoc(doc(db, "requerimientos", requerimientoActual.id), {
            comentarioAdmin: comentario,
            fechaComentario: new Date().toISOString()
        });

        mostrarNotificacion('Comentario guardado exitosamente');

    } catch (error) {
        console.error("Error al guardar comentario:", error);
        mostrarNotificacion('Error al guardar el comentario', 'error');
    }
});

// ========================================
// NOTIFICACIONES
// ========================================
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notifText = notificacion.querySelector('span');
    const notifIcon = notificacion.querySelector('i');

    notifText.textContent = mensaje;

    // Cambiar estilo según el tipo
    if (tipo === 'error') {
        notificacion.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        notifIcon.className = 'fas fa-exclamation-circle';
    } else {
        notificacion.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        notifIcon.className = 'fas fa-check-circle';
    }

    notificacion.classList.add('show');

    setTimeout(() => {
        notificacion.classList.remove('show');
    }, 3000);
}

// ========================================
// FUNCIONES PARA MANEJAR PDFs
// ========================================

// 🔹 CARGAR VISTA PREVIA DE PDFs
function loadPdfPreviewAdmin(req) {
    const pdfSection = document.getElementById('pdfSectionAdmin');
    const pdfContainer = document.getElementById('modalPdfs');

    if (!req.pdfs || req.pdfs.length === 0) {
        pdfSection.style.display = 'none';
        return;
    }

    pdfSection.style.display = 'block';
    pdfContainer.innerHTML = '';

    req.pdfs.forEach((pdf, index) => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'adr-pdf-preview-item';

        const sizeKB = pdf.size ? (pdf.size / 1024).toFixed(2) : '0';

        pdfItem.innerHTML = `
            <div class="adr-pdf-preview-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="adr-pdf-preview-info">
                <div class="adr-pdf-preview-name">${pdf.nombre || `Archivo ${index + 1}.pdf`}</div>
                <div class="adr-pdf-preview-size">${sizeKB} KB</div>
            </div>
            <div class="adr-pdf-preview-actions">
                <button class="adr-pdf-action-btn adr-pdf-view-btn" title="Ver PDF">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="adr-pdf-action-btn adr-pdf-download-btn" title="Descargar PDF">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;

        // Botón Ver
        pdfItem.querySelector('.adr-pdf-view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            viewPdfAdmin(pdf);
        });

        // Botón Descargar
        pdfItem.querySelector('.adr-pdf-download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadPdfAdmin(pdf);
        });

        pdfContainer.appendChild(pdfItem);
    });
}

// 🔹 VISUALIZAR PDF
function viewPdfAdmin(pdf) {
    const modal = document.getElementById('pdfViewerModalAdmin');
    const iframe = document.getElementById('pdfViewerIframeAdmin');
    const fileName = document.getElementById('pdfViewerFileNameAdmin');

    fileName.textContent = pdf.nombre || 'Archivo PDF';
    iframe.src = pdf.data;
    modal.classList.add('active');
}

// 🔹 DESCARGAR PDF
function downloadPdfAdmin(pdf) {
    const link = document.createElement('a');
    link.href = pdf.data;
    link.download = pdf.nombre || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarNotificacion('PDF descargado exitosamente');
}

// 🔹 CERRAR VISOR DE PDF
document.getElementById('closePdfViewerAdmin').addEventListener('click', () => {
    const modal = document.getElementById('pdfViewerModalAdmin');
    modal.classList.remove('active');
    document.getElementById('pdfViewerIframeAdmin').src = '';
});

// Cerrar visor al hacer clic fuera
document.getElementById('pdfViewerModalAdmin').addEventListener('click', (e) => {
    if (e.target.id === 'pdfViewerModalAdmin') {
        e.target.classList.remove('active');
        document.getElementById('pdfViewerIframeAdmin').src = '';
    }
});

// ========================================
// INICIALIZACIÓN
// ========================================
console.log('✅ Panel de Administrador - Requerimientos cargado');

// ========================================
// INICIALIZACIÓN
// ========================================
console.log('✅ Panel de Administrador - Requerimientos cargado');