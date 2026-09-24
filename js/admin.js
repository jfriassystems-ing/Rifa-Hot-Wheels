/**
 * LÓGICA DEL PANEL DE ADMINISTRACIÓN
 */

const Admin = {
  seccionActual: 'dashboard',
  pedidosFiltrados: [],
  carritoEnEdicion: null,
  fotosNuevas: [],   // array de {file, preview, esNueva}
  fotosExistentes: [], // URLs ya subidas
  confirmCallback: null,

  el: {},

  async init() {
    this.cachearElementos();
    this.attachEventosLogin();

    const autenticado = await Storage.adminEstaAutenticado();
    if (autenticado) await this.mostrarApp();
    else this.mostrarLogin();
  },

  cachearElementos() {
    this.el = {
      loginScreen: document.getElementById('login-screen'),
      loginForm: document.getElementById('login-form'),
      loginEmail: document.getElementById('login-email'),
      loginPassword: document.getElementById('login-password'),
      loginError: document.getElementById('login-error'),

      adminApp: document.getElementById('admin-app'),

      sidebar: document.getElementById('sidebar'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
      btnMenuMobile: document.getElementById('btn-menu-mobile'),
      btnLogout: document.getElementById('btn-logout'),

      statPedidos: document.getElementById('stat-pedidos'),
      statConfirmados: document.getElementById('stat-confirmados'),
      statPendientes: document.getElementById('stat-pendientes'),
      statRechazados: document.getElementById('stat-rechazados'),
      statNumerosVendidos: document.getElementById('stat-numeros-vendidos'),
      statPorcentaje: document.getElementById('stat-porcentaje'),
      statRecaudado: document.getElementById('stat-recaudado'),
      statPotencial: document.getElementById('stat-potencial'),
      barraProgreso: document.getElementById('barra-progreso'),
      ultimosPedidos: document.getElementById('ultimos-pedidos'),

      busquedaPedidos: document.getElementById('busqueda-pedidos'),
      filtroEstado: document.getElementById('filtro-estado'),
      filtroNumero: document.getElementById('filtro-numero'),
      btnLimpiarFiltros: document.getElementById('btn-limpiar-filtros'),
      contadorPedidos: document.getElementById('contador-pedidos'),
      listaPedidos: document.getElementById('lista-pedidos'),
      btnExportarCSV: document.getElementById('btn-exportar-csv'),

      gridNumerosAdmin: document.getElementById('grid-numeros-admin'),

      listaCarritos: document.getElementById('lista-carritos'),
      btnNuevoCarrito: document.getElementById('btn-nuevo-carrito'),

      formNuevaCategoria: document.getElementById('form-nueva-categoria'),
      inputNuevaCategoria: document.getElementById('input-nueva-categoria'),
      errorNuevaCategoria: document.getElementById('error-nueva-categoria'),
      listaCategorias: document.getElementById('lista-categorias'),

      modalPedido: document.getElementById('modal-pedido'),
      cerrarModalPedido: document.getElementById('cerrar-modal-pedido'),
      contenidoPedido: document.getElementById('contenido-pedido'),

      modalCarrito: document.getElementById('modal-carrito'),
      cerrarModalCarrito: document.getElementById('cerrar-modal-carrito'),
      tituloModalCarrito: document.getElementById('titulo-modal-carrito'),
      formCarrito: document.getElementById('form-carrito'),
      inputCarritoMarca: document.getElementById('input-carrito-marca'),
      inputCarritoNombre: document.getElementById('input-carrito-nombre'),
      inputCarritoDescripcion: document.getElementById('input-carrito-descripcion'),
      inputCarritoDestacado: document.getElementById('input-carrito-destacado'),
      fotosGrid: document.getElementById('fotos-grid'),
      contadorFotosModal: document.getElementById('contador-fotos-modal'),
      errorModalCarrito: document.getElementById('error-modal-carrito'),
      btnGuardarCarrito: document.getElementById('btn-guardar-carrito'),
      cancelarModalCarrito: document.getElementById('cancelar-modal-carrito'),

      modalConfirm: document.getElementById('modal-confirm'),
      confirmTitulo: document.getElementById('confirm-titulo'),
      confirmMensaje: document.getElementById('confirm-mensaje'),
      confirmCancelar: document.getElementById('confirm-cancelar'),
      confirmAceptar: document.getElementById('confirm-aceptar'),

      toastContainer: document.getElementById('toast-container')
    };
  },

  // ==================== LOGIN ====================
  attachEventosLogin() {
    this.el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.el.loginEmail.value.trim();
      const password = this.el.loginPassword.value;
      this.el.loginError.classList.add('hidden');

      const res = await Storage.adminLogin(email, password);
      if (res.ok) await this.mostrarApp();
      else {
        this.el.loginError.textContent = res.error;
        this.el.loginError.classList.remove('hidden');
        this.el.loginPassword.value = '';
      }
    });
  },

  mostrarLogin() {
    this.el.loginScreen.classList.remove('hidden');
    this.el.adminApp.classList.add('hidden');
  },

  async mostrarApp() {
    this.el.loginScreen.classList.add('hidden');
    this.el.adminApp.classList.remove('hidden');
    this.attachEventosApp();
    await this.irASeccion('dashboard');
  },

  attachEventosApp() {
    if (this.el.adminApp.dataset.attached === '1') return;
    this.el.adminApp.dataset.attached = '1';

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.irASeccion(btn.dataset.seccion));
    });

    this.el.btnLogout.addEventListener('click', () => {
      this.confirmar('Cerrar sesión', '¿Quieres cerrar la sesión?', async () => {
        await Storage.adminLogout();
        location.reload();
      });
    });

    this.el.btnMenuMobile.addEventListener('click', () => this.toggleSidebar(true));
    this.el.sidebarOverlay.addEventListener('click', () => this.toggleSidebar(false));

    this.el.busquedaPedidos.addEventListener('input', Utils.debounce(() => this.aplicarFiltros(), 250));
    this.el.filtroEstado.addEventListener('change', () => this.aplicarFiltros());
    this.el.filtroNumero.addEventListener('input', Utils.debounce(() => this.aplicarFiltros(), 250));
    this.el.btnLimpiarFiltros.addEventListener('click', () => {
      this.el.busquedaPedidos.value = '';
      this.el.filtroEstado.value = 'todos';
      this.el.filtroNumero.value = '';
      this.aplicarFiltros();
    });

    this.el.btnExportarCSV.addEventListener('click', () => this.exportarCSV());

    this.el.cerrarModalPedido.addEventListener('click', () => this.cerrarModalPedido());
    this.el.modalPedido.addEventListener('click', (e) => {
      if (e.target === this.el.modalPedido) this.cerrarModalPedido();
    });

    this.el.btnNuevoCarrito.addEventListener('click', () => this.abrirModalCarrito());
    this.el.cerrarModalCarrito.addEventListener('click', () => this.cerrarModalCarritoFn());
    this.el.modalCarrito.addEventListener('click', (e) => {
      if (e.target === this.el.modalCarrito) this.cerrarModalCarritoFn();
    });
    this.el.cancelarModalCarrito.addEventListener('click', () => this.cerrarModalCarritoFn());
    this.el.formCarrito.addEventListener('submit', (e) => this.guardarCarrito(e));

    this.el.formNuevaCategoria.addEventListener('submit', (e) => this.agregarCategoria(e));

    this.el.confirmCancelar.addEventListener('click', () => this.cerrarConfirm());
    this.el.confirmAceptar.addEventListener('click', () => {
      if (this.confirmCallback) this.confirmCallback();
      this.cerrarConfirm();
    });
    this.el.modalConfirm.addEventListener('click', (e) => {
      if (e.target === this.el.modalConfirm) this.cerrarConfirm();
    });
  },

  toggleSidebar(abrir) {
    if (abrir) {
      this.el.sidebar.classList.remove('-translate-x-full');
      this.el.sidebarOverlay.classList.remove('hidden');
    } else {
      this.el.sidebar.classList.add('-translate-x-full');
      this.el.sidebarOverlay.classList.add('hidden');
    }
  },

  async irASeccion(seccion) {
    this.seccionActual = seccion;
    document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`seccion-${seccion}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.seccion === seccion) {
        btn.className = 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition bg-hw-yellow text-hw-dark';
      } else {
        btn.className = 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition text-gray-300 hover:bg-admin-bg hover:text-hw-yellow';
      }
    });

    this.toggleSidebar(false);

    if (seccion === 'dashboard') await this.renderDashboard();
    if (seccion === 'pedidos') await this.renderPedidos();
    if (seccion === 'numeros') await this.renderNumerosAdmin();
    if (seccion === 'carritos') await this.renderCarritos();
    if (seccion === 'categorias') await this.renderCategorias();
  },

  // ==================== DASHBOARD ====================
  async renderDashboard() {
    const stats = await Storage.getEstadisticas();
    this.el.statPedidos.textContent = stats.totalPedidos;
    this.el.statConfirmados.textContent = stats.confirmados;
    this.el.statPendientes.textContent = stats.pendientes;
    this.el.statRechazados.textContent = stats.rechazados;
    this.el.statNumerosVendidos.textContent = `${stats.numerosVendidos} / ${stats.totalNumeros}`;
    this.el.statPorcentaje.textContent = `${stats.porcentajeVendido}% vendido`;
    this.el.statRecaudado.textContent = Utils.formatoMoneda(stats.totalRecaudado);
    this.el.statPotencial.textContent = Utils.formatoMoneda(stats.totalPotencial);
    this.el.barraProgreso.style.width = `${stats.porcentajeVendido}%`;

    const pedidos = await Storage.getPedidos();
    const ultimos = pedidos.slice(0, 5);
    if (ultimos.length === 0) {
      this.el.ultimosPedidos.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">No hay pedidos aún.</p>`;
      return;
    }
    this.el.ultimosPedidos.innerHTML = ultimos.map(p => `
      <div class="flex items-center justify-between gap-3 bg-admin-bg rounded-xl p-3 cursor-pointer hover:bg-admin-border transition" onclick="Admin.abrirModalPedido('${p.id}')">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-white truncate">${Utils.escapeHTML(p.nombre)}</p>
          <p class="text-xs text-gray-500 truncate">${Utils.escapeHTML(p.id)} · ${p.numeros.length} núm. · ${Utils.formatoMoneda(p.total)}</p>
        </div>
        <span class="text-xs px-2 py-1 rounded-full border ${Utils.claseEstado(p.estado)} whitespace-nowrap">${Utils.emojiEstado(p.estado)}</span>
      </div>
    `).join('');
  },

  // ==================== PEDIDOS ====================
  async renderPedidos() { this.aplicarFiltros(); },

  async aplicarFiltros() {
    const busqueda = this.el.busquedaPedidos.value.trim().toLowerCase();
    const estado = this.el.filtroEstado.value;
    const numBusq = this.el.filtroNumero.value.trim().replace('#', '');
    let pedidos = await Storage.getPedidos();

    if (busqueda) pedidos = pedidos.filter(p =>
      p.nombre.toLowerCase().includes(busqueda) ||
      p.telefono.toLowerCase().includes(busqueda) ||
      p.id.toLowerCase().includes(busqueda)
    );
    if (estado !== 'todos') pedidos = pedidos.filter(p => p.estado === estado);
    if (numBusq) {
      const num = Number(numBusq);
      if (!isNaN(num)) pedidos = pedidos.filter(p => (p.numeros || []).includes(num));
    }

    this.pedidosFiltrados = pedidos;
    this.renderListaPedidos(pedidos);
  },

  renderListaPedidos(pedidos) {
    this.el.contadorPedidos.textContent = `${pedidos.length} pedido(s)`;
    if (pedidos.length === 0) {
      this.el.listaPedidos.innerHTML = `<div class="bg-admin-card border border-admin-border rounded-2xl p-8 text-center"><p class="text-gray-500">No hay pedidos.</p></div>`;
      return;
    }
    this.el.listaPedidos.innerHTML = pedidos.map(p => `
      <div class="bg-admin-card border border-admin-border rounded-2xl p-4 cursor-pointer hover:border-hw-yellow transition" onclick="Admin.abrirModalPedido('${p.id}')">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-white truncate">${Utils.escapeHTML(p.nombre)}</p>
            <p class="text-xs text-gray-500 font-mono">${Utils.escapeHTML(p.id)} · ${Utils.formatoFecha(p.fecha)}</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full border ${Utils.claseEstado(p.estado)} whitespace-nowrap">
            ${Utils.emojiEstado(p.estado)} ${Utils.textoEstado(p.estado)}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${(p.numeros || []).slice(0, 8).map(n => `<span class="text-xs bg-admin-bg border border-admin-border text-white font-bold px-2 py-0.5 rounded">#${n}</span>`).join('')}
          ${p.numeros.length > 8 ? `<span class="text-xs text-gray-500 self-center">+${p.numeros.length - 8}</span>` : ''}
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400 text-xs">${p.numeros.length} número(s)</span>
          <span class="font-bold text-hw-red">${Utils.formatoMoneda(p.total)}</span>
        </div>
      </div>
    `).join('');
  },

  async abrirModalPedido(id) {
    const pedido = await Storage.getPedidoPorId(id);
    if (!pedido) return;

    const numerosHTML = pedido.numeros.map(n =>
      `<span class="bg-admin-bg border border-admin-border text-white font-bold text-sm px-3 py-1 rounded-full">#${n}</span>`
    ).join('');

    const comprobanteHTML = pedido.comprobante ? `
      <div class="mt-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">Comprobante</p>
        <a href="${Utils.escapeHTML(pedido.comprobante)}" target="_blank" rel="noopener">
          <img src="${Utils.escapeHTML(pedido.comprobante)}" alt="Comprobante" class="w-full max-h-64 object-contain bg-admin-bg rounded-xl border border-admin-border hover:border-hw-yellow transition" />
        </a>
      </div>
    ` : '';

    this.el.contenidoPedido.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <span class="text-xs px-3 py-1 rounded-full border ${Utils.claseEstado(pedido.estado)}">${Utils.emojiEstado(pedido.estado)} ${Utils.textoEstado(pedido.estado)}</span>
          <span class="text-xs text-gray-500 font-mono">${Utils.escapeHTML(pedido.id)}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-admin-bg border border-admin-border rounded-xl p-3">
            <p class="text-xs text-gray-500 uppercase mb-1">Nombre</p>
            <p class="font-semibold text-white text-sm">${Utils.escapeHTML(pedido.nombre)}</p>
          </div>
          <div class="bg-admin-bg border border-admin-border rounded-xl p-3">
            <p class="text-xs text-gray-500 uppercase mb-1">Teléfono</p>
            <a href="https://wa.me/1${Utils.limpiarTelefono(pedido.telefono)}" target="_blank" rel="noopener" class="font-semibold text-green-400 hover:underline text-sm">
              📱 ${Utils.formatearTelefono(pedido.telefono)}
            </a>
          </div>
        </div>
        <div class="bg-admin-bg border border-admin-border rounded-xl p-3">
          <p class="text-xs text-gray-500 uppercase mb-2">Números (${pedido.numeros.length})</p>
          <div class="flex flex-wrap gap-2">${numerosHTML}</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-admin-bg border border-admin-border rounded-xl p-3">
            <p class="text-xs text-gray-500 uppercase mb-1">Total</p>
            <p class="font-bold text-hw-red text-lg">${Utils.formatoMoneda(pedido.total)}</p>
          </div>
          <div class="bg-admin-bg border border-admin-border rounded-xl p-3">
            <p class="text-xs text-gray-500 uppercase mb-1">Fecha</p>
            <p class="text-white text-sm">${Utils.formatoFecha(pedido.fecha)}</p>
          </div>
        </div>
        ${comprobanteHTML}
        <div>
          <label class="text-xs text-gray-500 uppercase block mb-2">Notas internas</label>
          <textarea id="notas-pedido" rows="2" class="w-full bg-admin-bg border border-admin-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-hw-yellow transition" placeholder="Ej: Pagó en efectivo...">${Utils.escapeHTML(pedido.notas || '')}</textarea>
        </div>
        <div class="pt-4 border-t border-admin-border space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onclick="Admin.cambiarEstado('${pedido.id}', 'confirmado')" class="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm" ${pedido.estado === 'confirmado' ? 'disabled' : ''}>✅ Confirmar</button>
            <button onclick="Admin.cambiarEstado('${pedido.id}', 'pendiente')" class="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm" ${pedido.estado === 'pendiente' ? 'disabled' : ''}>⏳ Pendiente</button>
            <button onclick="Admin.cambiarEstado('${pedido.id}', 'rechazado')" class="bg-hw-red hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm" ${pedido.estado === 'rechazado' ? 'disabled' : ''}>❌ Rechazar</button>
          </div>
          <button onclick="Admin.eliminarPedido('${pedido.id}')" class="w-full bg-transparent border border-hw-red/40 hover:bg-hw-red/10 text-hw-red font-bold py-3 rounded-xl transition text-sm">
            🗑️ Eliminar pedido
          </button>
        </div>
      </div>
    `;

    this.el.modalPedido.classList.remove('hidden');
    this.el.modalPedido.classList.add('flex');
    document.body.classList.add('modal-abierto');
  },

  cerrarModalPedido() {
    this.el.modalPedido.classList.add('hidden');
    this.el.modalPedido.classList.remove('flex');
    document.body.classList.remove('modal-abierto');
  },

  async cambiarEstado(id, nuevoEstado) {
    const notas = document.getElementById('notas-pedido');
    const cambios = { estado: nuevoEstado };
    if (notas) cambios.notas = notas.value.trim();
    await Storage.actualizarPedido(id, cambios);
    this.toast(`Pedido → ${Utils.textoEstado(nuevoEstado)}`, 'success');
    this.cerrarModalPedido();
    await this.irASeccion(this.seccionActual);
  },

  eliminarPedido(id) {
    this.confirmar('Eliminar pedido', `¿Eliminar el pedido ${id}?`, async () => {
      await Storage.eliminarPedido(id);
      this.toast('Pedido eliminado', 'info');
      this.cerrarModalPedido();
      await this.irASeccion(this.seccionActual);
    });
  },

  // ==================== NÚMEROS ====================
  async renderNumerosAdmin() {
    const pedidos = await Storage.getPedidos();
    const mapa = {};
    for (let i = 1; i <= CONFIG.rifa.totalNumeros; i++) mapa[i] = { estado: 'disponible', pedido: null };

    pedidos.forEach(p => {
      if (p.estado === CONFIG.estadosPedido.PENDIENTE) {
        (p.numeros || []).forEach(n => mapa[n] = { estado: 'pendiente', pedido: p });
      } else if (p.estado === CONFIG.estadosPedido.CONFIRMADO) {
        (p.numeros || []).forEach(n => mapa[n] = { estado: 'confirmado', pedido: p });
      }
    });

    this.el.gridNumerosAdmin.innerHTML = Object.entries(mapa).map(([num, info]) => {
      let clases, tooltip;
      if (info.estado === 'confirmado') { clases = 'bg-hw-red text-white border-hw-red'; tooltip = `#${num} — Vendido a ${info.pedido.nombre}`; }
      else if (info.estado === 'pendiente') { clases = 'bg-yellow-500 text-black border-yellow-500'; tooltip = `#${num} — Reservado por ${info.pedido.nombre}`; }
      else { clases = 'bg-green-600/30 text-green-400 border-green-600/50'; tooltip = `#${num} — Disponible`; }

      return `<button type="button" class="num-btn aspect-square rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center border-2 ${clases}" title="${Utils.escapeHTML(tooltip)}" ${info.pedido ? `onclick="Admin.abrirModalPedido('${info.pedido.id}')"` : 'disabled'}>${num}</button>`;
    }).join('');
  },

  // ==================== CARRITOS ====================
  async renderCarritos() {
    const carritos = await Storage.getCarritos();
    if (carritos.length === 0) {
      this.el.listaCarritos.innerHTML = `
        <div class="col-span-full bg-admin-card border border-admin-border rounded-2xl p-8 text-center">
          <div class="text-5xl mb-3">🖼️</div>
          <p class="text-gray-400 mb-4">Aún no has subido carritos.</p>
          <button onclick="Admin.abrirModalCarrito()" class="bg-hw-yellow text-hw-dark font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition">➕ Subir primer carrito</button>
        </div>
      `;
      return;
    }

    this.el.listaCarritos.innerHTML = carritos.map(c => `
      <div class="bg-admin-card border ${c.destacado ? 'border-hw-yellow' : 'border-admin-border'} rounded-2xl overflow-hidden group">
        <div class="relative aspect-square bg-admin-bg">
          <img src="${Utils.escapeHTML(c.fotos[0] || '')}" alt="${Utils.escapeHTML(c.nombre)}" class="w-full h-full object-contain" loading="lazy" />
          ${c.destacado ? `<div class="absolute top-2 left-2 bg-hw-yellow text-hw-dark text-xs font-bold px-2 py-1 rounded-full">⭐ Destacado</div>` : ''}
          <div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">📸 ${c.fotos.length}</div>
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button onclick="Admin.editarCarrito('${c.id}')" class="bg-hw-yellow text-hw-dark font-bold px-3 py-2 rounded-full text-xs hover:bg-yellow-400 transition">✏️ Editar</button>
            <button onclick="Admin.eliminarCarrito('${c.id}')" class="bg-hw-red text-white font-bold px-3 py-2 rounded-full text-xs hover:bg-red-700 transition">🗑️</button>
          </div>
        </div>
        <div class="p-3">
          <p class="text-xs font-bold text-hw-yellow">${Utils.escapeHTML(c.marca)}</p>
          <p class="text-sm text-white font-semibold truncate">${Utils.escapeHTML(c.nombre)}</p>
          <label class="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" ${c.destacado ? 'checked' : ''} onchange="Admin.toggleDestacado('${c.id}', this.checked)" class="w-4 h-4 rounded accent-hw-yellow" />
            <span class="text-xs text-gray-400">Mostrar en galería</span>
          </label>
        </div>
      </div>
    `).join('');
  },

  async toggleDestacado(id, valor) {
    await Storage.actualizarCarrito(id, { destacado: valor });
    this.toast(valor ? '⭐ Destacado' : 'Oculto del público', 'info');
    await this.renderCarritos();
  },

  async abrirModalCarrito(carrito = null) {
    this.carritoEnEdicion = carrito;
    this.fotosNuevas = [];
    this.fotosExistentes = carrito ? [...(carrito.fotos || [])] : [];

    this.el.formCarrito.reset();
    this.el.errorModalCarrito.classList.add('hidden');

    // Cargar categorías
    const cats = await Storage.getNombresCategorias();
    this.el.inputCarritoMarca.innerHTML = `<option value="">— Selecciona —</option>${cats.map(n => `<option value="${Utils.escapeHTML(n)}">${Utils.escapeHTML(n)}</option>`).join('')}`;

    if (carrito) {
      this.el.tituloModalCarrito.textContent = 'EDITAR CARRITO';
      this.el.inputCarritoMarca.value = carrito.marca;
      this.el.inputCarritoNombre.value = carrito.nombre;
      this.el.inputCarritoDescripcion.value = carrito.descripcion || '';
      this.el.inputCarritoDestacado.checked = carrito.destacado;
    } else {
      this.el.tituloModalCarrito.textContent = 'NUEVO CARRITO';
      this.el.inputCarritoDestacado.checked = false;
    }

    this.renderFotosModal();

    this.el.modalCarrito.classList.remove('hidden');
    this.el.modalCarrito.classList.add('flex');
    document.body.classList.add('modal-abierto');
  },

  cerrarModalCarritoFn() {
    this.el.modalCarrito.classList.add('hidden');
    this.el.modalCarrito.classList.remove('flex');
    document.body.classList.remove('modal-abierto');
    this.carritoEnEdicion = null;
    this.fotosNuevas = [];
    this.fotosExistentes = [];
  },

  renderFotosModal() {
    const total = this.fotosExistentes.length + this.fotosNuevas.length;
    this.el.contadorFotosModal.textContent = `${total}/${CONFIG.cloudinary.maxFotosPorCarrito}`;

    let html = '';

    // Fotos existentes
    this.fotosExistentes.forEach((url, i) => {
      html += `
        <div class="relative aspect-square bg-admin-bg rounded-xl overflow-hidden border border-admin-border group">
          <img src="${Utils.escapeHTML(url)}" class="w-full h-full object-contain" />
          <button type="button" data-tipo="existente" data-index="${i}" class="btn-quitar-foto absolute top-1 right-1 w-7 h-7 rounded-full bg-hw-red text-white text-xs font-bold hover:bg-red-700 opacity-0 group-hover:opacity-100 transition">×</button>
        </div>
      `;
    });

    // Fotos nuevas
    this.fotosNuevas.forEach((f, i) => {
      html += `
        <div class="relative aspect-square bg-admin-bg rounded-xl overflow-hidden border border-green-500 group">
          <img src="${f.preview}" class="w-full h-full object-contain" />
          <div class="absolute top-1 left-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Nueva</div>
          <button type="button" data-tipo="nueva" data-index="${i}" class="btn-quitar-foto absolute top-1 right-1 w-7 h-7 rounded-full bg-hw-red text-white text-xs font-bold hover:bg-red-700 opacity-0 group-hover:opacity-100 transition">×</button>
        </div>
      `;
    });

    // Botón agregar (si no ha llegado al máximo)
    if (total < CONFIG.cloudinary.maxFotosPorCarrito) {
      html += `
        <label class="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-admin-border rounded-xl cursor-pointer bg-admin-bg hover:border-hw-yellow transition">
          <svg class="w-8 h-8 text-hw-yellow" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="text-xs text-gray-500 mt-1">Agregar</span>
          <input type="file" accept="image/*" class="hidden" id="input-add-foto" />
        </label>
      `;
    }

    this.el.fotosGrid.innerHTML = html;

    // Attach eventos
    const inputAdd = document.getElementById('input-add-foto');
    if (inputAdd) inputAdd.addEventListener('change', (e) => this.agregarFoto(e.target.files[0]));

    this.el.fotosGrid.querySelectorAll('.btn-quitar-foto').forEach(btn => {
      btn.addEventListener('click', () => this.quitarFoto(btn.dataset.tipo, Number(btn.dataset.index)));
    });
  },

  async agregarFoto(file) {
    if (!file) return;
    const v = Utils.esImagenValida(file);
    if (!v.valido) { alert(v.error); return; }

    const preview = await Utils.archivoADataURL(file);
    this.fotosNuevas.push({ file, preview });
    this.renderFotosModal();
  },

  quitarFoto(tipo, index) {
    if (tipo === 'existente') this.fotosExistentes.splice(index, 1);
    else this.fotosNuevas.splice(index, 1);
    this.renderFotosModal();
  },

  async guardarCarrito(e) {
    e.preventDefault();

    const marca = this.el.inputCarritoMarca.value;
    const nombre = this.el.inputCarritoNombre.value.trim();
    const descripcion = this.el.inputCarritoDescripcion.value.trim();
    const destacado = this.el.inputCarritoDestacado.checked;

    if (!marca) { this.el.errorModalCarrito.textContent = 'Selecciona una marca.'; this.el.errorModalCarrito.classList.remove('hidden'); return; }
    if (!nombre) { this.el.errorModalCarrito.textContent = 'Ingresa un nombre.'; this.el.errorModalCarrito.classList.remove('hidden'); return; }

    const totalFotos = this.fotosExistentes.length + this.fotosNuevas.length;
    if (totalFotos === 0) { this.el.errorModalCarrito.textContent = 'Sube al menos 1 foto.'; this.el.errorModalCarrito.classList.remove('hidden'); return; }

    const textoOrig = this.el.btnGuardarCarrito.innerHTML;
    this.el.btnGuardarCarrito.disabled = true;
    this.el.btnGuardarCarrito.innerHTML = `<div class="spinner mx-auto"></div>`;

    try {
      // Subir nuevas fotos a Cloudinary
      let urlsNuevas = [];
      if (this.fotosNuevas.length > 0) {
        urlsNuevas = await Promise.all(
          this.fotosNuevas.map(f => Storage.subirImagenCloudinary(f.file, `carritos/${marca.toLowerCase().replace(/\s+/g, '-')}`))
        );
      }

      const fotosFinales = [...this.fotosExistentes, ...urlsNuevas];

      const data = { marca, nombre, descripcion, fotos: fotosFinales, destacado };

      if (this.carritoEnEdicion) {
        await Storage.actualizarCarrito(this.carritoEnEdicion.id, data);
        this.toast('Carrito actualizado', 'success');
      } else {
        await Storage.guardarCarrito(data);
        this.toast('Carrito agregado', 'success');
      }

      this.cerrarModalCarritoFn();
      await this.renderCarritos();

    } catch (err) {
      console.error(err);
      this.el.errorModalCarrito.textContent = 'Error: ' + (err.message || 'Intenta de nuevo.');
      this.el.errorModalCarrito.classList.remove('hidden');
    } finally {
      this.el.btnGuardarCarrito.disabled = false;
      this.el.btnGuardarCarrito.innerHTML = textoOrig;
    }
  },

  async editarCarrito(id) {
    const carrito = await Storage.getCarritoPorId(id);
    if (carrito) await this.abrirModalCarrito(carrito);
  },

  eliminarCarrito(id) {
    this.confirmar('Eliminar carrito', '¿Eliminar este carrito?', async () => {
      await Storage.eliminarCarrito(id);
      this.toast('Carrito eliminado', 'info');
      await this.renderCarritos();
    });
  },

  // ==================== CATEGORÍAS ====================
  async renderCategorias() {
    const cats = await Storage.getCategorias();
    const conteo = await Storage.getConteoPorCategoria();

    if (cats.length === 0) {
      this.el.listaCategorias.innerHTML = `<div class="bg-admin-card border border-admin-border rounded-2xl p-8 text-center"><p class="text-gray-400">No hay categorías.</p></div>`;
      return;
    }

    this.el.listaCategorias.innerHTML = cats.map(cat => {
      const cant = conteo[cat.nombre] || 0;
      return `
        <div class="bg-admin-card border border-admin-border rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="text-2xl">🏷️</span>
            <div class="min-w-0">
              <p class="font-bold text-white truncate">${Utils.escapeHTML(cat.nombre)}</p>
              <p class="text-xs text-gray-500">${cant} carrito(s)</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="Admin.editarCategoria('${cat.id}')" class="bg-admin-bg border border-admin-border text-gray-300 hover:border-hw-yellow hover:text-hw-yellow font-bold px-3 py-2 rounded-xl transition text-xs">✏️</button>
            <button onclick="Admin.eliminarCategoria('${cat.id}')" class="bg-transparent border border-hw-red/40 text-hw-red hover:bg-hw-red/10 font-bold px-3 py-2 rounded-xl transition text-xs">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async agregarCategoria(e) {
    e.preventDefault();
    const nombre = this.el.inputNuevaCategoria.value;
    const res = await Storage.agregarCategoria(nombre);
    if (!res.ok) {
      this.el.errorNuevaCategoria.textContent = res.error;
      this.el.errorNuevaCategoria.classList.remove('hidden');
      return;
    }
    this.el.errorNuevaCategoria.classList.add('hidden');
    this.el.inputNuevaCategoria.value = '';
    this.toast('Categoría agregada', 'success');
    await this.renderCategorias();
  },

  editarCategoria(id) {
    const input = prompt('Nuevo nombre:');
    if (input === null) return;
    (async () => {
      const res = await Storage.renombrarCategoria(id, input);
      if (!res.ok) return this.toast(res.error, 'error');
      this.toast('Categoría actualizada', 'success');
      await this.renderCategorias();
    })();
  },

  eliminarCategoria(id) {
    (async () => {
      const cats = await Storage.getCategorias();
      const cat = cats.find(c => c.id === id);
      if (!cat) return;
      const conteo = await Storage.getConteoPorCategoria();
      const cant = conteo[cat.nombre] || 0;
      const msg = cant > 0
        ? `Tiene ${cant} carrito(s). Se reasignarán a "Otros". ¿Continuar?`
        : `¿Eliminar "${cat.nombre}"?`;
      this.confirmar('Eliminar categoría', msg, async () => {
        const res = await Storage.eliminarCategoria(id, true);
        if (!res.ok) return this.toast(res.error, 'error');
        this.toast('Categoría eliminada', 'info');
        await this.renderCategorias();
      });
    })();
  },

  // ==================== EXPORTAR CSV ====================
  async exportarCSV() {
    const csv = await Storage.exportarCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast('CSV descargado', 'success');
  },

  // ==================== CONFIRM ====================
  confirmar(titulo, mensaje, callback) {
    this.el.confirmTitulo.textContent = titulo;
    this.el.confirmMensaje.textContent = mensaje;
    this.confirmCallback = callback;
    this.el.modalConfirm.classList.remove('hidden');
    this.el.modalConfirm.classList.add('flex');
  },

  cerrarConfirm() {
    this.el.modalConfirm.classList.add('hidden');
    this.el.modalConfirm.classList.remove('flex');
    this.confirmCallback = null;
  },

  // ==================== TOAST ====================
  toast(mensaje, tipo = 'info') {
    const colores = { success: 'bg-green-600', error: 'bg-hw-red', info: 'bg-admin-accent', warning: 'bg-yellow-600' };
    const el = document.createElement('div');
    el.className = `${colores[tipo]} text-white px-4 py-3 rounded-xl shadow-lg font-semibold text-sm pointer-events-auto max-w-xs`;
    el.textContent = mensaje;
    this.el.toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());