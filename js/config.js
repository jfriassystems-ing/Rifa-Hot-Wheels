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
    whatsapp: '(809) 505-9852',
    whatsappMostrar: '(809) 505-9852'
  },

  cuentasBancarias: [
    {
      id: 'popular',
      banco: 'Banco Popular Dominicano',
      etiquetaCorta: 'Popular',
      colorBadge: 'bg-hw-red',
      titular: 'Juan Pérez',
      tipo: 'Cuenta de Ahorro',
      numero: '123-456789-0',
      numeroCopiar: '1234567890'
    },
    {
      id: 'bhd',
      banco: 'Banco BHD',
      etiquetaCorta: 'BHD',
      colorBadge: 'bg-blue-600',
      titular: 'Juan Pérez',
      tipo: 'Cuenta de Ahorro',
      numero: '987-654321-0',
      numeroCopiar: '9876543210'
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