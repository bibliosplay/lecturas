(function () {
  "use strict";

  const LOTE = 60; // cuántas fichas se muestran por tanda, para no saturar el navegador con miles de tarjetas

  const estado = {
    libros: [],
    colecciones: [],
    coleccionActiva: "Todos",
    busqueda: "",
    visibles: LOTE,
    fichaLectura: {},  // { [id]: "quiero" | "leyendo" | "leido" } — solo dura esta sesión
    valoraciones: {},  // { [id]: 1-5 } — calificación personal, solo esta sesión
    resenas: {}        // { [id]: "texto" } — reseña personal, solo esta sesión
  };

  const el = {
    grilla: document.getElementById("grilla"),
    carga: document.getElementById("estadoCarga"),
    sinResultados: document.getElementById("sinResultados"),
    buscador: document.getElementById("buscador"),
    filtros: document.getElementById("filtrosGenero"),
    contador: document.getElementById("contadorFicha"),
    fichaNumero: document.getElementById("fichaNumero"),
    heroDesc: document.getElementById("heroDesc"),
    cargarMasBtn: document.getElementById("cargarMasBtn"),
    contadorVisible: document.getElementById("contadorVisible"),
    catalogoContenido: document.getElementById("catalogoContenido"),
    miFichaView: document.getElementById("miFichaView"),
    miFichaGrupos: document.getElementById("miFichaGrupos"),
    volverCatalogoBtn: document.getElementById("volverCatalogoBtn"),
    modalOverlay: document.getElementById("modalOverlay"),
    modalCerrar: document.getElementById("modalCerrar"),
    modalPortada: document.getElementById("modalPortada"),
    modalGenero: document.getElementById("modalGenero"),
    modalTitulo: document.getElementById("modalTitulo"),
    modalAutor: document.getElementById("modalAutor"),
    modalMeta: document.getElementById("modalMeta"),
    modalDisponibilidad: document.getElementById("modalDisponibilidad"),
    modalChips: document.getElementById("modalChips"),
    modalEstrellasInput: document.getElementById("modalEstrellasInput"),
    modalResenaTexto: document.getElementById("modalResenaTexto"),
    verPendientesBtn: document.getElementById("verPendientesBtn")
  };

  let libroActivoId = null;

  function cargarCatalogo() {
    try {
      if (typeof LECTURAS_DATA === "undefined") {
        throw new Error("no se encontró datos.js");
      }
      const datos = LECTURAS_DATA;
      estado.libros = datos.libros || [];
      estado.colecciones = datos.colecciones || [];
      el.fichaNumero.textContent = String(Math.floor(1000 + Math.random() * 8999)).padStart(6, "0");
      if (el.heroDesc && datos.totalTitulos) {
        el.heroDesc.textContent =
          "Explora " + datos.totalTitulos.toLocaleString("es-CL") + " títulos (" +
          datos.totalEjemplares.toLocaleString("es-CL") + " ejemplares) del catálogo de la biblioteca. " +
          "Marca lo que quieres leer, lo que estás leyendo y lo que ya terminaste — como tu propia ficha de lectora.";
      }
      construirFiltros();
      renderizar();
      el.carga.hidden = true;
      el.grilla.hidden = false;
    } catch (err) {
      el.carga.textContent = "No se pudo cargar el catálogo (" + err.message + "). Revisa que datos.js esté junto a este archivo y que index.html lo incluya con <script src=\"datos.js\"></script> antes de app.js.";
    }
  }

  function construirFiltros() {
    const nombres = ["Todos", ...estado.colecciones];
    el.filtros.innerHTML = "";
    nombres.forEach((coleccion) => {
      const btn = document.createElement("button");
      btn.className = "filtro-btn";
      btn.type = "button";
      btn.textContent = coleccion;
      btn.setAttribute("aria-pressed", coleccion === estado.coleccionActiva ? "true" : "false");
      btn.addEventListener("click", () => {
        estado.coleccionActiva = coleccion;
        estado.visibles = LOTE;
        [...el.filtros.children].forEach((b) =>
          b.setAttribute("aria-pressed", b.textContent === coleccion ? "true" : "false")
        );
        renderizar();
      });
      el.filtros.appendChild(btn);
    });
  }

  function librosFiltrados() {
    const texto = estado.busqueda.trim().toLowerCase();
    return estado.libros.filter((libro) => {
      const coincideColeccion = estado.coleccionActiva === "Todos" || libro.coleccion === estado.coleccionActiva;
      const coincideTexto =
        !texto ||
        libro.titulo.toLowerCase().includes(texto) ||
        libro.autor.toLowerCase().includes(texto);
      return coincideColeccion && coincideTexto;
    });
  }

  function etiquetaEstado(codigo) {
    return { quiero: "Por leer", leyendo: "Leyendo", leido: "Leído" }[codigo] || "";
  }

  function estrellasTexto(valor) {
    const llenas = Math.round(valor);
    return "★".repeat(llenas) + "☆".repeat(5 - llenas);
  }

  function renderizar() {
    const listaCompleta = librosFiltrados();
    const lista = listaCompleta.slice(0, estado.visibles);
    el.grilla.innerHTML = "";
    el.sinResultados.hidden = listaCompleta.length !== 0;
    el.grilla.hidden = listaCompleta.length === 0;

    lista.forEach((libro) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ficha";
      card.setAttribute("aria-label", "Ver ficha de " + libro.titulo + ", de " + libro.autor);

      const estadoLectura = estado.fichaLectura[libro.id];
      const etiquetaHtml = estadoLectura
        ? '<span class="estado-lectura">' + etiquetaEstado(estadoLectura) + "</span>"
        : "";

      card.innerHTML =
        '<div class="ficha__portada" style="background:' + libro.color + '">' +
          libro.iniciales + etiquetaHtml +
        "</div>" +
        '<p class="ficha__genero">' + libro.coleccion + "</p>" +
        '<h3 class="ficha__titulo">' + libro.titulo + "</h3>" +
        '<p class="ficha__autor">' + libro.autor + "</p>" +
        '<div class="ficha__pie">' +
          '<span class="ficha__signatura">' + (libro.clasificacion || "Sin signatura") + "</span>" +
        "</div>";

      card.addEventListener("click", () => abrirModal(libro.id));
      el.grilla.appendChild(card);
    });

    el.cargarMasBtn.hidden = listaCompleta.length <= estado.visibles;
    el.contadorVisible.textContent = listaCompleta.length
      ? "Mostrando " + lista.length + " de " + listaCompleta.length + " títulos"
      : "";
  }

  function pintarEstrellasInput(valorActivo) {
    [...el.modalEstrellasInput.children].forEach((btn) => {
      const v = Number(btn.dataset.valor);
      btn.classList.toggle("activa", v <= (valorActivo || 0));
    });
  }

  function abrirModal(id) {
    const libro = estado.libros.find((l) => l.id === id);
    if (!libro) return;
    libroActivoId = id;

    el.modalPortada.style.background = libro.color;
    el.modalPortada.textContent = libro.iniciales;
    el.modalGenero.textContent = libro.coleccion;
    el.modalTitulo.textContent = libro.titulo;
    el.modalAutor.textContent = "por " + libro.autor;
    el.modalMeta.textContent = "Signatura: " + (libro.clasificacion || "sin registrar");
    el.modalDisponibilidad.textContent =
      libro.numEjemplares + (libro.numEjemplares === 1 ? " ejemplar registrado" : " ejemplares registrados") +
      " en la colección " + libro.coleccion + ".";

    const actual = estado.fichaLectura[id];
    [...el.modalChips.children].forEach((chip) => {
      chip.setAttribute("aria-pressed", chip.dataset.estado === actual ? "true" : "false");
    });

    pintarEstrellasInput(estado.valoraciones[id]);
    el.modalResenaTexto.value = estado.resenas[id] || "";

    el.modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    el.modalCerrar.focus();
  }

  function cerrarModal() {
    el.modalOverlay.hidden = true;
    document.body.style.overflow = "";
    libroActivoId = null;
  }

  function actualizarContador() {
    el.contador.textContent = String(Object.keys(estado.fichaLectura).length);
  }

  el.modalCerrar.addEventListener("click", cerrarModal);
  el.modalOverlay.addEventListener("click", (e) => {
    if (e.target === el.modalOverlay) cerrarModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.modalOverlay.hidden) cerrarModal();
  });

  el.modalChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip || !libroActivoId) return;
    const codigo = chip.dataset.estado;
    const yaActivo = estado.fichaLectura[libroActivoId] === codigo;

    if (yaActivo) {
      delete estado.fichaLectura[libroActivoId];
    } else {
      estado.fichaLectura[libroActivoId] = codigo;
    }
    [...el.modalChips.children].forEach((c) =>
      c.setAttribute("aria-pressed", !yaActivo && c === chip ? "true" : "false")
    );
    actualizarContador();
    renderizar();
  });

  el.modalEstrellasInput.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || !libroActivoId) return;
    const valor = Number(btn.dataset.valor);
    const yaEraEseValor = estado.valoraciones[libroActivoId] === valor;
    if (yaEraEseValor) {
      delete estado.valoraciones[libroActivoId];
      pintarEstrellasInput(0);
    } else {
      estado.valoraciones[libroActivoId] = valor;
      pintarEstrellasInput(valor);
    }
  });

  let temporizadorResena = null;
  el.modalResenaTexto.addEventListener("input", (e) => {
    const valor = e.target.value;
    const idAlEscribir = libroActivoId;
    clearTimeout(temporizadorResena);
    temporizadorResena = setTimeout(() => {
      if (!idAlEscribir) return;
      if (valor.trim()) {
        estado.resenas[idAlEscribir] = valor;
      } else {
        delete estado.resenas[idAlEscribir];
      }
    }, 250);
  });

  let temporizadorBusqueda = null;
  el.buscador.addEventListener("input", (e) => {
    const valor = e.target.value;
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      estado.busqueda = valor;
      estado.visibles = LOTE;
      renderizar();
    }, 150);
  });

  el.cargarMasBtn.addEventListener("click", () => {
    estado.visibles += LOTE;
    renderizar();
  });

  // ---------- Vista "Mi ficha" ----------

  function mostrarFicha() {
    el.catalogoContenido.hidden = true;
    el.miFichaView.hidden = false;
    renderizarFicha();
    el.miFichaView.scrollIntoView({ behavior: "smooth" });
  }

  function mostrarCatalogo() {
    el.miFichaView.hidden = true;
    el.catalogoContenido.hidden = false;
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  }

  function renderizarFicha() {
    const grupos = [
      { codigo: "leyendo", titulo: "Leyendo ahora" },
      { codigo: "quiero", titulo: "Quiero leerlo" },
      { codigo: "leido", titulo: "Leído" }
    ];

    el.miFichaGrupos.innerHTML = "";

    const idsMarcados = Object.keys(estado.fichaLectura);
    if (idsMarcados.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "estado";
      vacio.textContent = "Todavía no has marcado ningún libro. Abre una ficha del catálogo y elige un estado de lectura.";
      el.miFichaGrupos.appendChild(vacio);
      return;
    }

    grupos.forEach((grupo) => {
      const idsDelGrupo = idsMarcados
        .filter((id) => estado.fichaLectura[id] === grupo.codigo)
        .map(Number);
      if (idsDelGrupo.length === 0) return;

      const bloque = document.createElement("div");
      bloque.className = "miFicha__grupo";

      const encabezado = document.createElement("h3");
      encabezado.textContent = grupo.titulo + " (" + idsDelGrupo.length + ")";
      bloque.appendChild(encabezado);

      const listaEl = document.createElement("div");
      listaEl.className = "miFicha__lista";

      idsDelGrupo.forEach((id) => {
        const libro = estado.libros.find((l) => l.id === id);
        if (!libro) return;

        const valoracion = estado.valoraciones[id];
        const resena = estado.resenas[id];

        const item = document.createElement("button");
        item.type = "button";
        item.className = "miFicha__item";
        item.setAttribute("aria-label", "Ver ficha de " + libro.titulo);
        item.innerHTML =
          '<span class="miFicha__itemPortada" style="background:' + libro.color + '">' + libro.iniciales + "</span>" +
          '<span class="miFicha__itemInfo">' +
            '<span class="miFicha__itemTitulo">' + libro.titulo + "</span>" +
            '<span class="miFicha__itemAutor">' + libro.autor + "</span>" +
            (valoracion ? '<span class="estrellas">' + estrellasTexto(valoracion) + "</span>" : "") +
            (resena ? '<span class="miFicha__itemResena">“' + resena.slice(0, 90) + (resena.length > 90 ? "…" : "") + '”</span>' : "") +
          "</span>";
        item.addEventListener("click", () => abrirModal(id));
        listaEl.appendChild(item);
      });

      bloque.appendChild(listaEl);
      el.miFichaGrupos.appendChild(bloque);
    });
  }

  el.verPendientesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarFicha();
  });

  el.volverCatalogoBtn.addEventListener("click", mostrarCatalogo);

  cargarCatalogo();
})();
