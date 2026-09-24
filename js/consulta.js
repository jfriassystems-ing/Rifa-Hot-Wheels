/**
 * CONSULTA DE PEDIDOS PARA JUGADORES
 */

const Consulta = {
  el: {},

  init() {
    this.el = {
      input: document.getElementById('input-consulta'),
      btn: document.getElementById('btn-consultar'),
      resultado: document.getElementById('resultado-consulta')
    };
    if (!this.el.btn) return;
    this.el.btn.addEventListener('click', () => this.buscar());
    this.el.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.buscar(); });
  },

  async buscar() {
    const query = this.el.input.value.trim();
    if (!query) return this.mostrarMensaje('Ingresa tu código o teléfono.', 'warning');
    this.mostrarCargando();
    try {
      let pedidos = [];
      if (/^HW-[A-Z0-9]+$/i.test(query)) {
        const p = await Storage.getPedidoPorId(query.toUpperCase());
        if (p) pedidos = [p];
      } else {
        pedidos = await Storage.getPedidosPorTelefono(query);
      }
      if (pedidos.length === 0) return this.mostrarMensaje('No se encontraron pedidos.', 'error');
      this.mostrarResultados(pedidos);
    } catch (e) {
      console.error(e);
      this.mostrarMensaje('Ocurrió un error. Intenta de nuevo.', 'error');
    }
  },

  mostrarCargando() {
    this.el.resultado.classList.remove('hidden');
    this.el.resultado.innerHTML = `<div class="flex items-center justify-center py-6"><div class="spinner"></div><span class="ml-3 text-gray-400">Buscando...</span></div>`;
  },

  mostrarMensaje(texto, tipo = 'info') {
    const c = {
      info: 'bg-blue-500/10 border-blue-500/50 text-blue-300',
      warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
      error: 'bg-red-500/10 border-red-500/50 text-red-300'
    };
    this.el.resultado.classList.remove('hidden');
    this.el.resultado.innerHTML = `<div class="border rounded-xl p-4 ${c[tipo]}"><p class="text-sm">${Utils.escapeHTML(texto)}</p></div>`;
  },

  mostrarResultados(pedidos) {
    this.el.resultado.classList.remove('hidden');
    this.el.resultado.innerHTML = `
      <div class="space-y-4">
        <p class="text-sm text-gray-400">${pedidos.length} pedido(s):</p>
        ${pedidos.map(p => this.renderizarPedido(p)).join('')}
      </div>
    `;
  },

  renderizarPedido(pedido) {
    const numerosHTML = pedido.numeros.map(n => {
      let clase = 'bg-hw-yellow text-hw-dark';
      if (pedido.estado === CONFIG.estadosPedido.CONFIRMADO) clase = 'bg-green-600 text-white';
      if (pedido.estado === CONFIG.estadosPedido.RECHAZADO) clase = 'bg-red-600 text-white';
      return `<span class="${clase} font-bold text-sm px-3 py-1 rounded-full">#${n}</span>`;
    }).join('');

    return `
      <div class="bg-hw-dark border border-hw-border rounded-2xl p-4">
        <div class="flex items-start justify-between mb-3 gap-3">
          <div class="min-w-0 flex-1">
            <p class="font-mono text-hw-yellow text-sm truncate">${Utils.escapeHTML(pedido.id)}</p>
            <p class="text-xs text-gray-500 mt-1">${Utils.formatoFecha(pedido.fecha)}</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full border ${Utils.claseEstado(pedido.estado)} whitespace-nowrap">
            ${Utils.emojiEstado(pedido.estado)} ${Utils.textoEstado(pedido.estado)}
          </span>
        </div>
        <div class="mb-3">
          <p class="text-xs text-gray-400 mb-2">Tus números:</p>
          <div class="flex flex-wrap gap-2">${numerosHTML}</div>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-hw-border text-sm">
          <div><p class="text-xs text-gray-500">Cantidad</p><p class="text-white font-bold">${pedido.numeros.length} número(s)</p></div>
          <div class="text-right"><p class="text-xs text-gray-500">Total</p><p class="text-hw-red font-bold">${Utils.formatoMoneda(pedido.total)}</p></div>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => Consulta.init());