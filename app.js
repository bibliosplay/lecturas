/**
 * ==========================================================================
 * SISTEMA INTEGRADO DE DISPONIBILIDAD EN SEGUNDO PLANO - ALEPH v.24
 * Biblioteca Pública del Maule - Clase 800
 * ==========================================================================
 */

const PUENTE_ALEPH_URL = 'http://localhost:3000/api/libros';

// Monitoreamos constantemente cuando el sistema nativo pinte libros en la pantalla
const observer = new MutationObserver(() => {
    // Buscamos todas las tarjetas de libros que se dibujaron en tu grilla original
    const tarjetas = document.querySelectorAll('.book-card, [id^="libro-"], .card-libro');
    
    tarjetas.forEach(tarjeta => {
        // Si la tarjeta ya fue procesada o no tiene ID, nos saltamos el paso
        if (tarjeta.dataset.alephProcesado) return;
        
        // Buscamos si la tarjeta tiene un número de sistema en su ID o texto
        let idSistema = tarjeta.id.replace(/\D/g, "");
        
        if (!idSistema) {
            // Si el ID no está en el elemento contenedor, lo extraemos del texto o dataset
            const textoTarjeta = tarjeta.innerText || "";
            const match = textoTarjeta.match(/(?:id|sistema|nº|sys):\s*(\d+)/i);
            if (match) idSistema = match[1];
        }

        if (idSistema) {
            tarjeta.dataset.alephProcesado = "true"; // Marcamos para no repetir
            inyectarContenedorDisponibilidad(tarjeta, idSistema);
        }
    });
});

// Iniciamos la observación automática sobre el cuerpo del catálogo
document.addEventListener('DOMContentLoaded', () => {
    const targetNode = document.getElementById('grilla') || document.getElementById('catalogo') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });
});

// Crea el espacio físico debajo de cada libro para colocar el estado en vivo
function inyectarContenedorDisponibilidad(tarjeta, idSistema) {
    const contenedorBadge = document.createElement('div');
    contenedorBadge.className = "availability-container";
    contenedorBadge.style.cssText = "margin-top: 10px; padding-top: 5px; border-top: 1px dashed #eee; font-family: sans-serif;";
    contenedorBadge.innerHTML = `<span class="status-badge" style="color: #666; font-size: 0.85rem;">🔄 Verificando en Aleph...</span>`;
    
    tarjeta.appendChild(contenedorBadge);

    // Consultamos de inmediato en segundo plano a tu PM2 local (Puerto 3000)
    fetch(`${PUENTE_ALEPH_URL}/${idSistema}`)
        .then(res => res.json())
        .then(json => {
            if (json.success && json.data.disponible) {
                contenedorBadge.innerHTML = `<span class="status-badge" style="color: #137333; font-weight: bold; background: #e6f4ea; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">🟢 Disponible en estantería</span>`;
            } else {
                const fDevolucion = json.data?.fecha_devolucion;
                contenedorBadge.innerHTML = `<span class="status-badge" style="color: #c5221f; font-weight: bold; background: #fce8e6; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">🔴 Prestado ${fDevolucion ? `(Vuelve: ${fDevolucion})` : ''}</span>`;
            }
        })
        .catch(() => {
            // Si el servidor proxy está apagado en tu máquina local, muestra el estado base
            contenedorBadge.innerHTML = `<span class="status-badge" style="color: #444; font-size: 0.8rem; background: #f5f5f5; padding: 3px 8px; border-radius: 12px;">ℹ️ Consulta disponibilidad en mesón</span>`;
        });
}
