/**
 * ==========================================================================
 * SISTEMA DEFINITIVO: MOTOR NATIVO MAULE + CONECTOR ALEPH v.24
 * Biblioteca Pública del Maule - Clase 800
 * ==========================================================================
 */

const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';
let librosCatalogo = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargamos los libros desde tu archivo local
    fetch('libros.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar libros.json');
            return response.json();
        })
        .then(data => {
            librosCatalogo = data;
            
            // Mostramos los primeros 40 libros por defecto al abrir la web
            mostrarLibrosEnPantalla(librosCatalogo.slice(0, 40));

            // Activamos tu buscador nativo
            inicializarBuscadorMaule();
        })
        .catch(err => console.error("Error al inicializar los datos:", err));
});

// 2. Filtro dinámico para cuando escribes (ej: "bolaño")
function inicializarBuscadorMaule() {
    const inputBuscador = document.getElementById('buscador');
    if (!inputBuscador) return;

    inputBuscador.addEventListener('input', (e) => {
        const palabra = e.target.value.toLowerCase().trim();

        if (palabra === "") {
            mostrarLibrosEnPantalla(librosCatalogo.slice(0, 40));
            return;
        }

        const filtrados = librosCatalogo.filter(libro => {
            const tituloOk = libro.titulo ? libro.titulo.toLowerCase().includes(palabra) : false;
            const autorOk = libro.autor ? libro.autor.toLowerCase().includes(palabra) : false;
            return tituloOk || autorOk;
        });

        mostrarLibrosEnPantalla(filtrados);
    });
}

// 3. Función que dibuja las tarjetas exactamente en tu contenedor "grilla"
function mostrarLibrosEnPantalla(listaDeLibros) {
    const grilla = document.getElementById('grilla');
    if (!grilla) return;

    grilla.innerHTML = ''; // Limpiamos resultados anteriores

    if (listaDeLibros.length === 0) {
        grilla.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">No se encontraron libros para esta consulta.</p>`;
        return;
    }

    listaDeLibros.forEach(libro => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'book-card';
        tarjeta.id = `libro-${libro.id_sistema}`;
        
        // Estilo limpio para que combine con el fondo de tu web
        tarjeta.style.cssText = "border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; background: #fff; display: inline-block; width: 260px; vertical-align: top; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;";

        tarjeta.innerHTML = `
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #222;">${libro.titulo}</h3>
            <p style="margin: 0 0 5px 0; color: #555; font-size: 0.95rem;">Por: ${libro.autor}</p>
            <p style="margin: 0; font-size: 0.85rem; color: #888;">Clasificación: ${libro.clasificacion || '800'}</p>
            
            <!-- Óvalo invisible que consultará en segundo plano -->
            <div class="availability-container" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee;">
                <span class="status-badge" style="color: #777; font-size: 0.85rem;">🔄 Verificando...</span>
            </div>
        `;
        
        grilla.appendChild(tarjeta);

        // Preguntamos de inmediato a tu PM2 local por la disponibilidad de este libro
        if (libro.id_sistema) {
            preguntarDisponibilidadAleph(libro.id_sistema);
        }
    });
}

// 4. Consulta silenciosa a tu servidor local (Puerto 3000)
function preguntaráDisponibilidadAleph(idSistema) {
    fetch(`${PUENTE_ALEPH_URL}/${idSistema}`)
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
            // Estado por defecto si el servidor local está apagado
            const tarjeta = document.getElementById(`libro-${idSistema}`);
            if (!tarjeta) return;
            const contenedorBadge = tarjeta.querySelector('.availability-container');
            if (contenedorBadge) {
                contenedorBadge.innerHTML = `<span style="color: #555; background: #f5f5f5; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">ℹ️ Disponible en sala</span>`;
            }
        });
}
