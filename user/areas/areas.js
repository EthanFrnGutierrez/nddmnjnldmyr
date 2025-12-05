import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
// 🔹 AGREGAR IMPORTS DE STORAGE
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-V6hfGyOETDNxJf8Stb9DujbxQTIM76c",
    authDomain: "web-requerimientos.firebaseapp.com",
    projectId: "web-requerimientos",
    storageBucket: "web-requerimientos.appspot.com",
    messagingSenderId: "707688130249",
    appId: "1:707688130249:web:c46b6252c46083b6e9cf18",
    measurementId: "G-TV2C27SXD3"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // 🔹 INICIALIZAR STORAGE

window.db = db;
window.storage = storage; // 🔹 EXPORTAR STORAGE
window.firestore = {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
};
const areasMap = {
    "catastro-planeamiento": "Subgerencia de Catastro, Planeamiento y Control Urbano",
    "maquinarias": "Subgerencia de Maquinarias",
    "supervision-obras": "Subgerencia de Supervisión y Ejecución de Obras",
    "medio-ambiente": "Subgerencia de Medio Ambiente, Ecología, Saneamiento y Salubridad",
    "mercados-cementerios": "Subgerencia de Mercados y Cementerios",
    "transporte-transito": "Subgerencia de Transporte, Tránsito y Circulación Vial",
    "seguridad-ciudadana": "Subgerencia de Seguridad Ciudadana",
    "educacion-cultura": "Subgerencia de Educación, Cultura, Deportes y Recreación",
    "defensoria-nino": "Subgerencia de Defensoría Municipal del Niño y Adolescente",
    "discapacidad": "Subgerencia Municipal Persona con Discapacidad",
    "participacion-vecinal": "Subgerencia de Participación Vecinal y Organizaciones Sociales",
    "turismo-pymes": "Subgerencia de Desarrollo Turístico y Promoción Empresarial PYMES",
    "proyectos-agropecuarios": "Subgerencia de Proyectos Agropecuarios",
    "vaso-de-leche": "Programa del Vaso de Leche",
    "pan-tbc": "Programa PAN-TBC",
    "agua-alcantarillado": "Unidad de Agua y Alcantarillado",
    "agencias-municipales": "Agencias Municipales",
    "abastecimiento": "Subgerencia de Abastecimiento",
    "contabilidad": "Subgerencia de Contabilidad",
    "tesoreria": "Subgerencia de Tesorería",
    "personal": "Subgerencia de Personal",
    "control-patrimonial": "Subgerencia de Control Patrimonial",
    "recaudacion-control": "Subgerencia de Recaudación y Control",
    "fiscalizacion-tributaria": "Subgerencia de Fiscalización Tributaria",
    "ejecucion-coactiva": "Subgerencia de Ejecución Coactiva",
    "comercializacion": "Subgerencia de Comercialización, Comercio Ambulatorio y Feria",
    "asesoria-juridica": "Oficina de Asesoría Jurídica",
    "planeamiento-presupuesto": "Oficina de Planeamiento, Presupuesto y Racionalización",
    "tecnologia": "Oficina de Tecnología",
    "secretaria-general": "Oficina de Secretaría General",
    "tramite-documentario": "Unidad Trámite Documentario",
    "archivo-central": "Unidad de Archivo Central",
    "orientacion-ciudadania": "Unidad de Orientación a la Ciudadanía"
};

let todosLosRequerimientos = [];
let requerimientosFiltrados = [];
let currentArea = "";
let editingReqId = null;
let currentReqIndex = 0;
let selectedFiles = []; // 🔹 NUEVA VARIABLE PARA ARCHIVOS

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

// INICIALIZAR
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const areaParam = urlParams.get("area");
    const areaNameEl = document.getElementById("areaName");

    if (!areaParam) {
        areaNameEl.textContent = "Área no encontrada";
        document.getElementById("noData").style.display = "block";
        return;
    }

    currentArea = areasMap[areaParam] || areaParam;
    areaNameEl.textContent = currentArea;

    loadRequerimientos();
    setupEventListeners();
});

// CARGAR REQUERIMIENTOS
function loadRequerimientos() {
    const requerimientosRef = window.firestore.collection(window.db, "requerimientos");

    window.firestore.onSnapshot(requerimientosRef, (snapshot) => {
        todosLosRequerimientos = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const areaNormalizada = normalizeText(data.area || "");
            const nombreBuscado = normalizeText(currentArea);

            if (areaNormalizada.includes(nombreBuscado) || nombreBuscado.includes(areaNormalizada)) {
                todosLosRequerimientos.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        requerimientosFiltrados = [...todosLosRequerimientos];
        renderRequerimientos();
    });
}

// RENDERIZAR
function renderRequerimientos() {
    const grid = document.getElementById("requirementsGrid");
    const noData = document.getElementById("noData");

    if (requerimientosFiltrados.length === 0) {
        grid.style.display = "none";
        noData.style.display = "block";
        return;
    }

    grid.style.display = "grid";
    noData.style.display = "none";
    grid.innerHTML = "";

    requerimientosFiltrados.forEach((req, index) => {
        const card = createReqCard(req, index);
        grid.appendChild(card);
    });
}

function createReqCard(req, index) {
    const titulo = req.titulo || req.descripcion || "Sin título";
    const tipo = (req.tipo || "No especificado").toUpperCase();
    const estado = (req.estado || "PENDIENTE").toUpperCase();
    const monto = Number(req.monto || 0);
    const fecha = req.fecha || "-";

    const statusClass = estado.includes("PENDIENTE") ? "pending"
        : estado.includes("PROCESO") ? "process"
            : "completed";

    const iconType = tipo.includes("BIEN") ? "fa-box"
        : tipo.includes("SERVICIO") ? "fa-tools"
            : "fa-hard-hat";

    const card = document.createElement("div");
    card.className = "area-req-card";
    card.innerHTML = `
                <div class="area-req-header">
                    <div class="area-req-type">
                        <i class="fas fa-briefcase"></i>
                        <span>${tipo}</span>
                    </div>
                    <div class="area-req-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        <span>${estado}</span>
                    </div>
                </div>
                <div class="area-req-body">
                    <div class="area-req-icon-wrapper">
                        <div class="area-req-icon">
                            <i class="fas ${iconType}"></i>
                        </div>
                    </div>
                    <h3 class="area-req-title">${titulo}</h3>
                </div>
                <div class="area-req-info">
                    <span class="area-req-budget">S/. ${monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    <span class="area-req-date">
                        <i class="fas fa-calendar"></i> ${fecha}
                    </span>
                </div>
            `;

    card.addEventListener("click", () => openDetailModal(index));
    return card;
}

// EVENT LISTENERS
function setupEventListeners() {
    // Botón de retroceso
    document.getElementById("backBtn").addEventListener("click", () => {
        window.history.back();
    });

    // Búsqueda
    document.getElementById("searchInput").addEventListener("input", (e) => {
        const searchTerm = normalizeText(e.target.value);
        requerimientosFiltrados = todosLosRequerimientos.filter(req => {
            const titulo = normalizeText(req.titulo || "");
            const descripcion = normalizeText(req.descripcion || "");
            const tipo = normalizeText(req.tipo || "");
            return titulo.includes(searchTerm) || descripcion.includes(searchTerm) || tipo.includes(searchTerm);
        });
        renderRequerimientos();
    });

    // Crear nuevo requerimiento
    document.getElementById("createBtn").addEventListener("click", () => {
        editingReqId = null;
        document.getElementById("modalFormTitle").textContent = "Crear Nuevo Requerimiento";
        document.getElementById("requirementForm").reset();
        document.getElementById("formFecha").value = new Date().toISOString().split('T')[0];

        // 🔹 LIMPIAR ARCHIVOS AL CREAR NUEVO
        selectedFiles = [];
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('formPdfs').value = '';

        document.getElementById("createModal").classList.add("active");
    });

    // Cerrar modales
    document.getElementById("closeCreateModal").addEventListener("click", () => {
        document.getElementById("createModal").classList.remove("active");
    });

    document.getElementById("closeDetailModal").addEventListener("click", () => {
        document.getElementById("detailModal").classList.remove("active");
    });

    document.getElementById("cancelFormBtn").addEventListener("click", () => {
        document.getElementById("createModal").classList.remove("active");
    });

    // Guardar formulario
    document.getElementById("saveFormBtn").addEventListener("click", saveRequerimiento);

    // 🔹 AGREGAR MANEJO DE ARCHIVOS 🔹
    document.getElementById("formPdfs").addEventListener("change", handleFileSelect);
    // Acciones del detalle
    //document.getElementById("viewStatusBtn").addEventListener("click", () => {
    //  const estado = document.getElementById("detailEstado").textContent;
    ////alert(`Estado actual: ${estado}`);
    //});

    // Acciones del detalle
    document.getElementById("editBtn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        editRequerimiento();
    }); document.getElementById("deleteBtn").addEventListener("click", deleteRequerimiento);

    // Cerrar modales al hacer click fuera
    document.getElementById("createModal").addEventListener("click", (e) => {
        if (e.target.id === "createModal") {
            e.target.classList.remove("active");
        }
    });

    document.getElementById("detailModal").addEventListener("click", (e) => {
        if (e.target.id === "detailModal") {
            e.target.classList.remove("active");
        }
    });
    // 🔹 CERRAR VISOR DE PDF
    document.getElementById('closePdfViewer').addEventListener('click', () => {
        const modal = document.getElementById('pdfViewerModal');
        modal.classList.remove('active');
        document.getElementById('pdfViewerIframe').src = '';
    });

    // Cerrar visor al hacer clic fuera
    document.getElementById('pdfViewerModal').addEventListener('click', (e) => {
        if (e.target.id === 'pdfViewerModal') {
            e.target.classList.remove('active');
            document.getElementById('pdfViewerIframe').src = '';
        }
    });
}

// 🔹 MANEJAR SELECCIÓN DE ARCHIVOS (CON LÍMITES ESTRICTOS)
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const maxSize = 1.5 * 1024 * 1024; // 🔹 REDUCIDO A 1.5MB por archivo
    const maxFiles = 3; // 🔹 MÁXIMO 3 archivos

    // Validar cantidad total
    if (selectedFiles.length + files.length > maxFiles) {
        alert(`⚠️ Solo puedes subir un máximo de ${maxFiles} archivos PDF`);
        e.target.value = '';
        return;
    }

    let totalSize = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    let filesAdded = 0;

    // Validar cada archivo
    for (const file of files) {
        // Validar tamaño individual
        if (file.size > maxSize) {
            alert(`⚠️ "${file.name}" excede 1.5MB.\n\nPor favor, comprime el PDF antes de subirlo.\n\nPuedes usar: smallpdf.com o ilovepdf.com`);
            continue;
        }

        // Validar tipo
        if (file.type !== 'application/pdf') {
            alert(`⚠️ "${file.name}" no es un PDF válido`);
            continue;
        }

        // Validar tamaño total
        if (totalSize + file.size > 4 * 1024 * 1024) { // Máximo 4MB total
            alert(`⚠️ El tamaño total de los archivos excedería 4MB.\n\nActual: ${(totalSize / 1024 / 1024).toFixed(2)}MB\nNuevo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            continue;
        }

        selectedFiles.push(file);
        totalSize += file.size;
        filesAdded++;
    }

    if (filesAdded > 0) {
        updateFilePreview();
        console.log(`✅ ${filesAdded} archivo(s) agregado(s). Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }

    e.target.value = '';
}

// 🔹 ACTUALIZAR VISTA PREVIA DE ARCHIVOS (VERSIÓN CORREGIDA)
function updateFilePreview() {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';

    if (selectedFiles.length === 0) return;

    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        // Verificar si es un archivo real o uno cargado de Firestore
        const fileName = file.name || file.nombre || 'Archivo';
        const fileSize = file.size ? (file.size / 1024).toFixed(2) : '0';

        item.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-pdf file-icon"></i>
                <div class="file-details">
                    <span class="file-name">${fileName}</span>
                    <span class="file-size">${fileSize} KB</span>
                </div>
            </div>
            <button type="button" class="file-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Botón eliminar
        item.querySelector('.file-remove').addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            updateFilePreview();
        });

        preview.appendChild(item);
    });
}

// ABRIR DETALLE
function openDetailModal(index) {
    currentReqIndex = index;
    const req = requerimientosFiltrados[index];

    if (!req) return;

    document.getElementById("detailTitle").textContent = req.titulo || "Sin título";
    document.getElementById("detailFecha").textContent = req.fecha || "-";
    document.getElementById("detailTipo").textContent = (req.tipo || "No especificado").toUpperCase();

    const estado = (req.estado || "PENDIENTE").toUpperCase();
    const badgeClass = estado.includes("PENDIENTE") ? "adr-estado-pendiente"
        : estado.includes("PROCESO") ? "adr-estado-en-proceso"
            : "adr-estado-finalizado";

    const badgeEl = document.getElementById('detailEstadoBadge');
    badgeEl.textContent = estado;
    badgeEl.className = `adr-estado-badge ${badgeClass}`;

    document.getElementById("detailMonto").textContent = `S/. ${Number(req.monto || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
    document.getElementById("detailDescripcion").textContent = req.descripcion || "Sin descripción";
    document.getElementById("detailArea").textContent = req.area || "Sin área";

    // 🔹 CARGAR PDFs
    loadPdfPreview(req);

    // Cargar comentarios
    loadComments(req.id);

    document.getElementById("detailModal").classList.add("active");
}

// 🔹 CARGAR VISTA PREVIA DE PDFs
function loadPdfPreview(req) {
    const pdfSection = document.getElementById('pdfSection');
    const pdfContainer = document.getElementById('detailPdfs');

    if (!req.pdfs || req.pdfs.length === 0) {
        pdfSection.style.display = 'none';
        return;
    }

    pdfSection.style.display = 'block';
    pdfContainer.innerHTML = '';

    req.pdfs.forEach((pdf, index) => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-preview-item';

        const sizeKB = pdf.size ? (pdf.size / 1024).toFixed(2) : '0';

        pdfItem.innerHTML = `
            <div class="pdf-preview-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="pdf-preview-info">
                <div class="pdf-preview-name">${pdf.nombre || `Archivo ${index + 1}.pdf`}</div>
                <div class="pdf-preview-size">${sizeKB} KB</div>
            </div>
            <div class="pdf-preview-actions">
                <button class="pdf-action-btn pdf-view-btn" title="Ver PDF">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="pdf-action-btn pdf-download-btn" title="Descargar PDF">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;

        // Botón Ver
        pdfItem.querySelector('.pdf-view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            viewPdf(pdf);
        });

        // Botón Descargar
        pdfItem.querySelector('.pdf-download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadPdf(pdf);
        });

        pdfContainer.appendChild(pdfItem);
    });
}

// 🔹 VISUALIZAR PDF (AHORA CON URL)
function viewPdf(pdf) {
    const modal = document.getElementById('pdfViewerModal');
    const iframe = document.getElementById('pdfViewerIframe');
    const fileName = document.getElementById('pdfViewerFileName');

    fileName.textContent = pdf.nombre || 'Archivo PDF';
    // Usar URL en lugar de data
    iframe.src = pdf.url || pdf.data; // Compatibilidad con versión anterior
    modal.classList.add('active');
}

// 🔹 DESCARGAR PDF (AHORA CON URL)
function downloadPdf(pdf) {
    const link = document.createElement('a');
    link.href = pdf.url || pdf.data; // Compatibilidad con versión anterior
    link.download = pdf.nombre || 'documento.pdf';
    link.target = '_blank'; // Abrir en nueva pestaña
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// CARGAR COMENTARIOS
function loadComments(reqId) {
    const container = document.getElementById("commentsContainer");

    // Buscar comentarios en el campo comentarioAdmin del requerimiento
    const req = todosLosRequerimientos.find(r => r.id === reqId);

    if (!req || !req.comentarioAdmin || req.comentarioAdmin.trim() === '') {
        container.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comment-slash"></i>
                <p>No hay comentarios</p>
            </div>
        `;
        return;
    }

    // Mostrar el comentario del administrador
    container.innerHTML = "";
    const comentario = {
        texto: req.comentarioAdmin,
        autor: "Administrador",
        fecha: req.fechaComentario || req.fechaCreacion
    };

    const commentEl = createCommentElement('admin-comment', comentario);
    container.appendChild(commentEl);
}

function createCommentElement(commentId, comment) {
    const div = document.createElement("div");
    div.className = "comment-item";

    // Manejo mejorado de fechas
    let fecha = "-";
    if (comment.fecha) {
        if (comment.fecha.seconds) {
            fecha = new Date(comment.fecha.seconds * 1000).toLocaleDateString('es-PE');
        } else if (comment.fecha.toDate) {
            fecha = comment.fecha.toDate().toLocaleDateString('es-PE');
        } else if (typeof comment.fecha === 'string') {
            fecha = new Date(comment.fecha).toLocaleDateString('es-PE');
        }
    }

    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.autor || "Administrador"}</span>
        </div>
        <p class="comment-text">${comment.texto || ""}</p>
        <span class="comment-date">${fecha}</span>
    `;

    // ⚠️ YA NO hay botón de eliminar, así que NO intentamos acceder a él
    // Los usuarios NO pueden eliminar comentarios

    return div;
}

// GUARDAR REQUERIMIENTO (OPTIMIZADO Y CORREGIDO)
async function saveRequerimiento() {
    const titulo = document.getElementById("formTitulo").value.trim();
    const fecha = document.getElementById("formFecha").value;
    const tipo = document.getElementById("formTipo").value;
    const monto = document.getElementById("formMonto").value;
    const descripcion = document.getElementById("formDescripcion").value.trim();

    if (!titulo || !fecha || !tipo || !monto || !descripcion) {
        alert("Por favor completa todos los campos obligatorios");
        return;
    }

    const btnSave = document.getElementById("saveFormBtn");
    const originalText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const pdfData = [];

        // Procesar archivos
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];

            btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando ${i + 1}/${selectedFiles.length}...`;

            if (file.data) {
                // Archivo ya procesado (de edición)
                pdfData.push({
                    nombre: file.nombre || file.name,
                    data: file.data,
                    size: file.size || 0,
                    type: file.type || 'application/pdf'
                });
            } else if (file.url) {
                // Archivo con URL (de Firebase Storage anterior)
                pdfData.push({
                    nombre: file.nombre || file.name,
                    data: file.url,
                    size: file.size || 0,
                    type: file.type || 'application/pdf'
                });
            } else {
                // Nuevo archivo - convertir a Base64
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        reject(new Error(`Error al leer ${file.name}`));
                    };
                    reader.readAsDataURL(file);
                });

                pdfData.push({
                    nombre: file.name,
                    data: base64,
                    size: file.size,
                    type: file.type
                });
            }
        }

        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        const data = {
            titulo: titulo,
            fecha: fecha,
            tipo: tipo,
            monto: parseFloat(monto),
            descripcion: descripcion,
            area: currentArea,
            estado: "PENDIENTE",
            pdfs: pdfData
        };

        if (editingReqId) {
            // EDITAR
            const docRef = window.firestore.doc(window.db, "requerimientos", editingReqId);
            await window.firestore.updateDoc(docRef, data);
            alert("✅ Requerimiento actualizado exitosamente");
        } else {
            // CREAR
            data.fechaCreacion = window.firestore.serverTimestamp();
            await window.firestore.addDoc(
                window.firestore.collection(window.db, "requerimientos"),
                data
            );
            alert("✅ Requerimiento creado exitosamente");
        }

        // Limpiar formulario
        document.getElementById("createModal").classList.remove("active");
        document.getElementById("requirementForm").reset();
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('formPdfs').value = '';
        selectedFiles = [];
        editingReqId = null;

    } catch (error) {
        console.error("❌ Error completo:", error);
        alert("❌ Error al guardar: " + error.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}

// 🔹 FUNCIÓN PARA CONVERTIR ARCHIVO A BASE64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
// EDITAR REQUERIMIENTO (CORREGIDO)
function editRequerimiento() {
    const req = requerimientosFiltrados[currentReqIndex];
    if (!req) return;

    editingReqId = req.id;
    document.getElementById("modalFormTitle").textContent = "Editar Requerimiento";
    document.getElementById("formTitulo").value = req.titulo || "";
    document.getElementById("formFecha").value = req.fecha || "";
    document.getElementById("formTipo").value = req.tipo || "";
    document.getElementById("formMonto").value = req.monto || "";
    document.getElementById("formDescripcion").value = req.descripcion || "";

    // Cargar PDFs existentes
    selectedFiles = [];
    if (req.pdfs && req.pdfs.length > 0) {
        selectedFiles = req.pdfs.map(pdf => ({
            nombre: pdf.nombre,
            name: pdf.nombre,
            size: pdf.size || 0,
            type: pdf.type || 'application/pdf',
            data: pdf.data, // Mantener data (puede ser base64 o URL)
            url: pdf.url    // Mantener url si existe
        }));
        updateFilePreview();
    } else {
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('formPdfs').value = '';
    }

    document.getElementById("detailModal").classList.remove("active");
    document.getElementById("createModal").classList.add("active");
}
// ELIMINAR REQUERIMIENTO
async function deleteRequerimiento() {
    const req = requerimientosFiltrados[currentReqIndex];
    if (!req) return;

    if (!confirm("¿Estás seguro de eliminar este requerimiento?")) return;

    try {
        const docRef = window.firestore.doc(window.db, "requerimientos", req.id);
        await window.firestore.deleteDoc(docRef);

        document.getElementById("detailModal").classList.remove("active");
        alert("Requerimiento eliminado exitosamente");
    } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar el requerimiento");
    }
}