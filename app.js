/**
 * ==========================================================================
 * SISTEMA DEFINITIVO: LECTURA DE ESTRUCTURA JSON RECOMENDADOS + PROXY ALEPH
 * Biblioteca Pública del Maule - Clase 800
 * ==========================================================================
 */

const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';
let catalogoCompleto = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargamos tu archivo libros.json
    fetch('libros.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar libros.json');
            return response.json();
        })
        .then(data => {
            // Mapeo exacto: Extraemos el arreglo de la propiedad "libros" del JSON
            if (data && Array.isArray(data.libros)) {
                catalogoCompleto = data.libros;
                console.log("Libros cargados con éxito:", catalogoCompleto.length);
                
                // Desplegamos los primeros 40 libros en pantalla al entrar
                mostrarLibrosEnPantalla(catalogoCompleto.slice(0, 40));

                // Activamos tu barra de búsqueda sobre este catálogo
                inicializarBuscadorMaule(catalogoCompleto);
            } else {
                console.error("La estructura del JSON no contiene la propiedad 'libros' como arreglo.");
            }
        })
        .catch(err => console.error("Error cargando el catálogo:", err));
});

// 2. Filtro dinámico para cuando el usuario escribe (ej: "bolaño")
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
            // Usamos las etiquetas exactas de tu JSON: titulo y autor
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
        
        // Vinculamos el ID de la tarjeta al número único del libro
        tarjeta.id = `libro-${libro.id}`;
        
        // Estilo adaptado para mantener la elegancia de tu grilla
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

        // Si tu ID de libro en el JSON coincide con el ID de sistema en Aleph, consultamos
        if (libro.id) {
            preguntarDisponibilidadAleph(libro.id);
        }
    });
}

// 4. Consulta silenciosa a tu servidor proxy local (Puerto 3000)
function preguntarDisponibilidadAleph(idSistema) {
    // Rellenamos con ceros a la izquierda para cumplir los 9 dígitos que exige tu proxy
    const idFormateado = String(idSistema).padStart(9, '0');

    fetch(`${PUENTE_ALEPH_URL}/${idFormateado}`)
        .then(res => res.json())
        .then(json => {
            const tarjeta = document.getElementById(`libro-${idSistema}`);
            if (!tarjeta) return;

            const contenedorBadge = tarjeta.querySelector('.availability-container');
            if (!contenedorBadge) return;

            if (json.success && json.data.disponible) {
                contenedorBadge.innerHTML = `<span style="color: #137333; font-weight: bold; background: #e6f4ea; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">🟢 Disponible</span>`;
            } else {
                const fDevolucion = json.data?.fecha_devolucion;
                contenedorBadge.innerHTML = `<span style="color: #c5221f; font-weight: bold; background: #fce8e6; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">🔴 Prestado ${fDevolucion ? `(Vuelve: ${fDevolucion})` : ''}</span>`;
            }
        })
        .catch(() => {
            const tarjeta = document.getElementById(`libro-${idSistema}`);
            if (!tarjeta) return;
            const contenedorBadge = tarjeta.querySelector('.availability-container');
            if (contenedorBadge) {
                contenedorBadge.innerHTML = `<span style="color: #555; background: #f5f5f5; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">ℹ️ Disponible en sala</span>`;
            }
        });
}
