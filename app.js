(function () {
  "use strict";

  const estado = {
    libros: [],
    generos: [],
    generoActivo: "Todos",
    busqueda: "",
    fichaLectura: {} // { [id]: "quiero" | "leyendo" | "leido" }  — solo dura esta sesión
  };

  const el = {
    grilla: document.getElementById("grilla"),
    carga: document.getElementById("estadoCarga"),
    sinResultados: document.getElementById("sinResultados"),
    buscador: document.getElementById("buscador"),
    filtros: document.getElementById("filtrosGenero"),
    contador: document.getElementById("contadorFicha"),
    fichaNumero: document.getElementById("fichaNumero"),
    modalOverlay: document.getElementById("modalOverlay"),
    modalCerrar: document.getElementById("modalCerrar"),
    modalPortada: document.getElementById("modalPortada"),
    modalGenero: document.getElementById("modalGenero"),
    modalTitulo: document.getElementById("modalTitulo"),
    modalAutor: document.getElementById("modalAutor"),
    modalMeta: document.getElementById("modalMeta"),
    modalSinopsis: document.getElementById("modalSinopsis"),
    modalEstrellas: document.getElementById("modalEstrellas"),
    modalNota: document.getElementById("modalNota"),
    modalDisponibilidad: document.getElementById("modalDisponibilidad"),
    modalChips: document.getElementById("modalChips"),
    verPendientesBtn: document.getElementById("verPendientesBtn")
  };

  let libroActivoId = null;

  function estrellas(valor) {
    const llenas = Math.round(valor);
    return "★".repeat(llenas) + "☆".repeat(5 - llenas);
  }

  function iniciales(nombre) {
    return nombre;
  }

  function cargarCatalogo() {
    fetch("libros.json")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo leer libros.json");
        return res.json();
      })
      .then((datos) => {
        estado.libros = datos.libros || [];
        estado.generos = datos.generos || [];
        el.fichaNumero.textContent = String(Math.floor(1000 + Math.random() * 8999)).padStart(6, "0");
        construirFiltros();
        renderizar();
        el.carga.hidden = true;
        el.grilla.hidden = false;
      })
      .catch((err) => {
        el.carga.textContent = "No se pudo cargar el catálogo (" + err.message + "). Revisa que libros.json esté junto a este archivo.";
      });
  }

  function construirFiltros() {
    const nombres = ["Todos", ...estado.generos];
    el.filtros.innerHTML = "";
    nombres.forEach((genero) => {
      const btn = document.createElement("button");
      btn.className = "filtro-btn";
      btn.type = "button";
      btn.textContent = genero;
      btn.setAttribute("aria-pressed", genero === estado.generoActivo ? "true" : "false");
      btn.addEventListener("click", () => {
        estado.generoActivo = genero;
        [...el.filtros.children].forEach((b) =>
          b.setAttribute("aria-pressed", b.textContent === genero ? "true" : "false")
        );
        renderizar();
      });
      el.filtros.appendChild(btn);
    });
  }

  function librosFiltrados() {
    const texto = estado.busqueda.trim().toLowerCase();
    return estado.libros.filter((libro) => {
      const coincideGenero = estado.generoActivo === "Todos" || libro.genero === estado.generoActivo;
      const coincideTexto =
        !texto ||
        libro.titulo.toLowerCase().includes(texto) ||
        libro.autor.toLowerCase().includes(texto);
      return coincideGenero && coincideTexto;
    });
  }

  function etiquetaEstado(codigo) {
    return { quiero: "Por leer", leyendo: "Leyendo", leido: "Leído" }[codigo] || "";
  }

  function renderizar() {
    const lista = librosFiltrados();
    el.grilla.innerHTML = "";
    el.sinResultados.hidden = lista.length !== 0;
    el.grilla.hidden = lista.length === 0;

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
          iniciales(libro.iniciales) + etiquetaHtml +
        "</div>" +
        '<p class="ficha__genero">' + libro.genero + " · " + libro.anio + "</p>" +
        '<h3 class="ficha__titulo">' + libro.titulo + "</h3>" +
        '<p class="ficha__autor">' + libro.autor + "</p>" +
        '<div class="ficha__pie">' +
          '<span class="estrellas">' + estrellas(libro.valoracion) + "</span>" +
          '<span class="ficha__disp ' + (libro.disponible ? "si" : "no") + '">' +
            (libro.disponible ? "Disponible" : "Prestado") +
          "</span>" +
        "</div>";

      card.addEventListener("click", () => abrirModal(libro.id));
      el.grilla.appendChild(card);
    });
  }

  function abrirModal(id) {
    const libro = estado.libros.find((l) => l.id === id);
    if (!libro) return;
    libroActivoId = id;

    el.modalPortada.style.background = libro.color;
    el.modalPortada.textContent = libro.iniciales;
    el.modalGenero.textContent = libro.genero;
    el.modalTitulo.textContent = libro.titulo;
    el.modalAutor.textContent = "por " + libro.autor;
    el.modalMeta.textContent = libro.anio + " · " + libro.paginas + " páginas";
    el.modalSinopsis.textContent = libro.sinopsis;
    el.modalEstrellas.textContent = estrellas(libro.valoracion);
    el.modalNota.textContent = libro.valoracion.toFixed(1) + " / 5";
    el.modalDisponibilidad.textContent = libro.disponible
      ? "Disponible ahora en " + libro.sucursal
      : "Actualmente prestado — consulta reserva en " + libro.sucursal;

    const actual = estado.fichaLectura[id];
    [...el.modalChips.children].forEach((chip) => {
      chip.setAttribute("aria-pressed", chip.dataset.estado === actual ? "true" : "false");
    });

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

  el.buscador.addEventListener("input", (e) => {
    estado.busqueda = e.target.value;
    renderizar();
  });

  el.verPendientesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    el.buscador.focus();
  });

  cargarCatalogo();
})();
