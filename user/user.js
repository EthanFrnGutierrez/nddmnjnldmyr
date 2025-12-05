// Elementos del DOM
const header = document.querySelector('.adr-header');
const cards = document.querySelectorAll('.muni-areas-card');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

// Variables de estado
let isScrolled = false;
let lastScrollTop = 0;

function handleHeaderScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Añade clase cuando se hace scroll
    if (scrollTop > 50 && !isScrolled) {
        header.classList.add('scrolled');
        isScrolled = true;
    } else if (scrollTop <= 50 && isScrolled) {
        header.classList.remove('scrolled');
        isScrolled = false;
    }

    lastScrollTop = scrollTop;
}

// Event listener para scroll con optimización
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleHeaderScroll();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// ============================================
// FUNCIONALIDAD DE BÚSQUEDA
// ============================================

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
 * Filtra las tarjetas según el término de búsqueda
 */
function filterCards(searchTerm) {
    const normalizedSearch = normalizeText(searchTerm);
    let visibleCount = 0;

    cards.forEach((card, index) => {
        const title = card.querySelector('.muni-areas-card-title').textContent;
        const normalizedTitle = normalizeText(title);

        if (normalizedTitle.includes(normalizedSearch)) {
            // Muestra la tarjeta con animación
            card.style.display = 'flex';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 30);
            visibleCount++;
        } else {
            // Oculta la tarjeta
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    // Muestra mensaje si no hay resultados
    showNoResultsMessage(visibleCount === 0);
}

/**
 * Muestra u oculta mensaje de "sin resultados"
 */
function showNoResultsMessage(show) {
    let noResultsMsg = document.getElementById('noResultsMessage');

    if (show && !noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'req-no-results';
        noResultsMsg.innerHTML = `
            <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
            <h3 style="color: #374151; margin-bottom: 0.5rem;">No se encontraron resultados</h3>
            <p style="color: #6b7280;">Intenta con otro término de búsqueda</p>
        `;
        document.querySelector('.muni-areas-cards-grid').appendChild(noResultsMsg);
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

/**
 * Maneja el evento de búsqueda
 */
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();

    // Muestra u oculta el botón de limpiar
    if (searchTerm.length > 0) {
        clearSearchBtn.style.display = 'flex';
        filterCards(searchTerm);
    } else {
        clearSearchBtn.style.display = 'none';
        // Muestra todas las tarjetas
        cards.forEach((card, index) => {
            card.style.display = 'flex';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 30);
        });
        showNoResultsMessage(false);
    }
});

/**
 * Limpia la búsqueda
 */
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';

    // Muestra todas las tarjetas
    cards.forEach((card, index) => {
        card.style.display = 'flex';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 30);
    });

    showNoResultsMessage(false);
    searchInput.focus();
});

// ============================================
// ANIMACIÓN DE ENTRADA DE TARJETAS
// ============================================

/**
 * Observer para animaciones al hacer scroll
 */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Añade delay escalonado para efecto cascada
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 50);

            cardObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Inicializa las tarjetas con estado invisible
cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
    cardObserver.observe(card);
});

// ============================================
// EFECTOS DE INTERACCIÓN EN TARJETAS
// ============================================

/**
 * Añade efectos de interacción a las tarjetas
 */
cards.forEach(card => {
    // Efecto parallax sutil con el mouse
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `
            translateY(-0.5rem) 
            scale(1.02) 
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg)
        `;
    });

    // Resetea la transformación al salir
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1) perspective(1000px) rotateX(0) rotateY(0)';
    });

    // Efecto de click con feedback visual
    card.addEventListener('click', function (e) {
        // Animación de click
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);

        // Log del área seleccionada
        const areaName = this.querySelector('.muni-areas-card-title').textContent;
        const areaData = this.getAttribute('data-area');
        console.log('Navegando a:', areaName, '- Data:', areaData);

        // Crear efecto ripple
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('req-ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    // Mejora accesibilidad con teclado
    card.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
});

// Estilos del efecto ripple
const style = document.createElement('style');
style.textContent = `
    .req-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(30, 64, 175, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// ATAJOS DE TECLADO
// ============================================

/**
 * Maneja atajos de teclado para accesibilidad
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K para enfocar búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }

    // Escape para limpiar búsqueda
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        if (searchInput.value) {
            searchInput.value = '';
            clearSearchBtn.click();
        } else {
            searchInput.blur();
        }
    }
});

// ============================================
// EFECTOS ADICIONALES Y OPTIMIZACIONES
// ============================================

/**
 * Lazy loading de iconos mejorado
 */
const icons = document.querySelectorAll('.muni-areas-card-icon i');
icons.forEach((icon, index) => {
    setTimeout(() => {
        icon.style.opacity = '1';
    }, index * 50);
});

/**
 * Maneja el redimensionamiento de la ventana
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalcula posiciones si es necesario
        console.log('Ventana redimensionada');
    }, 250);
});

/**
 * Previene el scroll horizontal en móviles
 */
document.body.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Detecta el tema del sistema (claro/oscuro)
 */
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('Tema oscuro detectado');
    }
}

/**
 * Guarda la última búsqueda en localStorage
 */
function saveLastSearch(searchTerm) {
    try {
        localStorage.setItem('req_last_search', searchTerm);
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

/**
 * Carga la última búsqueda
 */
function loadLastSearch() {
    try {
        return localStorage.getItem('req_last_search') || '';
    } catch (e) {
        console.warn('No se pudo cargar desde localStorage:', e);
        return '';
    }
}

// Guarda búsquedas automáticamente
//searchInput.addEventListener('input', (e) => {
//  if (e.target.value.trim()) {
//       saveLastSearch(e.target.value);
//    }
//});

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Función de inicialización principal
 */
function init() {
    console.log('Sistema de Requerimientos Funcionales iniciado');
    console.log('Total de áreas:', cards.length);
    detectSystemTheme();

    // Añade clase al body cuando todo está cargado
    document.body.classList.add('loaded');

    // Carga última búsqueda si existe
    //const lastSearch = loadLastSearch();
    //if (lastSearch) {
    //searchInput.value = lastSearch;
    // No filtrar automáticamente, solo mostrar el texto
    //}

    // Mensaje de bienvenida en consola
    console.log('%c¡Sistema de Requerimientos Funcionales!',
        'color: #1e40af; font-size: 16px; font-weight: bold;');
    console.log('%cCtrl/Cmd + K para buscar rápidamente',
        'color: #6b7280; font-size: 12px;');
}

// Ejecuta cuando el DOM está completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// TRACKING DE NAVEGACIÓN (OPCIONAL)
// ============================================

/**
 * Registra clicks en tarjetas para analytics
 */
cards.forEach(card => {
    card.addEventListener('click', function () {
        const areaName = this.getAttribute('data-area');
        const areaTitle = this.querySelector('.muni-areas-card-title').textContent;

        // Aquí puedes integrar con Google Analytics u otro servicio
        console.log('Analytics: Área visitada', {
            area: areaName,
            title: areaTitle,
            timestamp: new Date().toISOString()
        });
    });
});

// ============================================
// FIX ICONOS FONT AWESOME
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const iconsContainers = document.querySelectorAll('.muni-areas-card-icon');

    iconsContainers.forEach(container => {
        const icon = container.querySelector('i');
        if (icon) {
            // Forzar estilos inline para asegurar visibilidad
            icon.style.cssText = `
                display: inline-block !important;
                font-size: 1.75rem !important;
                color: #ffffff !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
        }
    });

    console.log('✅ Iconos Font Awesome verificados');
});