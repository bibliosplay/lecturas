/**
 * ==========================================================================
 * SISTEMA DEFINITIVO: CONECTOR RECOMENDADOS + PROXY ALEPH v.24 (BP. TALCA)
 * Biblioteca Pública del Maule - Clase 800
 * ==========================================================================
 */

const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';
let catalogoCompleto = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargamos tu archivo libros.json institucional
    fetch('libros.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar libros.json');
            return response.json();
        })
        .then(data => {
            // Extraemos el arreglo de la propiedad "libros" de tu JSON
            if (data && Array.isArray(data.libros)) {
                catalogoCompleto = data.libros;
                
                // Desplegamos los primeros 40 libros en pantalla al entrar
                mostrarLibrosEnPantalla(catalogoCompleto.slice(0, 40));

                // Activamos tu barra de búsqueda sobre este catálogo
                inicializarBuscadorMaule(catalogoCompleto);
            }
        })
        .catch(err => console.error("Error cargando el catálogo:", err));
});

// 2. Filtro dinámico para cuando escribes (ej: "fuentes" o "bolaño")
function inicializarBuscadorMaule(listaCompleta) {
    const inputBuscador = document.getElementById('buscador');
    if (!inputBuscador) return;

    inputBuscador.addEventListener('input', (e) => {
        const palabra = e.target.value.toLowerCase().trim();

        if (palabra === "") {
            mostrarLibrosEnPantalla(listaCompleta.slice(0, 40));
            return;
        }

        const filtrados = listaCompleta.filter(libro => {
            const tituloOk = libro.titulo ? libro.titulo.toLowerCase().includes(palabra) : false;
            const autorOk = libro.autor ? libro.autor.toLowerCase().includes(palabra) : false;
            return tituloOk || autorOk;
        });

        mostrarLibrosEnPantalla(filtrados);
    });
}

// 3. Dibuja las tarjetas visuales exactamente en tu contenedor "grilla"
function mostrarLibrosEnPantalla(listaDeLibros) {
    const grilla = document.getElementById('grilla');
    if (!grilla) return;

    grilla.innerHTML = ''; // Limpiamos resultados previos

    if (listaDeLibros.length === 0) {
        grilla.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">No se encontraron libros para esta consulta.</p>`;
        return;
    }

    listaDeLibros.forEach(libro => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'book-card';
        
        // Vinculamos el ID de la tarjeta al número único del libro (id)
        tarjeta.id = `libro-${libro.id}`;
        
        // Estilo adaptado para mantener la elegancia de tu grilla crema
        tarjeta.style.cssText = "border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; background: #fff; display: inline-block; width: 260px; vertical-align: top; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;";

        tarjeta.innerHTML = `
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #222;">${libro.titulo || 'Sin título'}</h3>
            <p style="margin: 0 0 5px 0; color: #555; font-size: 0.95rem;">Por: ${libro.autor || 'Autor desconocido'}</p>
            <p style="margin: 0; font-size: 0.85rem; color: #888;">Clasificación: ${libro.clasificacion || '800'}</p>
            
            <!-- Óvalo dinámico de disponibilidad -->
            <div class="availability-container" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee;">
                <span class="status-badge" style="color: #777; font-size: 0.85rem;">🔄 Verificando...</span>
            </div>
        `;
        
        grilla.appendChild(tarjeta);

        // Si tu libro tiene ID, consultamos inmediatamente al proxy de tu máquina
        if (libro.id) {
            preguntarDisponibilidadAleph(libro.id);
        }
    });
}

// 4. Consulta silenciosa a tu servidor proxy local (Puerto 3000)
// 4. Consulta silenciosa a tu servidor proxy local (Puerto 3000)
function preguntarDisponibilidadAleph(idSistema) {
    // Rellenamos con ceros a la izquierda para cumplir los 9 dígitos que exige Aleph
    const idFormateado = String(idSistema).padStart(9, '0');

    fetch(`${PUENTE_ALEPH_URL}/${idFormateado}`)
        .then(res => res.json())
        .then(json => {
            // Buscamos la tarjeta usando la propiedad idSistema unificada
            const tarjeta = document.getElementById(`libro-${idSistema}`);
            if (!tarjeta) return;

            const contenedorBadge = tarjeta.querySelector('.availability-container');
            if (!contenedorBadge) return;

            // LEEMOS LOS DATOS PROCESADOS POR TU SERVIDOR LOCAL (BP. TALCA)
            if (json.success && json.data) {
                contenedorBadge.innerHTML = `
                    <span class="status-badge ${json.data.clase_css || 'status-normal'}">
                        ${json.data.texto || 'ℹ️ Disponible en Sala'}
                    </span>
                `;
            }
        })
        .catch(() => {
            const tarjeta = document.getElementById(`libro-${idSistema}`);
            if (!tarjeta) return;
            const contenedorBadge = tarjeta.querySelector('.availability-container');
            if (contenedorBadge) {
                contenedorBadge.innerHTML = `<span class="status-badge status-normal">ℹ️ Consulta Disponibilidad en Sala</span>`;
            }
        });
}
