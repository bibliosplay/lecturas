/**
 * ==========================================================================
 * SISTEMA DE DISPONIBILIDAD AUTOMÁTICA EN SEGUNDO PLANO (ALEPH v.24)
 * Biblioteca Pública del Maule - Recomendaciones Clase 800
 * ==========================================================================
 */

// URL de tu servidor proxy local gestionado por PM2
const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';

// 1. EVENTO INICIAL: Se dispara automáticamente apenas el usuario abre la página web
document.addEventListener('DOMContentLoaded', () => {
    // Leemos el archivo JSON local con tus recomendaciones de literatura
    fetch('libros.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar el archivo libros.json');
            return response.json();
        })
        .then(libros => {
            // Dibujamos las tarjetas visuales en el HTML
            renderizarCatalogoHTML(libros);
            
            // Disparamos las consultas silenciosas a Aleph sin intervención del usuario
            consultarEstadosEnSegundoPlano(libros);
        })
        .catch(err => console.error("Error al inicializar el catálogo:", err));
});

// 2. RENDERIZADO: Dibuja las tarjetas con el indicador de carga circular (Spinner)
function renderizarCatalogoHTML(libros) {
    // Buscamos el contenedor principal de tu página (asegúrate de que tu HTML tenga este ID)
    const contenedor = document.getElementById('contenedor-libros'); 
    if (!contenedor) {
        console.error("No se encontró el contenedor HTML con el ID 'contenedor-libros'");
        return;
    }
    
    contenedor.innerHTML = ''; // Limpiamos la pantalla antes de dibujar

    libros.forEach(libro => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'book-card';
        // Le asignamos a la tarjeta un ID único basado en su número de sistema de Aleph
        tarjeta.id = `libro-${libro.id_sistema}`; 

        tarjeta.innerHTML = `
            <div class="book-info">
                <h3 class="book-title">${libro.titulo}</h3>
                <p class="book-author">Por ${libro.autor}</p>
                <p class="book-meta">Clasificación: <span class="tag-meta">${libro.clasificacion}</span></p>
                
                <!-- ESPACIO DINÁMICO: Aquí se inyectará el estado real de la estantería -->
                <div class="availability-container">
                    <span class="status-badge status-waiting">
                        <span class="spinner"></span> Verificando disponibilidad...
                    </span>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 3. SEGUNDO PLANO: El bucle autónomo que interroga al proxy local por cada libro
function consultarEstadosEnSegundoPlano(libros) {
    libros.forEach(libro => {
        // Si el libro no tiene ID de sistema configurado, saltamos la consulta
        if (!libro.id_sistema) {
            marcarErrorEnTarjeta(libro.id_sistema);
            return;
        }

        // Consultamos en segundo plano a nuestro puente seguro de Node.js (Puerto 3000)
        fetch(`${PUENTE_ALEPH_URL}/${libro.id_sistema}`)
            .then(res => res.json())
            .then(respuestaProxy => {
                if (respuestaProxy.success) {
                    // Si el puente obtuvo datos de Santiago, actualizamos la tarjeta en vivo
                    actualizarEtiquetaVisual(libro.id_sistema, respuestaProxy.data);
                } else {
                    marcarErrorEnTarjeta(libro.id_sistema);
                }
            })
            .catch(err => {
                console.error(`Error de conexión con el proxy para el libro ${libro.id_sistema}:`, err);
                marcarErrorEnTarjeta(libro.id_sistema);
            });
    });
}

// 4. ACTUALIZACIÓN VISUAL: Transforma los óvalos grises en verdes o rojos según Aleph
function actualizarEtiquetaVisual(idSistema, datosLibro) {
    const tarjeta = document.getElementById(`libro-${idSistema}`);
    if (!tarjeta) return;

    const contenedorDisponibilidad = tarjeta.querySelector('.availability-container');
    if (!contenedorDisponibilidad) return;

    // Evaluamos el campo lógico de disponibilidad que procesó tu proxy
    if (datosLibro.disponible) {
        contenedorDisponibilidad.innerHTML = `
            <span class="status-badge status-available">
                🟢 Disponible en estantería
            </span>
        `;
    } else {
        // Si está prestado, extraemos la fecha de devolución si viene registrada en el sistema
        const retorno = datosLibro.fecha_devolucion;
        contenedorDisponibilidad.innerHTML = `
            <span class="status-badge status-borrowed">
                🔴 Prestado ${retorno ? `(Devuelve: ${retorno})` : '- En circulación'}
            </span>
        `;
    }
}

// 5. CONTROL DE ERRORES: Se activa si el proxy está apagado o si el ID no existe
function marcarErrorEnTarjeta(idSistema) {
    if (!idSistema) return;
    const tarjeta = document.getElementById(`libro-${idSistema}`);
    if (!tarjeta) return;
    
    const contenedor = tarjeta.querySelector('.availability-container');
    if (contenedor) {
        contenedor.innerHTML = `
            <span class="status-badge status-error">
                ⚠️ Estado no disponible hoy
            </span>
        `;
    }
}
