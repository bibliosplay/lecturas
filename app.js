/**
 * ==========================================================================
 * SISTEMA UNIFICADO: BUSCADOR + DISPONIBILIDAD EN SEGUNDO PLANO (ALEPH v.24)
 * Biblioteca Pública del Maule - Recomendaciones Clase 800
 * ==========================================================================
 */

const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';
let todosLosLibros = []; // Memoria para almacenar el JSON completo de literatura

// 1. EVENTO INICIAL: Carga el JSON de la biblioteca al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    fetch('libros.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar libros.json');
            return response.json();
        })
        .then(libros => {
            todosLosLibros = libros;
            
            // Mostramos los primeros libros o dejamos el catálogo listo
            renderizarCatalogoHTML(todosLosLibros);
            consultarEstadosEnSegundoPlano(todosLosLibros);

            // Escuchamos lo que el usuario escribe en la barra de búsqueda
            configurarBuscador();
        })
        .catch(err => console.error("Error al inicializar la plataforma:", err));
});

// 2. CONFIGURACIÓN DEL BUSCADOR INTEGRADO
function configurarBuscador() {
    const inputBuscador = document.getElementById('buscador'); // Mapea tu barra de texto
    if (!inputBuscador) return;

    inputBuscador.addEventListener('input', (e) => {
        const textoUsuario = e.target.value.toLowerCase().trim();

        if (textoUsuario === "") {
            // Si la barra está vacía, mostramos todo
            renderizarCatalogoHTML(todosLosLibros);
            consultarEstadosEnSegundoPlano(todosLosLibros);
            return;
        }

        // Filtramos por título o por autor en base a lo que escribes (ej: bolaño)
        const librosFiltrados = todosLosLibros.filter(libro => {
            const matchTitulo = libro.titulo ? libro.titulo.toLowerCase().includes(textoUsuario) : false;
            const matchAutor = libro.autor ? libro.autor.toLowerCase().includes(textoUsuario) : false;
            return matchTitulo || matchAutor;
        });

        renderizarCatalogoHTML(librosFiltrados);
        consultarEstadosEnSegundoPlano(librosFiltrados);
    });
}

// 3. RENDERIZADO: Construye las cajas de los libros en pantalla
function renderizarCatalogoHTML(libros) {
    // Apuntamos al contenedor principal de la grilla
    const contenedor = document.getElementById('contenedor-libros') || document.getElementById('grilla'); 
    const estadoCarga = document.getElementById('estadoCarga');

    if (!contenedor) return;
    
    // Ocultamos el mensaje de "Consultando el catálogo..." si hay libros que mostrar
    if (estadoCarga && libros.length > 0) {
        estadoCarga.style.display = 'none';
    } else if (estadoCarga && libros.length === 0) {
        estadoCarga.style.display = 'block';
        estadoCarga.textContent = "No se encontraron libros para esta consulta.";
    }

    contenedor.innerHTML = ''; // Limpiamos los resultados anteriores

    libros.forEach(libro => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'book-card';
        tarjeta.id = `libro-${libro.id_sistema}`; 

        tarjeta.innerHTML = `
            <div class="book-info" style="border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; background: #fff;">
                <h3 class="book-title" style="margin: 0 0 5px 0; color: #333;">${libro.titulo}</h3>
                <p class="book-author" style="margin: 0 0 5px 0; color: #666;">Por: ${libro.autor}</p>
                <p class="book-meta" style="margin: 0; font-size: 0.85em; color: #999;">Clasificación: ${libro.clasificacion || '800'}</p>
                
                <!-- Contenedor donde se insertará el óvalo en segundo plano de Aleph -->
                <div class="availability-container" style="margin-top: 10px; padding-top: 5px; border-top: 1px dashed #eee;">
                    <span class="status-badge status-waiting">🔄 Verificando...</span>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 4. CONSULTA EN SEGUNDO PLANO: Interroga de forma silenciosa al proxy local (Puerto 3000)
function consultarEstadosEnSegundoPlano(libros) {
    // Consultamos solo los primeros 20 resultados visibles para no sobrecargar el navegador de golpe
    const visibles = libros.slice(0, 20);

    visibles.forEach(libro => {
        if (!libro.id_sistema) return;

        fetch(`${PUENTE_ALEPH_URL}/${libro.id_sistema}`)
            .then(res => res.json())
            .then(respuestaProxy => {
                if (respuestaProxy.success) {
                    actualizarEtiquetaVisual(libro.id_sistema, respuestaProxy.data);
                } else {
                    marcarErrorEnTarjeta(libro.id_sistema);
                }
            })
            .catch(err => {
                console.error(`Error en segundo plano para ID ${libro.id_sistema}:`, err);
                marcarErrorEnTarjeta(libro.id_sistema);
            });
    });
}

// 5. CAMBIO DE COLOR EN VIVO: Transforma las etiquetas grises según el estado de la estantería
function actualizarEtiquetaVisual(idSistema, datosLibro) {
    const tarjeta = document.getElementById(`libro-${idSistema}`);
    if (!tarjeta) return;

    const contenedorDisponibilidad = tarjeta.querySelector('.availability-container');
    if (!contenedorDisponibilidad) return;

    if (datosLibro.disponible) {
        contenedorDisponibilidad.innerHTML = `<span class="status-badge status-available" style="color: green; font-weight: bold;">🟢 Disponible en estantería</span>`;
    } else {
        const retorno = datosLibro.fecha_devolucion;
        contenedorDisponibilidad.innerHTML = `<span class="status-badge status-borrowed" style="color: red; font-weight: bold;">🔴 Prestado ${retorno ? `(Devuelve: ${retorno})` : '- En circulación'}</span>`;
    }
}

function marcarErrorEnTarjeta(idSistema) {
    const tarjeta = document.getElementById(`libro-${idSistema}`);
    if (!tarjeta) return;
    const contenedor = tarjeta.querySelector('.availability-container');
    if (contenedor) {
        contenedor.innerHTML = `<span class="status-badge status-error" style="color: #b06000;">⚠️ Verificación no disponible</span>`;
    }
}
