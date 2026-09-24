/**
 * CONFIGURACIÓN GLOBAL - RIFA HOT WHEELS
 * Supabase = Base de datos | Cloudinary = Imágenes
 */

const CONFIG = {
  rifa: {
    nombre: 'Rifa Hot Wheels',
    premio: 'Más de 85 carritos Hot Wheels destapados en excelente estado',
    totalNumeros: 100,
    precioPorNumero: 500,
    moneda: 'DOP',
    monedaSimbolo: '$'
  },

  // ==================== SUPABASE ====================
  supabase: {
    url: 'https://hjasnqyvaqzflbquutnk.supabase.co',
    anonKey: 'sb_publishable_xNWxXO3bFn5CgftloZJlJQ_bZGp6-hp'
  },

  // ==================== CLOUDINARY ====================
  cloudinary: {
    cloudName: 'dqsf2wt7',
    uploadPreset: 'rifa_hot_wheels_unsigned',
    folderBase: 'rifa-hot-wheels',
    maxSizeMB: 5,
    maxFotosPorCarrito: 3
  },

  contacto: {
    whatsapp: '18095059852',
    whatsappMostrar: '18095059852'
  },

  cuentasBancarias: [
  {
    id: 'popular',
    banco: 'Banco Popular',
    etiquetaCorta: 'Popular',
    colorBadge: 'bg-hw-red',
    titular: 'Julio Bautista Frias Guzman',
    cedula: '402-4288485-2',
    tipo: 'Cuenta de Ahorro',
    numero: '822-622981-6',
    numeroCopiar: '822622981'
  },
  {
    id: 'banreservas',
    banco: 'Banreservas',
    etiquetaCorta: 'Banreservas',
    colorBadge: 'bg-green-600',
    titular: 'Julio Bautista Frias Guzman',
    cedula: '402-4288485-2',
    tipo: 'Cuenta de Ahorro',
    numero: '960-894457-5',
    numeroCopiar: '9608944575'
  },
  {
    id: 'bhd',
    banco: 'Banco BHD',
    etiquetaCorta: 'BHD',
    colorBadge: 'bg-blue-600',
    titular: 'Julio Bautista Frias Guzman',
    cedula: '402-4288485-2',
    tipo: 'Cuenta Corriente',
    numero: '392-950200-13',
    numeroCopiar: '39295020013'
  }
],

  estadosPedido: {
    PENDIENTE: 'pendiente',
    CONFIRMADO: 'confirmado',
    RECHAZADO: 'rechazado'
  },

  textos: {
    mensajeWhatsappPedido: '🏎️ *NUEVO PEDIDO - RIFA HOT WHEELS* 🏎️'
  },

  numerosVendidosManuales: []
};

Object.freeze(CONFIG);