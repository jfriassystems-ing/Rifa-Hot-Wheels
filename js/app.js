/**
 * LÓGICA DE LA LANDING PÚBLICA
 * Galería por secciones de marca + Checkout + Modal de bienvenida + Carrusel
 */

const App = {
  estado: {
    numerosSeleccionados: [],
    numerosOcupados: [],
    archivoComprobante: null,
    totalNumeros: CONFIG.rifa.totalNumeros
  },

  galeria: {
    carritos: [],
    carritosFiltrados: [],
    marcaActual: 'todas',
    busquedaTexto: ''
  },

  el: {},

  async init() {
    this.cachearElementos();
    await this.renderizarBanner();
    await this.renderizarGaleria();
    await this.recargarNumeros();
    this.renderizarDatosBancarios();
    this.attachEventos();
    this.actualizarContador();
    this.mostrarBienvenida();
    console.log('✅ App lista');
  },

  cachearElementos() {
    this.el = {
      gridNumeros: document.getElementById('grid-numeros'),
      contadorNumeros: document.getElementById('contador-numeros'),
      contadorTotal: document.getElementById('contador-total'),
      btnCheckout: document.getElementById('btn-checkout'),
      modal: document.getElementById('modal-checkout'),
      cerrarModal: document.getElementById('cerrar-modal'),
      resumenNumeros: document.getElementById('resumen-numeros'),
      resumenTotal: document.getElementById('resumen-total'),
      formPedido: document.getElementById('form-pedido'),
      nombre: document.getElementById('nombre'),
      telefono: document.getElementById('telefono'),
      datosBancarios: document.getElementById('datos-bancarios'),
      dropzone: document.getElementById('dropzone'),
      dropzoneEmpty: document.getElementById('dropzone-empty'),
      inputComprobante: document.getElementById('comprobante'),
      previewContainer: document.getElementById('preview-container'),
      previewImg: document.getElementById('preview-img'),
      previewName: document.getElementById('preview-name'),
      quitarComprobante: document.getElementById('quitar-comprobante'),
      errorComprobante: document.getElementById('error-comprobante'),
      btnWhatsapp: document.getElementById('btn-whatsapp'),
      modalExito: document.getElementById('modal-exito'),
      codigoPedido: document.getElementById('codigo-pedido'),
      copiarCodigo: document.getElementById('copiar-codigo'),
      cerrarExito: document.getElementById('cerrar-exito'),
      statDisponibles: document.getElementById('stat-disponibles'),
      statTotal: document.getElementById('stat-total'),
      statPrecio: document.getElementById('stat-precio')
    };
  },

  // ==================== GALERÍA POR MARCAS ====================
  async renderizarGaleria() {
    const contenedor = document.getElementById('galeria-secciones');
    const filtros = document.getElementById('galeria-filtros');
    const vacio = document.getElementById('galeria-vacia');
    const buscador = document.getElementById('galeria-buscador');

    if (!contenedor) return;

    const carritos = await Storage.getCarritosDestacados();
    this.galeria.carritos = carritos;
    this.galeria.carritosFiltrados = carritos;

    if (carritos.length === 0) {
      contenedor.innerHTML = '';
      if (filtros) filtros.innerHTML = '';
      if (buscador) buscador.classList.add('hidden');
      if (vacio) vacio.classList.remove('hidden');
      return;
    }

    if (vacio) vacio.classList.add('hidden');
    if (buscador) buscador.classList.remove('hidden');

    const marcas = [...new Set(carritos.map(c => c.marca))].sort();
    if (filtros) {
      filtros.innerHTML = `
        <button data-marca="todas" class="filtro-btn px-4 py-2 rounded-full text-sm font-semibold transition bg-hw-yellow text-hw-dark">
          Todas (${carritos.length})
        </button>
        ${marcas.map(m => {
          const count = carritos.filter(c => c.marca === m).length;
          return `<button data-marca="${Utils.escapeHTML(m)}" class="filtro-btn px-4 py-2 rounded-full text-sm font-semibold transition bg-hw-card border border-hw-border text-gray-300 hover:border-hw-yellow">${Utils.escapeHTML(m)} (${count})</button>`;
        }).join('')}
      `;
      filtros.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => this.filtrarPorMarca(btn.dataset.marca));
      });
    }

    const inputBusqueda = document.getElementById('galeria-busqueda-input');
    if (inputBusqueda && !inputBusqueda.dataset.attached) {
      inputBusqueda.dataset.attached = '1';
      inputBusqueda.addEventListener('input', Utils.debounce((e) => {
        this.galeria.busquedaTexto = e.target.value.trim().toLowerCase();
        this.aplicarFiltrosGaleria();
      }, 250));
    }

    this.renderSecciones(this.galeria.carritosFiltrados);
  },

    // ==================== BANNER DESTACADO ====================
    // ==================== BANNER DESTACADO (CARRUSEL) ====================
  async renderizarBanner() {
    const contenedor = document.getElementById('banner-destacado');
    const grid = document.getElementById('banner-grid');
    if (!contenedor || !grid) return;

    const banners = await Storage.getBanners(true);

    if (banners.length === 0) {
      contenedor.classList.add('hidden');
      return;
    }

    contenedor.classList.remove('hidden');

    // === 1 SOLO BANNER → imagen estática ===
    if (banners.length === 1) {
      const b = banners[0];
      const contenido = `
        <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-hw-border aspect-[16/9] sm:aspect-[21/9]">
          <img src="${Utils.escapeHTML(b.imagen)}" alt="${Utils.escapeHTML(b.titulo || 'Banner')}"
               class="w-full h-full object-cover" loading="lazy" />
          ${(b.titulo || b.subtitulo) ? `
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
              ${b.titulo ? `<h3 class="font-display text-2xl sm:text-4xl text-hw-yellow tracking-wide leading-tight">${Utils.escapeHTML(b.titulo)}</h3>` : ''}
              ${b.subtitulo ? `<p class="text-white text-sm sm:text-base mt-1">${Utils.escapeHTML(b.subtitulo)}</p>` : ''}
            </div>
          ` : ''}
        </div>
      `;
      grid.innerHTML = b.link
        ? `<a href="${Utils.escapeHTML(b.link)}" target="_blank" rel="noopener" class="block">${contenido}</a>`
        : contenido;
      return;
    }

    // === VARIOS BANNERS → carrusel con autoplay ===
    let indiceActual = 0;
    let autoplayActivo = true;
    let autoplayTimer = null;

    grid.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-hw-border aspect-[16/9] sm:aspect-[21/9]">
        <div id="banner-track" class="flex h-full transition-transform duration-700 ease-out"></div>

        <button class="banner-prev absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-hw-yellow hover:text-hw-dark text-white flex items-center justify-center transition z-10 text-2xl leading-none">‹</button>
        <button class="banner-next absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-hw-yellow hover:text-hw-dark text-white flex items-center justify-center transition z-10 text-2xl leading-none">›</button>

        <div class="banner-dots absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"></div>
      </div>
    `;

    const track = document.getElementById('banner-track');
    const dotsContainer = grid.querySelector('.banner-dots');

    // Construir cada slide
    track.innerHTML = banners.map(b => {
      const contenido = `
        <div class="w-full h-full flex-shrink-0 relative">
          <img src="${Utils.escapeHTML(b.imagen)}" alt="${Utils.escapeHTML(b.titulo || 'Banner')}"
               class="w-full h-full object-cover" loading="lazy" />
          ${(b.titulo || b.subtitulo) ? `
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
              ${b.titulo ? `<h3 class="font-display text-2xl sm:text-4xl text-hw-yellow tracking-wide leading-tight">${Utils.escapeHTML(b.titulo)}</h3>` : ''}
              ${b.subtitulo ? `<p class="text-white text-sm sm:text-base mt-1">${Utils.escapeHTML(b.subtitulo)}</p>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      if (b.link) {
        return `<a href="${Utils.escapeHTML(b.link)}" target="_blank" rel="noopener" class="w-full h-full flex-shrink-0 block">${contenido}</a>`;
      }
      return contenido;
    }).join('');

    // Dots
    dotsContainer.innerHTML = banners.map((_, i) => `
      <button data-dot="${i}" class="banner-dot h-2.5 rounded-full transition ${i === 0 ? 'bg-hw-yellow w-8' : 'bg-white/50 w-2.5'}"></button>
    `).join('');

    const actualizar = (nuevoIndice) => {
      indiceActual = (nuevoIndice + banners.length) % banners.length;
      track.style.transform = `translateX(-${indiceActual * 100}%)`;

      dotsContainer.querySelectorAll('.banner-dot').forEach((d, i) => {
        d.className = `banner-dot h-2.5 rounded-full transition ${i === indiceActual ? 'bg-hw-yellow w-8' : 'bg-white/50 w-2.5'}`;
      });
    };

    const iniciarAutoplay = () => {
      detenerAutoplay();
      autoplayTimer = setInterval(() => {
        if (autoplayActivo) actualizar(indiceActual + 1);
      }, 4000);
    };

    const detenerAutoplay = () => {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    };

    // Flechas
    grid.querySelector('.banner-prev').addEventListener('click', () => { actualizar(indiceActual - 1); iniciarAutoplay(); });
    grid.querySelector('.banner-next').addEventListener('click', () => { actualizar(indiceActual + 1); iniciarAutoplay(); });

    // Dots
    dotsContainer.querySelectorAll('.banner-dot').forEach(dot => {
      dot.addEventListener('click', () => { actualizar(Number(dot.dataset.dot)); iniciarAutoplay(); });
    });

    // Pausar al hover (desktop)
    const carruselEl = grid.querySelector('.relative');
    carruselEl.addEventListener('mouseenter', () => { autoplayActivo = false; });
    carruselEl.addEventListener('mouseleave', () => { autoplayActivo = true; });

    // Swipe táctil (móvil)
    let touchStartX = 0;
    let touchDeltaX = 0;

    carruselEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
      autoplayActivo = false;
    }, { passive: true });

    carruselEl.addEventListener('touchmove', (e) => {
      touchDeltaX = e.touches[0].clientX - touchStartX;
    }, { passive: true });

    carruselEl.addEventListener('touchend', () => {
      if (Math.abs(touchDeltaX) > 50) {
        if (touchDeltaX < 0) actualizar(indiceActual + 1);
        else actualizar(indiceActual - 1);
      }
      setTimeout(() => { autoplayActivo = true; }, 500);
    }, { passive: true });

    iniciarAutoplay();
  },


  filtrarPorMarca(marca) {
    this.galeria.marcaActual = marca;

    document.querySelectorAll('.filtro-btn').forEach(btn => {
      if (btn.dataset.marca === marca) {
        btn.className = 'filtro-btn px-4 py-2 rounded-full text-sm font-semibold transition bg-hw-yellow text-hw-dark';
      } else {
        btn.className = 'filtro-btn px-4 py-2 rounded-full text-sm font-semibold transition bg-hw-card border border-hw-border text-gray-300 hover:border-hw-yellow';
      }
    });

    this.aplicarFiltrosGaleria();
  },

  aplicarFiltrosGaleria() {
    const { marcaActual, busquedaTexto, carritos } = this.galeria;

    let filtrados = carritos;

    if (marcaActual !== 'todas') {
      filtrados = filtrados.filter(c => c.marca === marcaActual);
    }

    if (busquedaTexto) {
      filtrados = filtrados.filter(c =>
        (c.nombre || '').toLowerCase().includes(busquedaTexto) ||
        (c.marca || '').toLowerCase().includes(busquedaTexto) ||
        (c.descripcion || '').toLowerCase().includes(busquedaTexto)
      );
    }

    this.galeria.carritosFiltrados = filtrados;
    this.renderSecciones(filtrados);
  },

  renderSecciones(carritos) {
    const contenedor = document.getElementById('galeria-secciones');
    const vacio = document.getElementById('galeria-vacia');
    if (!contenedor) return;

    if (carritos.length === 0) {
      contenedor.innerHTML = '';
      if (vacio) {
        vacio.classList.remove('hidden');
        vacio.innerHTML = `
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-gray-400">No se encontraron carritos con ese criterio.</p>
        `;
      }
      return;
    }

    if (vacio) vacio.classList.add('hidden');

    const porMarca = {};
    carritos.forEach(c => {
      if (!porMarca[c.marca]) porMarca[c.marca] = [];
      porMarca[c.marca].push(c);
    });

    const html = Object.entries(porMarca).map(([marca, items]) => `
      <div class="mb-10 sm:mb-14">
        <div class="flex items-center gap-3 mb-5">
          <span class="text-2xl">🏷️</span>
          <h3 class="font-display text-2xl sm:text-3xl text-hw-yellow tracking-wide">${Utils.escapeHTML(marca)}</h3>
          <span class="text-xs bg-hw-card border border-hw-border text-gray-400 px-2 py-1 rounded-full">${items.length}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          ${items.map(c => this.renderCardCarrito(c)).join('')}
        </div>
      </div>
    `).join('');

    contenedor.innerHTML = html;

    contenedor.querySelectorAll('[data-carrito-id]').forEach(card => {
      card.addEventListener('click', () => this.abrirModalCarrito(card.dataset.carritoId));
    });
  },

  renderCardCarrito(carrito) {
    const fotoPrincipal = carrito.fotos[0] || '';
    return `
      <div data-carrito-id="${carrito.id}" class="group bg-hw-card border border-hw-border rounded-2xl overflow-hidden hover:border-hw-yellow transition cursor-pointer">
        <div class="relative aspect-square bg-hw-dark overflow-hidden">
          <img src="${Utils.escapeHTML(fotoPrincipal)}" alt="${Utils.escapeHTML(carrito.nombre)}"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          ${carrito.fotos.length > 1 ? `
            <div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              📸 ${carrito.fotos.length}
            </div>
          ` : ''}
        </div>
        <div class="p-3">
          <p class="font-bold text-hw-yellow text-sm truncate">${Utils.escapeHTML(carrito.nombre)}</p>
          ${carrito.descripcion ? `<p class="text-xs text-gray-400 truncate-2 mt-1">${Utils.escapeHTML(carrito.descripcion)}</p>` : ''}
        </div>
      </div>
    `;
  },

  // ==================== MODAL CARRITO CON CARRUSEL ====================
  abrirModalCarrito(id) {
    const carrito = this.galeria.carritos.find(c => c.id === id);
    if (!carrito) return;

    const totalFotos = carrito.fotos.length;
    let indiceActual = 0;
    let autoplayActivo = true;
    let autoplayTimer = null;
    let pressTimer = null;
    let isPressing = false;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-fade-in';
    overlay.innerHTML = `
      <div class="max-w-3xl w-full max-h-full overflow-hidden" onclick="event.stopPropagation()">
        <div class="bg-hw-card border border-hw-border rounded-3xl overflow-hidden">
          <div class="p-4 sm:p-6">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="min-w-0 flex-1">
                <span class="inline-block bg-hw-yellow text-hw-dark font-bold text-xs px-3 py-1 rounded-full mb-2">${Utils.escapeHTML(carrito.marca)}</span>
                <h3 class="font-display text-2xl sm:text-3xl text-white tracking-wide">${Utils.escapeHTML(carrito.nombre)}</h3>
                ${carrito.descripcion ? `<p class="text-sm text-gray-400 mt-1">${Utils.escapeHTML(carrito.descripcion)}</p>` : ''}
              </div>
              <button class="text-gray-400 hover:text-hw-red text-3xl leading-none cerrar">&times;</button>
            </div>

            <div class="relative bg-hw-dark rounded-2xl overflow-hidden" style="aspect-ratio: 1 / 1; max-height: 65vh;">
              <div id="carrusel-track" class="flex h-full transition-transform duration-500 ease-out"></div>

              ${totalFotos > 1 ? `
                <button class="carrusel-prev absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-hw-yellow hover:text-hw-dark text-white flex items-center justify-center transition z-10 text-2xl leading-none">‹</button>
                <button class="carrusel-next absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-hw-yellow hover:text-hw-dark text-white flex items-center justify-center transition z-10 text-2xl leading-none">›</button>
                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 carrusel-dots"></div>
                <div class="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10 carrusel-contador">1 / ${totalFotos}</div>
                <div class="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10 carrusel-pausa hidden">⏸ Pausado</div>
              ` : ''}
            </div>

            ${totalFotos > 1 ? `
              <div class="flex gap-2 mt-3 overflow-x-auto pb-2">
                ${carrito.fotos.map((f, i) => `
                  <button data-foto-index="${i}" class="foto-thumb flex-shrink-0 w-16 h-16 rounded-lg border-2 ${i === 0 ? 'border-hw-yellow' : 'border-hw-border'} overflow-hidden bg-hw-dark">
                    <img src="${Utils.escapeHTML(f)}" class="w-full h-full object-cover" />
                  </button>
                `).join('')}
              </div>
              <p class="text-xs text-gray-500 text-center mt-2">💡 Mantén presionada para pausar · Desliza para cambiar</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const track = overlay.querySelector('#carrusel-track');
    const dotsContainer = overlay.querySelector('.carrusel-dots');
    const contador = overlay.querySelector('.carrusel-contador');
    const pausaIndicador = overlay.querySelector('.carrusel-pausa');

    track.innerHTML = carrito.fotos.map(f => `
      <div class="w-full h-full flex-shrink-0">
        <img src="${Utils.escapeHTML(f)}" class="w-full h-full object-cover" draggable="false" />
      </div>
    `).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = carrito.fotos.map((_, i) => `
        <button data-dot="${i}" class="carrusel-dot h-2 rounded-full transition ${i === 0 ? 'bg-hw-yellow w-6' : 'bg-white/40 w-2'}"></button>
      `).join('');
    }

    const actualizarCarrusel = (nuevoIndice) => {
      indiceActual = (nuevoIndice + totalFotos) % totalFotos;
      track.style.transform = `translateX(-${indiceActual * 100}%)`;

      overlay.querySelectorAll('.foto-thumb').forEach((t, i) => {
        t.className = `foto-thumb flex-shrink-0 w-16 h-16 rounded-lg border-2 ${i === indiceActual ? 'border-hw-yellow' : 'border-hw-border'} overflow-hidden bg-hw-dark`;
      });

      if (dotsContainer) {
        dotsContainer.querySelectorAll('.carrusel-dot').forEach((d, i) => {
          d.className = `carrusel-dot h-2 rounded-full transition ${i === indiceActual ? 'bg-hw-yellow w-6' : 'bg-white/40 w-2'}`;
        });
      }

      if (contador) contador.textContent = `${indiceActual + 1} / ${totalFotos}`;
    };

    const iniciarAutoplay = () => {
      if (totalFotos <= 1) return;
      detenerAutoplay();
      autoplayTimer = setInterval(() => {
        if (autoplayActivo && !isPressing) {
          actualizarCarrusel(indiceActual + 1);
        }
      }, 3000);
    };

    const detenerAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const mostrarPausa = (visible) => {
      if (!pausaIndicador) return;
      if (visible) pausaIndicador.classList.remove('hidden');
      else pausaIndicador.classList.add('hidden');
    };

    overlay.querySelector('.carrusel-prev')?.addEventListener('click', () => {
      actualizarCarrusel(indiceActual - 1);
      iniciarAutoplay();
    });
    overlay.querySelector('.carrusel-next')?.addEventListener('click', () => {
      actualizarCarrusel(indiceActual + 1);
      iniciarAutoplay();
    });

    overlay.querySelectorAll('.foto-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        actualizarCarrusel(Number(thumb.dataset.fotoIndex));
        iniciarAutoplay();
      });
    });

    if (dotsContainer) {
      dotsContainer.querySelectorAll('.carrusel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          actualizarCarrusel(Number(dot.dataset.dot));
          iniciarAutoplay();
        });
      });
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;

    const carruselEl = track.parentElement;

    carruselEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDeltaX = 0;
      isPressing = true;

      pressTimer = setTimeout(() => {
        autoplayActivo = false;
        mostrarPausa(true);
      }, 400);
    }, { passive: true });

    carruselEl.addEventListener('touchmove', (e) => {
      touchDeltaX = e.touches[0].clientX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      if (Math.abs(touchDeltaX) > 10 || deltaY > 10) {
        clearTimeout(pressTimer);
      }
    }, { passive: true });

    carruselEl.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
      isPressing = false;
      mostrarPausa(false);

      setTimeout(() => { autoplayActivo = true; }, 500);

      if (Math.abs(touchDeltaX) > 50) {
        if (touchDeltaX < 0) actualizarCarrusel(indiceActual + 1);
        else actualizarCarrusel(indiceActual - 1);
        iniciarAutoplay();
      }
    }, { passive: true });

    carruselEl.addEventListener('mousedown', () => {
      isPressing = true;
      pressTimer = setTimeout(() => {
        autoplayActivo = false;
        mostrarPausa(true);
      }, 400);
    });
    carruselEl.addEventListener('mouseup', () => {
      clearTimeout(pressTimer);
      isPressing = false;
      mostrarPausa(false);
      setTimeout(() => { autoplayActivo = true; }, 500);
    });
    carruselEl.addEventListener('mouseleave', () => {
      clearTimeout(pressTimer);
      isPressing = false;
      mostrarPausa(false);
      autoplayActivo = true;
    });

    carruselEl.addEventListener('mouseenter', () => { autoplayActivo = false; });
    carruselEl.addEventListener('mouseleave', () => { autoplayActivo = true; });

    const cerrar = () => {
      detenerAutoplay();
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') { actualizarCarrusel(indiceActual - 1); iniciarAutoplay(); }
      if (e.key === 'ArrowRight') { actualizarCarrusel(indiceActual + 1); iniciarAutoplay(); }
    };

    overlay.addEventListener('click', cerrar);
    overlay.querySelector('.cerrar').addEventListener('click', cerrar);
    document.addEventListener('keydown', keyHandler);

    iniciarAutoplay();
  },

  // ==================== NÚMEROS ====================
  async recargarNumeros() {
    this.estado.numerosOcupados = await Storage.getNumerosOcupados();
    this.renderizarCuadricula();
    this.actualizarStats();
  },

  renderizarCuadricula() {
    const grid = this.el.gridNumeros;
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 1; i <= this.estado.totalNumeros; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = i;
      btn.dataset.numero = i;
      btn.className = 'num-btn aspect-square rounded-lg font-bold text-sm sm:text-base flex items-center justify-center border-2';

      if (this.estado.numerosOcupados.includes(i)) {
        btn.classList.add('bg-gray-700', 'text-gray-500', 'border-gray-700', 'cursor-not-allowed');
        btn.disabled = true;
      } else if (this.estado.numerosSeleccionados.includes(i)) {
        btn.classList.add('bg-hw-yellow', 'text-hw-dark', 'border-hw-yellow', 'shadow-neon-yellow');
      } else {
        btn.classList.add('bg-green-600', 'text-white', 'border-green-500', 'hover:bg-green-500', 'cursor-pointer');
      }

      btn.addEventListener('click', () => this.toggleNumero(i));
      grid.appendChild(btn);
    }
  },

  toggleNumero(numero) {
    if (this.estado.numerosOcupados.includes(numero)) return;
    const index = this.estado.numerosSeleccionados.indexOf(numero);
    if (index === -1) this.estado.numerosSeleccionados.push(numero);
    else this.estado.numerosSeleccionados.splice(index, 1);
    this.renderizarCuadricula();
    this.actualizarContador();
  },

  actualizarContador() {
    const cantidad = this.estado.numerosSeleccionados.length;
    const total = cantidad * CONFIG.rifa.precioPorNumero;

    this.el.contadorNumeros.textContent = cantidad;
    this.el.contadorTotal.textContent = Utils.formatoMoneda(total);

    if (cantidad > 0) {
      this.el.btnCheckout.disabled = false;
      this.el.btnCheckout.classList.remove('bg-gray-700');
      this.el.btnCheckout.classList.add('bg-hw-red', 'hover:bg-red-700');
    } else {
      this.el.btnCheckout.disabled = true;
      this.el.btnCheckout.classList.add('bg-gray-700');
      this.el.btnCheckout.classList.remove('bg-hw-red', 'hover:bg-red-700');
    }
  },

  async actualizarStats() {
    const stats = await Storage.getEstadisticas();
    if (this.el.statDisponibles) this.el.statDisponibles.textContent = stats.numerosDisponibles;
    if (this.el.statTotal) this.el.statTotal.textContent = stats.totalNumeros;
    if (this.el.statPrecio) this.el.statPrecio.textContent = `$${CONFIG.rifa.precioPorNumero}`;
  },

  // ==================== DATOS BANCARIOS ====================
  renderizarDatosBancarios() {
    if (!this.el.datosBancarios) return;
    this.el.datosBancarios.innerHTML = CONFIG.cuentasBancarias.map(c => `
      <div class="bg-hw-dark border border-hw-border rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-hw-yellow text-sm">${Utils.escapeHTML(c.banco)}</span>
          <span class="text-xs ${c.colorBadge} text-white px-2 py-0.5 rounded-full">${Utils.escapeHTML(c.etiquetaCorta)}</span>
        </div>
        <p class="text-xs text-gray-300">Titular: <span class="text-white">${Utils.escapeHTML(c.titular)}</span></p>
        ${c.cedula ? `<p class="text-xs text-gray-300">Cédula: <span class="text-white font-mono">${Utils.escapeHTML(c.cedula)}</span></p>` : ''}
        <p class="text-xs text-gray-300">${Utils.escapeHTML(c.tipo)}: <span class="text-white font-mono">${Utils.escapeHTML(c.numero)}</span></p>
        <button type="button" data-copy="${Utils.escapeHTML(c.numeroCopiar)}" class="copiar-btn mt-2 text-xs bg-hw-yellow text-hw-dark font-bold px-3 py-1 rounded-full hover:bg-yellow-400 transition">
          📋 Copiar cuenta
        </button>
      </div>
    `).join('');

    this.el.datosBancarios.querySelectorAll('.copiar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await Utils.copiarAlPortapapeles(btn.dataset.copy);
        if (ok) {
          const orig = btn.textContent;
          btn.textContent = '✅ ¡Copiado!';
          setTimeout(() => btn.textContent = orig, 2000);
        }
      });
    });
  },

  // ==================== EVENTOS ====================
  attachEventos() {
    this.el.btnCheckout.addEventListener('click', () => this.abrirModal());
    this.el.cerrarModal.addEventListener('click', () => this.cerrarModalFn());
    this.el.modal.addEventListener('click', (e) => {
      if (e.target === this.el.modal) this.cerrarModalFn();
    });

    this.el.cerrarExito.addEventListener('click', () => {
      this.el.modalExito.classList.add('hidden');
      this.el.modalExito.classList.remove('flex');
      document.body.classList.remove('modal-abierto');
    });

    this.el.copiarCodigo.addEventListener('click', async () => {
      const ok = await Utils.copiarAlPortapapeles(this.el.codigoPedido.textContent);
      if (ok) {
        const orig = this.el.copiarCodigo.textContent;
        this.el.copiarCodigo.textContent = '✅ ¡Copiado!';
        setTimeout(() => this.el.copiarCodigo.textContent = orig, 2000);
      }
    });

    this.el.inputComprobante.addEventListener('change', (e) => this.manejarComprobante(e.target.files[0]));
    this.el.quitarComprobante.addEventListener('click', (e) => { e.preventDefault(); this.limpiarComprobante(); });

    ['dragenter', 'dragover'].forEach(ev => {
      this.el.dropzone.addEventListener(ev, (e) => { e.preventDefault(); this.el.dropzone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(ev => {
      this.el.dropzone.addEventListener(ev, (e) => { e.preventDefault(); this.el.dropzone.classList.remove('dragover'); });
    });
    this.el.dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) this.manejarComprobante(file);
    });

    this.el.btnWhatsapp.addEventListener('click', () => this.enviarPedido());
  },

  abrirModal() {
    if (this.estado.numerosSeleccionados.length === 0) return;
    const ordenados = Utils.ordenarNumeros(this.estado.numerosSeleccionados);
    const total = ordenados.length * CONFIG.rifa.precioPorNumero;

    this.el.resumenNumeros.innerHTML = ordenados.map(n =>
      `<span class="bg-hw-yellow text-hw-dark font-bold text-sm px-3 py-1 rounded-full">#${n}</span>`
    ).join('');
    this.el.resumenTotal.textContent = Utils.formatoMoneda(total);

    this.el.modal.classList.remove('hidden');
    this.el.modal.classList.add('flex');
    document.body.classList.add('modal-abierto');
  },

  cerrarModalFn() {
    this.el.modal.classList.add('hidden');
    this.el.modal.classList.remove('flex');
    document.body.classList.remove('modal-abierto');
  },

  async manejarComprobante(file) {
    const v = Utils.esImagenValida(file);
    if (!v.valido) { alert(v.error); this.limpiarComprobante(); return; }

    this.estado.archivoComprobante = file;
    const dataURL = await Utils.archivoADataURL(file);
    this.el.previewImg.src = dataURL;
    this.el.previewName.textContent = file.name;
    this.el.previewContainer.classList.remove('hidden');
    this.el.dropzoneEmpty.classList.add('hidden');
    this.el.dropzone.classList.add('border-hw-yellow');
    this.el.errorComprobante.classList.add('hidden');
  },

  limpiarComprobante() {
    this.estado.archivoComprobante = null;
    this.el.inputComprobante.value = '';
    this.el.previewImg.src = '';
    this.el.previewName.textContent = '';
    this.el.previewContainer.classList.add('hidden');
    this.el.dropzoneEmpty.classList.remove('hidden');
    this.el.dropzone.classList.remove('border-hw-yellow');
  },

  async enviarPedido() {
    const nombre = this.el.nombre.value.trim();
    const telefono = this.el.telefono.value.trim();

    if (!nombre) { alert('Ingresa tu nombre.'); this.el.nombre.focus(); return; }
    if (!Utils.esTelefonoValido(telefono)) { alert('Teléfono inválido (10 dígitos).'); this.el.telefono.focus(); return; }
    if (this.estado.numerosSeleccionados.length === 0) { alert('No has seleccionado ningún número.'); return; }
    if (!this.estado.archivoComprobante) {
      this.el.errorComprobante.classList.remove('hidden');
      this.el.dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const ocupados = await Storage.getNumerosOcupados();
    const conflicto = this.estado.numerosSeleccionados.filter(n => ocupados.includes(n));
    if (conflicto.length > 0) {
      alert(`Estos números ya fueron vendidos: ${conflicto.join(', ')}. Recarga la página.`);
      return;
    }

    const textoOrig = this.el.btnWhatsapp.innerHTML;
    this.el.btnWhatsapp.disabled = true;
    this.el.btnWhatsapp.innerHTML = `<div class="spinner"></div><span class="ml-2">Subiendo comprobante...</span>`;

    try {
      const urlComprobante = await Storage.subirImagenCloudinary(
        this.estado.archivoComprobante, 'comprobantes'
      );

      const ordenados = Utils.ordenarNumeros(this.estado.numerosSeleccionados);
      const total = ordenados.length * CONFIG.rifa.precioPorNumero;

      const pedido = await Storage.guardarPedido({
        nombre,
        telefono: Utils.limpiarTelefono(telefono),
        numeros: ordenados,
        total,
        comprobante: urlComprobante,
        estado: CONFIG.estadosPedido.PENDIENTE
      });

      const mensaje = [
        CONFIG.textos.mensajeWhatsappPedido,
        ``,
        `👤 *Nombre:* ${pedido.nombre}`,
        `📱 *Teléfono:* ${Utils.formatearTelefono(pedido.telefono)}`,
        ``,
        `🎯 *Números:*`,
        pedido.numeros.map(n => `   • #${n}`).join('\n'),
        ``,
        `🔢 *Cantidad:* ${pedido.numeros.length}`,
        `💰 *Total:* ${Utils.formatoMoneda(pedido.total)}`,
        ``,
        `🆔 *Código:* ${pedido.id}`,
        ``,
        `📸 *Comprobante:* ${pedido.comprobante}`,
        ``,
        `✅ ¡Gracias! Recuerda: el sorteo se realiza al venderse los 100 números.`
      ].join('\n');

      window.open(`https://wa.me/${CONFIG.contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');

      this.cerrarModalFn();
      this.el.codigoPedido.textContent = pedido.id;
      this.el.modalExito.classList.remove('hidden');
      this.el.modalExito.classList.add('flex');

      this.estado.numerosSeleccionados = [];
      this.limpiarComprobante();
      this.el.formPedido.reset();
      await this.recargarNumeros();
      this.actualizarContador();

    } catch (err) {
      console.error(err);
      alert('⚠️ Error al procesar el pedido: ' + (err.message || 'Intenta de nuevo.'));
    } finally {
      this.el.btnWhatsapp.disabled = false;
      this.el.btnWhatsapp.innerHTML = textoOrig;
    }
  },

  // ==================== MODAL DE BIENVENIDA ====================
  mostrarBienvenida() {
    const KEY = 'hw_bienvenida_vista';
    const ULTIMA_VEZ = localStorage.getItem(KEY);
    const AHORA = Date.now();
    const UN_DIA = 24 * 60 * 60 * 1000;

    if (ULTIMA_VEZ && (AHORA - Number(ULTIMA_VEZ)) < UN_DIA) return;

    const modal = document.getElementById('modal-bienvenida');
    if (!modal) { console.warn('⚠️ Modal de bienvenida no encontrado'); return; }

    setTimeout(() => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('modal-abierto');
    }, 1000);

    const btnParticipar = document.getElementById('btn-bienvenida-participar');
    if (btnParticipar) {
      btnParticipar.addEventListener('click', () => {
        this.cerrarBienvenida();
        setTimeout(() => {
          document.getElementById('numeros')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      });
    }

    const btnCerrar = document.getElementById('btn-bienvenida-cerrar');
    if (btnCerrar) {
      btnCerrar.addEventListener('click', () => {
        this.cerrarBienvenida();
        setTimeout(() => {
          document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.cerrarBienvenida();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        this.cerrarBienvenida();
      }
    });
  },

  cerrarBienvenida() {
    const modal = document.getElementById('modal-bienvenida');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('modal-abierto');
    localStorage.setItem('hw_bienvenida_vista', Date.now().toString());
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());