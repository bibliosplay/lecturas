/**
 * ==========================================================================
 * SISTEMA DEFINITIVO: CATÁLOGO WEB DE RECOMENDACIONES LITERARIAS
 * Biblioteca Pública del Maule - Clase 800 (Canal OPAC Directo)
 * ==========================================================================
 */

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
        tarjeta.id = `libro-${libro.id}`;
        
        // Formateamos el ID a 9 dígitos para armar la URL del catálogo unificado
        const idFormateado = String(libro.id).padStart(9, '0');
        
        // URL universal nativa del OPAC que abre la disponibilidad de tu libro directo en Santiago
        const urlOpacDirecta = `http://bncatalogo.cl{idFormateado}`;

        // Estilo adaptado para mantener la elegancia de tu grilla crema
        tarjeta.style.cssText = "border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; background: #fff; display: inline-block; width: 260px; vertical-align: top; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;";

        tarjeta.innerHTML = `
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #222; min-height: 44px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${libro.titulo || 'Sin título'}</h3>
            <p style="margin: 0 0 10px 0; color: #555; font-size: 0.95rem;">Por: ${libro.autor || 'Autor desconocido'}</p>
            <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #888;">Clasificación: ${libro.clasificacion || '800'}</p>
            
            <!-- BOTÓN INTELIGENTE: Abre la disponibilidad real del libro en tu mesón en una pestaña nueva -->
            <div class="availability-container" style="margin-top: auto; padding-top: 10px; border-top: 1px dashed #eee; text-align: center;">
                <a href="${urlOpacDirecta}" target="_blank" class="status-badge" style="color: #0056b3; font-weight: bold; background: #e7f1ff; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; display: inline-block; text-decoration: none; border: 1px solid #b6d4fe; transition: background 0.2s;">
                    🔍 Consultar Disponibilidad Maule
                </a>
            </div>
        `;
        
        grilla.appendChild(tarjeta);
    });
}
