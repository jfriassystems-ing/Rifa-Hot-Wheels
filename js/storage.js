/**
 * CAPA DE DATOS
 * Supabase = Base de datos | Cloudinary = Imágenes
 */

const _supabase = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

const Storage = {
  supabase: _supabase,

  // ============================================================
  //  PEDIDOS
  // ============================================================

  async getPedidos() {
    const { data, error } = await this.supabase.from('pedidos').select('*').order('fecha', { ascending: false });
    if (error) { console.error('getPedidos:', error); return []; }
    return data || [];
  },

  async getPedidoPorId(id) {
    const { data, error } = await this.supabase.from('pedidos').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('getPedidoPorId:', error); return null; }
    return data;
  },

  async getPedidosPorTelefono(telefono) {
    const tel = Utils.limpiarTelefono(telefono);
    const { data, error } = await this.supabase.from('pedidos').select('*').eq('telefono', tel).order('fecha', { ascending: false });
    if (error) { console.error('getPedidosPorTelefono:', error); return []; }
    return data || [];
  },

  async guardarPedido(pedido) {
    const nuevo = {
      id: pedido.id || Utils.generarCodigoPedido(),
      nombre: pedido.nombre || '',
      telefono: Utils.limpiarTelefono(pedido.telefono || ''),
      numeros: Utils.ordenarNumeros(pedido.numeros || []),
      total: pedido.total || 0,
      comprobante: pedido.comprobante || '',
      estado: pedido.estado || CONFIG.estadosPedido.PENDIENTE,
      fecha: pedido.fecha || new Date().toISOString(),
      notas: pedido.notas || ''
    };
    const { data, error } = await this.supabase.from('pedidos').insert(nuevo).select().single();
    if (error) { console.error('guardarPedido:', error); throw new Error(error.message); }
    return data;
  },

  async actualizarPedido(id, cambios) {
    const { data, error } = await this.supabase.from('pedidos').update(cambios).eq('id', id).select().single();
    if (error) { console.error('actualizarPedido:', error); return null; }
    return data;
  },

  async eliminarPedido(id) {
    const { error } = await this.supabase.from('pedidos').delete().eq('id', id);
    if (error) { console.error('eliminarPedido:', error); return false; }
    return true;
  },

  // ============================================================
  //  NÚMEROS
  // ============================================================

  async getNumerosOcupados() {
    const { data, error } = await this.supabase
      .from('pedidos').select('numeros, estado')
      .in('estado', [CONFIG.estadosPedido.PENDIENTE, CONFIG.estadosPedido.CONFIRMADO]);
    if (error) { console.error('getNumerosOcupados:', error); return []; }
    const ocupados = new Set();
    (data || []).forEach(p => (p.numeros || []).forEach(n => ocupados.add(Number(n))));
    (CONFIG.numerosVendidosManuales || []).forEach(n => ocupados.add(Number(n)));
    return [...ocupados].sort((a, b) => a - b);
  },

  async getEstadisticas() {
    const pedidos = await this.getPedidos();
    const stats = {
      totalPedidos: pedidos.length,
      pendientes: 0, confirmados: 0, rechazados: 0,
      numerosVendidos: 0, numerosReservados: 0,
      totalRecaudado: 0, totalPotencial: 0
    };
    pedidos.forEach(p => {
      const cant = (p.numeros || []).length;
      if (p.estado === CONFIG.estadosPedido.PENDIENTE) {
        stats.pendientes++; stats.numerosReservados += cant; stats.totalPotencial += (p.total || 0);
      } else if (p.estado === CONFIG.estadosPedido.CONFIRMADO) {
        stats.confirmados++; stats.numerosVendidos += cant; stats.totalRecaudado += (p.total || 0);
      } else if (p.estado === CONFIG.estadosPedido.RECHAZADO) {
        stats.rechazados++;
      }
    });
    stats.totalNumeros = CONFIG.rifa.totalNumeros;
    stats.numerosDisponibles = Math.max(0, stats.totalNumeros - stats.numerosVendidos - stats.numerosReservados);
    stats.porcentajeVendido = Math.round((stats.numerosVendidos / stats.totalNumeros) * 100);
    return stats;
  },

  // ============================================================
  //  AUTENTICACIÓN ADMIN
  // ============================================================

  async adminEstaAutenticado() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return !!session;
  },

  async adminLogin(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: String(email).trim(), password
    });
    if (error) { console.error('Login:', error); return { ok: false, error: 'Email o contraseña incorrectos.' }; }
    return { ok: true, user: data.user };
  },

  async adminLogout() { await this.supabase.auth.signOut(); },

  // ============================================================
  //  CATEGORÍAS
  // ============================================================

  async getCategorias() {
    const { data, error } = await this.supabase.from('categorias').select('*').order('fecha_creacion', { ascending: true });
    if (error) { console.error('getCategorias:', error); return []; }
    return (data || []).map(c => ({ id: c.id, nombre: c.nombre, fechaCreacion: c.fecha_creacion }));
  },

  async getNombresCategorias() {
    const cats = await this.getCategorias();
    return cats.map(c => c.nombre);
  },

  async agregarCategoria(nombre) {
    const limpio = String(nombre || '').trim();
    if (!limpio) return { ok: false, error: 'El nombre no puede estar vacío.' };
    const nueva = { id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, nombre: limpio };
    const { data, error } = await this.supabase.from('categorias').insert(nueva).select().single();
    if (error) {
      if (error.code === '23505') return { ok: false, error: 'Ya existe una categoría con ese nombre.' };
      return { ok: false, error: 'Error al crear la categoría.' };
    }
    return { ok: true, categoria: { id: data.id, nombre: data.nombre, fechaCreacion: data.fecha_creacion } };
  },

  async renombrarCategoria(id, nuevoNombre) {
    const limpio = String(nuevoNombre || '').trim();
    if (!limpio) return { ok: false, error: 'El nombre no puede estar vacío.' };
    const cats = await this.getCategorias();
    const catAnterior = cats.find(c => c.id === id);
    if (!catAnterior) return { ok: false, error: 'Categoría no encontrada.' };
    const { error } = await this.supabase.from('categorias').update({ nombre: limpio }).eq('id', id);
    if (error) {
      if (error.code === '23505') return { ok: false, error: 'Ya existe otra categoría con ese nombre.' };
      return { ok: false, error: 'Error al actualizar.' };
    }
    await this.supabase.from('carritos').update({ marca: limpio }).eq('marca', catAnterior.nombre);
    return { ok: true };
  },

  async eliminarCategoria(id, reasignarAOtros = false) {
    const cats = await this.getCategorias();
    const categoria = cats.find(c => c.id === id);
    if (!categoria) return { ok: false, error: 'Categoría no encontrada.' };
    const { data: afectados } = await this.supabase.from('carritos').select('id').eq('marca', categoria.nombre);
    const cantAfectados = afectados?.length || 0;
    if (cantAfectados > 0 && !reasignarAOtros) {
      return { ok: false, error: `Esta categoría tiene ${cantAfectados} carrito(s). Confirma para reasignarlos a "Otros".`, imagenesAfectadas: cantAfectados };
    }
    if (cantAfectados > 0) {
      const existeOtros = cats.some(c => c.nombre === 'Otros');
      if (!existeOtros) {
        await this.supabase.from('categorias').insert({ id: `cat-otros-${Date.now()}`, nombre: 'Otros' });
      }
      await this.supabase.from('carritos').update({ marca: 'Otros' }).eq('marca', categoria.nombre);
    }
    const { error } = await this.supabase.from('categorias').delete().eq('id', id);
    if (error) return { ok: false, error: 'Error al eliminar.' };
    return { ok: true, imagenesAfectadas: cantAfectados };
  },

  async getConteoPorCategoria() {
    const { data, error } = await this.supabase.from('carritos').select('marca');
    if (error) return {};
    const conteo = {};
    (data || []).forEach(c => {
      const m = c.marca || 'Sin categoría';
      conteo[m] = (conteo[m] || 0) + 1;
    });
    return conteo;
  },

  // ============================================================
  //  CARRITOS
  // ============================================================

  _mapCarrito(row) {
    return {
      id: row.id,
      marca: row.marca,
      nombre: row.nombre,
      descripcion: row.descripcion || '',
      fotos: row.fotos || [],
      destacado: row.destacado === true,
      orden: row.orden || 0,
      fechaCreacion: row.fecha_creacion
    };
  },

  async getCarritos() {
    const { data, error } = await this.supabase.from('carritos').select('*')
      .order('orden', { ascending: true }).order('fecha_creacion', { ascending: true });
    if (error) { console.error('getCarritos:', error); return []; }
    return (data || []).map(r => this._mapCarrito(r));
  },

  async getCarritosDestacados() {
    const { data, error } = await this.supabase.from('carritos').select('*').eq('destacado', true)
      .order('orden', { ascending: true }).order('fecha_creacion', { ascending: true });
    if (error) { console.error('getCarritosDestacados:', error); return []; }
    return (data || []).map(r => this._mapCarrito(r));
  },

  async getCarritoPorId(id) {
    const { data, error } = await this.supabase.from('carritos').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('getCarritoPorId:', error); return null; }
    return data ? this._mapCarrito(data) : null;
  },

  async guardarCarrito(carrito) {
    const nuevo = {
      id: carrito.id || `car-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      marca: carrito.marca || 'Otros',
      nombre: carrito.nombre || '',
      descripcion: carrito.descripcion || '',
      fotos: Array.isArray(carrito.fotos) ? carrito.fotos : [],
      destacado: carrito.destacado === true,
      orden: carrito.orden ?? Date.now()
    };
    const { data, error } = await this.supabase.from('carritos').insert(nuevo).select().single();
    if (error) { console.error('guardarCarrito:', error); throw new Error(error.message); }
    return this._mapCarrito(data);
  },

  async actualizarCarrito(id, cambios) {
    const { data, error } = await this.supabase.from('carritos').update(cambios).eq('id', id).select().single();
    if (error) { console.error('actualizarCarrito:', error); return null; }
    return this._mapCarrito(data);
  },

  async eliminarCarrito(id) {
    const { error } = await this.supabase.from('carritos').delete().eq('id', id);
    if (error) { console.error('eliminarCarrito:', error); return false; }
    return true;
  },

  // ============================================================
  //  CLOUDINARY — Subida de imágenes
  // ============================================================

  async subirImagenCloudinary(file, subcarpeta = 'general') {
    if (!CONFIG.cloudinary.cloudName || !CONFIG.cloudinary.uploadPreset) {
      throw new Error('Cloudinary no está configurado');
    }
    const folder = `${CONFIG.cloudinary.folderBase}/${subcarpeta}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
    formData.append('folder', folder);

    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Cloudinary error:', err);
      throw new Error(err.error?.message || 'Error al subir la imagen');
    }
    const data = await res.json();
    return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
  },

  async subirVariasImagenes(files, subcarpeta = 'general') {
    return Promise.all(files.map(f => this.subirImagenCloudinary(f, subcarpeta)));
  },

  // ============================================================
  //  EXPORTACIÓN
  // ============================================================

  async exportarCSV() {
    const pedidos = await this.getPedidos();
    const headers = ['ID', 'Nombre', 'Teléfono', 'Números', 'Cantidad', 'Total', 'Estado', 'Fecha', 'Comprobante', 'Notas'];
    const filas = pedidos.map(p => [
      p.id, p.nombre, p.telefono, (p.numeros || []).join(' | '),
      (p.numeros || []).length, p.total, Utils.textoEstado(p.estado),
      Utils.formatoFecha(p.fecha), p.comprobante, p.notas
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.map(esc).join(','), ...filas.map(f => f.map(esc).join(','))].join('\n');
  }
};