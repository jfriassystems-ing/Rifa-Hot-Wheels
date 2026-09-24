/**
 * UTILIDADES GLOBALES
 */

const Utils = {
  formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return `${CONFIG.rifa.monedaSimbolo}${num.toLocaleString('es-DO')} ${CONFIG.rifa.moneda}`;
  },

  formatoFecha(fechaISO) {
    if (!fechaISO) return '—';
    try {
      return new Date(fechaISO).toLocaleString('es-DO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '—'; }
  },

  limpiarTelefono(tel) { return String(tel || '').replace(/\D/g, ''); },

  formatearTelefono(tel) {
    const limpio = this.limpiarTelefono(tel);
    if (limpio.length === 10) return `${limpio.slice(0,3)}-${limpio.slice(3,6)}-${limpio.slice(6)}`;
    if (limpio.length === 11 && limpio.startsWith('1')) return `${limpio.slice(1,4)}-${limpio.slice(4,7)}-${limpio.slice(7)}`;
    return tel;
  },

  esTelefonoValido(tel) {
    const limpio = this.limpiarTelefono(tel);
    return limpio.length === 10 || (limpio.length === 11 && limpio.startsWith('1'));
  },

  generarCodigoPedido() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let codigo = 'HW-';
    for (let i = 0; i < 6; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    return codigo;
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  esImagenValida(file, maxMB = CONFIG.cloudinary.maxSizeMB) {
    if (!file) return { valido: false, error: 'No hay archivo.' };
    if (!file.type.startsWith('image/')) return { valido: false, error: 'Debe ser una imagen.' };
    if (file.size > maxMB * 1024 * 1024) return { valido: false, error: `Supera los ${maxMB} MB.` };
    return { valido: true };
  },

  archivoADataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  ordenarNumeros(arr) { return [...arr].sort((a, b) => Number(a) - Number(b)); },

  async copiarAlPortapapeles(texto) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return true;
      }
      const temp = document.createElement('textarea');
      temp.value = texto; temp.style.position = 'fixed'; temp.style.opacity = '0';
      document.body.appendChild(temp); temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      return true;
    } catch { return false; }
  },

  debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  claseEstado(estado) {
    const map = {
      [CONFIG.estadosPedido.PENDIENTE]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      [CONFIG.estadosPedido.CONFIRMADO]: 'bg-green-500/20 text-green-400 border-green-500',
      [CONFIG.estadosPedido.RECHAZADO]: 'bg-red-500/20 text-red-400 border-red-500'
    };
    return map[estado] || 'bg-gray-500/20 text-gray-400 border-gray-500';
  },

  emojiEstado(estado) {
    return {
      [CONFIG.estadosPedido.PENDIENTE]: '⏳',
      [CONFIG.estadosPedido.CONFIRMADO]: '✅',
      [CONFIG.estadosPedido.RECHAZADO]: '❌'
    }[estado] || '❓';
  },

  textoEstado(estado) {
    return {
      [CONFIG.estadosPedido.PENDIENTE]: 'Pendiente',
      [CONFIG.estadosPedido.CONFIRMADO]: 'Confirmado',
      [CONFIG.estadosPedido.RECHAZADO]: 'Rechazado'
    }[estado] || estado;
  }
};