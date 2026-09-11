import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { generateAutoCode } from '../lib/utils';

const DataContext = createContext();

const KEYS = {
  PRODUCTS: 'tina_products',
  CUSTOMERS: 'tina_customers',
  SALES: 'tina_sales',
  PAYMENTS: 'tina_payments',
  CASH_SESSION: 'tina_cash_session',
  CASH_HISTORY: 'tina_cash_history',
  EXPENSES: 'tina_expenses'
};

export const BRANDS = [
  'Amayra',
  'Trendy',
  'Las Oreiro / Oreiro',
  'Skora',
  'Influencer',
  'Unicross',
  'Alpine',
  'Everlast',
  'Wanderlust',
  'Ona Saenz',
  'Tropea',
  'Chenson',
  'Wilson',
  'Carey',
  'Mate Pampa',
  'Línea Infantil',
  'PVC Line',
  'Línea Económica',
  'Stanley',
  'Montagne',
  'Lumilagro',
  'Cocot',
  'Dulce Carola',
  'Maybelline',
  'Nivea',
  'Tejar',
  'Pink 365',
  'Bijou Gold',
  'Bijou Silver',
  'Acero Blanco',
  'Plata 925',
  'Sin Marca'
];

export const CATEGORIES = [
  'Marroquinería - Billeteras Mujer',
  'Marroquinería - Billeteras Hombre',
  'Marroquinería - Riñoneras (Grandes y Chicas)',
  'Marroquinería - Carteras y Bolsos',
  'Marroquinería - Bandoleras',
  'Marroquinería - Mochilas Urbanas',
  'Marroquinería - Mochilas Infantiles',
  'Marroquinería - Luncheras',
  'Marroquinería - Bolsos Materos',
  'Marroquinería - Bolsos de Viaje',
  'Marroquinería - Cartucheras',
  'Marroquinería - Cintos Hombre',
  'Marroquinería - Cintos Mujer',
  'Marroquinería - Sets de Viaje',
  'Bijouterie - Cadenas (40, 45, 50, 55, 60, 70 cm)',
  'Bijouterie - Chokers y Gargantillas',
  'Bijouterie - Rosarios y Denarios',
  'Bijouterie - Pulseras y Brazaletes',
  'Bijouterie - Aros Acero Quirúrgico (Plateados y Dorados)',
  'Bijouterie - Aros Fantasía y Bronce',
  'Bijouterie - Dijes y Medallas',
  'Bijouterie - Anillos (Regulables y Talles)',
  'Bijouterie - Conjuntos (Cadena + Dije + Aros)',
  'Accesorios Pelo - Coleros, Gomitas y Scrunchies (Bebé a Grande)',
  'Accesorios Pelo - Trabas e Invisibles (Infantiles y Adulto)',
  'Accesorios Pelo - Broches Marca Carey (Banana, Francesa, etc.)',
  'Accesorios Pelo - Broches Económicos, Fantasía, Acero y Strass',
  'Accesorios Pelo - Vinchas y Donas para Rodetes',
  'Accesorios Pelo - Peines y Cepillos',
  'Cosméticos - Rostro (Bases, Polvos, Correctores, Contornos, Rubor e Iluminadores)',
  'Cosméticos - Ojos y Cejas (Máscaras, Delineadores, Sombras, Arqueadores y Pegamento Pestañas)',
  'Cosméticos - Labios (Labiales, Gloss Color/Transparente y Delineadores)',
  'Cosméticos - Maquillaje Infantil y Pinturas',
  'Cosméticos - Brochas, Sets, Esponjas y Pinzas de Cejas',
  'Cosméticos - Manicuría (Esmaltes, Quitaesmalte, Limas, Uñas y Pegamentos)',
  'Cosméticos & Skincare - Mascarillas, Rodillos Faciales, Extractor Puntos Negros y Spa',
  'Infantil - Artículos de PVC y Silicona (Vasos, Cartucheras y Accesorios)',
  'Infantil - Juguetería y Regalos Niños (Juegos, Muñecos y Novedades)',
  'Infantil - Marroquinería de PVC y Mochilitas Infantiles',
  'Infantil - Accesorios de Verano y Playa en PVC',
  'Infantil - Bijou y Accesorios de Pelo Infantiles',
  'Infantil - Cantimploras Térmicas, Vasos Térmicos y de Plástico / Aluminio',
  'Infantil - Luncheras Térmicas y PVC (con Vaso o Compartimientos)',
  'Tazas y Vajilla - Tazas de Porcelana (Adulto y Niños), con Platito y Plásticas',
  'Tecnología & Regalería - Parlantes Bluetooth (Niños y Surtidos) y Lámparas Velador',
  'Regalería - Espejos con Base, Manuales y con Luz LED',
  'Regalería - Sets y Kits para Asado (Estuches y Cubiertos)',
  'Bazar - Termos de Acero y Aluminio (Distintos Tamaños)',
  'Bazar - Autocebantes de Acero y Kits Materos (Termo + Mate + Yerbero + Azucarera)',
  'Bazar - Botellas y Vasos Térmicos de Acero (Shakers, Mugs y Chopps Cerveceros)',
  'Bazar - Mates (Mate Pampa, Madera, Aluminio y Acero Inoxidable)',
  'Bazar - Bombillas, Yerberos y Azucareras',
  'Bazar - Jarras Térmicas y Chopps Cerveceros',
  'Regalería & Varios - Breteles, Abanicos, Petacas y Guantes Exfoliantes',
  'Regalería - Espejitos, Frasquitos de Viaje y Antifaces',
  'Regalería - Blísters de Strass y Apliques',
  'Ropa Interior y Lencería'
];

export const EXPENSE_CATEGORIES = [
  '⚡ Energía Eléctrica (Luz)',
  '🚰 Agua Potable y Servicios',
  '🌐 Internet y Teléfono',
  '🧹 Limpieza e Insumos',
  '🏠 Alquiler del Local',
  '📦 Impuestos y Tasas',
  '🛍️ Mantenimiento / Otros'
];

const INITIAL_PRODUCTS = [
  { id: 'prod-101', name: 'Cadena Acero Quirúrgico 45 cm', brand: 'Bijou Silver', category: 'Bijouterie - Cadenas (40, 45, 50, 55, 60, 70 cm)', barcode: 'BC-01-0001', costPrice: 1500, sellPrice: 3800, stock: 15, minStock: 4 },
  { id: 'prod-102', name: 'Rosario Acero Quirúrgico con Cruz', brand: 'Bijou Silver', category: 'Bijouterie - Rosarios y Denarios', barcode: 'BR-01-0001', costPrice: 2200, sellPrice: 5500, stock: 10, minStock: 3 },
  { id: 'prod-103', name: 'Choker Gargantilla Rígida Dorada', brand: 'Bijou Gold', category: 'Bijouterie - Chokers y Gargantillas', barcode: 'BK-01-0001', costPrice: 1800, sellPrice: 4500, stock: 8, minStock: 2 },
  { id: 'prod-104', name: 'Brazalete Ancho Acero Dorado', brand: 'Bijou Gold', category: 'Bijouterie - Pulseras y Brazaletes', barcode: 'BP-01-0001', costPrice: 2500, sellPrice: 6200, stock: 6, minStock: 2 },
  { id: 'prod-105', name: 'Denario Acero San Benito', brand: 'Acero Blanco', category: 'Bijouterie - Rosarios y Denarios', barcode: 'BR-01-0002', costPrice: 1200, sellPrice: 2900, stock: 12, minStock: 3 },
  
  { id: 'prod-201', name: 'Cartera Eco-Cuero Doble Manija', brand: 'Amayra', category: 'Marroquinería - Carteras y Bolsos', barcode: 'MC-01-0001', costPrice: 9500, sellPrice: 21900, stock: 4, minStock: 2 },
  { id: 'prod-202', name: 'Billetera Doble Cierre Corta', brand: 'Las Oreiro / Oreiro', category: 'Marroquinería - Billeteras Mujer', barcode: 'MW-01-0001', costPrice: 3500, sellPrice: 8200, stock: 12, minStock: 3 },
  { id: 'prod-203', name: 'Billetera Cuero Ecológico Clásica', brand: 'Everlast', category: 'Marroquinería - Billeteras Hombre', barcode: 'MW-01-0002', costPrice: 2900, sellPrice: 6800, stock: 15, minStock: 4 },
  { id: 'prod-204', name: 'Riñonera Deportiva Grande Impermeable', brand: 'Wilson', category: 'Marroquinería - Riñoneras (Grandes y Chicas)', barcode: 'MR-01-0001', costPrice: 4200, sellPrice: 9800, stock: 7, minStock: 2 },
  { id: 'prod-205', name: 'Mochila Urbana Porta Notebook', brand: 'Wanderlust', category: 'Marroquinería - Mochilas Urbanas', barcode: 'MM-01-0001', costPrice: 11500, sellPrice: 25900, stock: 5, minStock: 2 },
  { id: 'prod-206', name: 'Mochila Infantil Personajes Lentejuelas', brand: 'Skora', category: 'Marroquinería - Mochilas Infantiles', barcode: 'MM-01-0002', costPrice: 8200, sellPrice: 18500, stock: 6, minStock: 2 },
  { id: 'prod-207', name: 'Lunchera Térmica Escolar', brand: 'Trendy', category: 'Marroquinería - Luncheras', barcode: 'ML-01-0001', costPrice: 3800, sellPrice: 8900, stock: 9, minStock: 3 },
  { id: 'prod-208', name: 'Bolso Matero Reforzado Equipado', brand: 'Unicross', category: 'Marroquinería - Bolsos Materos', barcode: 'MO-01-0001', costPrice: 8900, sellPrice: 19500, stock: 3, minStock: 2 },
  { id: 'prod-209', name: 'Bolso de Viaje Mediano con Cierres', brand: 'Alpine', category: 'Marroquinería - Bolsos de Viaje', barcode: 'MO-01-0002', costPrice: 12800, sellPrice: 28900, stock: 4, minStock: 2 },
  { id: 'prod-210', name: 'Cartuchera 2 Compartimientos', brand: 'Influencer', category: 'Marroquinería - Cartucheras', barcode: 'MT-01-0001', costPrice: 1800, sellPrice: 4200, stock: 14, minStock: 4 },
  { id: 'prod-211', name: 'Cinto Hombre Cuero Sintético Cosido', brand: 'Ona Saenz', category: 'Marroquinería - Cintos Hombre', barcode: 'MK-01-0001', costPrice: 2100, sellPrice: 4900, stock: 10, minStock: 3 },
  { id: 'prod-212', name: 'Billetera Cierre Perimetral Económica', brand: 'Línea Económica', category: 'Marroquinería - Billeteras Mujer', barcode: 'MW-01-0003', costPrice: 1400, sellPrice: 3200, stock: 20, minStock: 5 },
  { id: 'prod-401', name: 'Broche Carey Modelo Francesa Grande', brand: 'Carey', category: 'Accesorios Pelo - Broches Marca Carey (Banana, Francesa, etc.)', barcode: 'AB-01-0001', costPrice: 1200, sellPrice: 2800, stock: 12, minStock: 3 },
  { id: 'prod-402', name: 'Pack x10 Coleros Comunes Surtidos', brand: 'Línea Económica', category: 'Accesorios Pelo - Coleros, Gomitas y Scrunchies (Bebé a Grande)', barcode: 'AC-01-0001', costPrice: 600, sellPrice: 1500, stock: 25, minStock: 5 },
  { id: 'prod-403', name: 'Scrunchie de Satin con Moño Elegante', brand: 'Sin Marca', category: 'Accesorios Pelo - Coleros, Gomitas y Scrunchies (Bebé a Grande)', barcode: 'AC-01-0002', costPrice: 850, sellPrice: 2200, stock: 18, minStock: 4 },
  { id: 'prod-404', name: 'Broche Banana Acero y Strass Brillante', brand: 'Carey', category: 'Accesorios Pelo - Broches Económicos, Fantasía, Acero y Strass', barcode: 'AB-01-0002', costPrice: 1900, sellPrice: 4800, stock: 8, minStock: 2 },
  { id: 'prod-405', name: 'Dona para Rodete Cabello Mediana', brand: 'Sin Marca', category: 'Accesorios Pelo - Vinchas y Donas para Rodetes', barcode: 'AV-01-0001', costPrice: 500, sellPrice: 1300, stock: 14, minStock: 3 },
  { id: 'prod-406', name: 'Blíster de Strass Facial y Cabello Surtido', brand: 'Sin Marca', category: 'Regalería - Blísters de Strass y Apliques', barcode: 'RS-01-0001', costPrice: 700, sellPrice: 1800, stock: 20, minStock: 5 },
  { id: 'prod-501', name: 'Máscara de Pestañas Volumen Intenso', brand: 'Maybelline', category: 'Cosméticos - Ojos y Cejas (Máscaras, Delineadores, Sombras, Arqueadores y Pegamento Pestañas)', barcode: 'CO-01-0001', costPrice: 3200, sellPrice: 7500, stock: 10, minStock: 3 },
  { id: 'prod-502', name: 'Arqueador de Pestañas Ergonómico con Repuesto', brand: 'Tejar', category: 'Cosméticos - Ojos y Cejas (Máscaras, Delineadores, Sombras, Arqueadores y Pegamento Pestañas)', barcode: 'CO-01-0002', costPrice: 1100, sellPrice: 2800, stock: 15, minStock: 4 },
  { id: 'prod-503', name: 'Labial Humectante Matte Larga Duración', brand: 'Maybelline', category: 'Cosméticos - Labios (Labiales, Gloss Color/Transparente y Delineadores)', barcode: 'CL-01-0001', costPrice: 2400, sellPrice: 5800, stock: 12, minStock: 3 },
  { id: 'prod-504', name: 'Gloss Labial Transparente Extra Brillo', brand: 'Pink 365', category: 'Cosméticos - Labios (Labiales, Gloss Color/Transparente y Delineadores)', barcode: 'CL-01-0002', costPrice: 1300, sellPrice: 3200, stock: 16, minStock: 4 },
  { id: 'prod-505', name: 'Set x8 Brochas de Maquillaje Profesional', brand: 'Tejar', category: 'Cosméticos - Brochas, Sets, Esponjas y Pinzas de Cejas', barcode: 'CB-01-0001', costPrice: 3500, sellPrice: 8500, stock: 7, minStock: 2 },
  { id: 'prod-506', name: 'Rodillo Facial Piedra Jade + Piedra Gua Sha', brand: 'Pink 365', category: 'Cosméticos & Skincare - Mascarillas, Rodillos Faciales, Extractor Puntos Negros y Spa', barcode: 'CS-01-0001', costPrice: 2800, sellPrice: 6900, stock: 6, minStock: 2 },
  { id: 'prod-507', name: 'Esmalte para Uñas Secado Rápido', brand: 'Tejar', category: 'Cosméticos - Manicuría (Esmaltes, Quitaesmalte, Limas, Uñas y Pegamentos)', barcode: 'CN-01-0001', costPrice: 750, sellPrice: 1900, stock: 25, minStock: 5 },
  { id: 'prod-508', name: 'Set Extractor Puntos Negros en Acero (4 piezas)', brand: 'Sin Marca', category: 'Cosméticos & Skincare - Mascarillas, Rodillos Faciales, Extractor Puntos Negros y Spa', barcode: 'CS-01-0002', costPrice: 1500, sellPrice: 3800, stock: 10, minStock: 3 },
  { id: 'prod-601', name: 'Termo Acero Inoxidable 1 Litro con Manija', brand: 'Stanley', category: 'Bazar - Termos de Acero y Aluminio (Distintos Tamaños)', barcode: 'ZT-01-0001', costPrice: 11500, sellPrice: 25900, stock: 6, minStock: 2 },
  { id: 'prod-602', name: 'Mate Pampa Térmico Edición Especial', brand: 'Mate Pampa', category: 'Bazar - Mates (Mate Pampa, Madera, Aluminio y Acero Inoxidable)', barcode: 'ZM-01-0001', costPrice: 3800, sellPrice: 8900, stock: 12, minStock: 3 },
  { id: 'prod-603', name: 'Autocebante de Acero Inoxidable 750ml', brand: 'Sin Marca', category: 'Bazar - Autocebantes de Acero y Kits Materos (Termo + Mate + Yerbero + Azucarera)', barcode: 'ZM-01-0002', costPrice: 5200, sellPrice: 11900, stock: 8, minStock: 2 },
  { id: 'prod-604', name: 'Kit Matero Completo (Termo 1L + Mate + Yerbero + Azucarera)', brand: 'Línea Económica', category: 'Bazar - Autocebantes de Acero y Kits Materos (Termo + Mate + Yerbero + Azucarera)', barcode: 'ZM-01-0003', costPrice: 8900, sellPrice: 19800, stock: 5, minStock: 2 },
  { id: 'prod-605', name: 'Vaso Térmico Chopp Cervecero con Destapador 473ml', brand: 'Stanley', category: 'Bazar - Botellas y Vasos Térmicos de Acero (Shakers, Mugs y Chopps Cerveceros)', barcode: 'ZB-01-0001', costPrice: 4500, sellPrice: 10500, stock: 10, minStock: 3 },
  { id: 'prod-606', name: 'Bombilla de Alpaca Cincelada Reforzada', brand: 'Sin Marca', category: 'Bazar - Bombillas, Yerberos y Azucareras', barcode: 'ZY-01-0001', costPrice: 1800, sellPrice: 4200, stock: 15, minStock: 4 },
  { id: 'prod-701', name: 'Vaso Infantil de PVC con Sorbete y Personajes 450ml', brand: 'Línea Infantil', category: 'Infantil - Artículos de PVC y Silicona (Vasos, Cartucheras y Accesorios)', barcode: 'IB-01-0001', costPrice: 1200, sellPrice: 2900, stock: 15, minStock: 4 },
  { id: 'prod-702', name: 'Cartuchera Transparente de PVC con Cierre Multicolor', brand: 'PVC Line', category: 'Infantil - Artículos de PVC y Silicona (Vasos, Cartucheras y Accesorios)', barcode: 'IT-01-0001', costPrice: 1500, sellPrice: 3500, stock: 12, minStock: 3 },
  { id: 'prod-703', name: 'Mochila Infantil Transparente de PVC con Lentejuelas', brand: 'Skora', category: 'Infantil - Marroquinería de PVC y Mochilitas Infantiles', barcode: 'IM-01-0001', costPrice: 4800, sellPrice: 11500, stock: 6, minStock: 2 },
  { id: 'prod-704', name: 'Set de Playa en PVC (Balde + Moldes + Pala)', brand: 'Línea Económica', category: 'Infantil - Accesorios de Verano y Playa en PVC', barcode: 'IA-01-0001', costPrice: 2200, sellPrice: 5200, stock: 10, minStock: 3 },
  { id: 'prod-801', name: 'Cantimplora Térmica Infantil con Sorbete 500ml', brand: 'Línea Infantil', category: 'Infantil - Cantimploras Térmicas, Vasos Térmicos y de Plástico / Aluminio', barcode: 'IB-01-0002', costPrice: 3200, sellPrice: 7500, stock: 10, minStock: 3 },
  { id: 'prod-802', name: 'Lunchera Térmica de PVC + Vaso de Regalo', brand: 'Trendy', category: 'Infantil - Luncheras Térmicas y PVC (con Vaso o Compartimientos)', barcode: 'IL-01-0001', costPrice: 4500, sellPrice: 10800, stock: 8, minStock: 2 },
  { id: 'prod-803', name: 'Taza de Porcelana Infantil con Platito Estampado', brand: 'Línea Infantil', category: 'Tazas y Vajilla - Tazas de Porcelana (Adulto y Niños), con Platito y Plásticas', barcode: 'VV-01-0001', costPrice: 1800, sellPrice: 4200, stock: 12, minStock: 3 },
  { id: 'prod-804', name: 'Parlante Bluetooth Infantil con Luces LED RGB', brand: 'Sin Marca', category: 'Tecnología & Regalería - Parlantes Bluetooth (Niños y Surtidos) y Lámparas Velador', barcode: 'TP-01-0001', costPrice: 5800, sellPrice: 13500, stock: 6, minStock: 2 },
  { id: 'prod-805', name: 'Espejo de Mesa con Luz LED Regulable y Base Organizadora', brand: 'Pink 365', category: 'Regalería - Espejos con Base, Manuales y con Luz LED', barcode: 'RE-01-0001', costPrice: 3900, sellPrice: 9200, stock: 7, minStock: 2 },
  { id: 'prod-806', name: 'Set de Asado Completo (Cuchillo + Tenedor en Estuche Cuero)', brand: 'Línea Económica', category: 'Regalería - Sets y Kits para Asado (Estuches y Cubiertos)', barcode: 'RA-01-0001', costPrice: 6200, sellPrice: 14500, stock: 5, minStock: 2 }
];

const INITIAL_CUSTOMERS = [
  { id: 'cust-ocasional', name: 'Cliente Ocasional', dni: '-', address: '-', phone: '-', balance: 0 },
  { 
    id: 'cust-101', 
    name: 'María González', 
    dni: '32145678', 
    address: 'Av. 3 de Abril 1450', 
    phone: '3794123456', 
    balance: 28490, 
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'cust-102', 
    name: 'Laura Fernández', 
    dni: '29876543', 
    address: 'Calle Córdoba 1230', 
    phone: '3794987654', 
    balance: 14500, 
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    category: '⚡ Energía Eléctrica',
    description: 'Factura de Luz Local Comercial',
    amount: 18500,
    paymentMethod: 'Efectivo',
    userName: 'Administrador Principal',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'exp-2',
    category: '🌐 Internet y Teléfono',
    description: 'Servicio de Internet Fibra Óptica',
    amount: 8200,
    paymentMethod: 'Transferencia',
    userName: 'Administrador Principal',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  }
];

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState(BRANDS);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashSession, setCashSession] = useState({ status: 'closed', openAmount: 0, openedAt: null });
  const [cashHistory, setCashHistory] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem('tina_categories');
      return stored ? JSON.parse(stored) : CATEGORIES;
    } catch {
      return CATEGORIES;
    }
  });

  const addCategory = (newCat) => {
    const clean = newCat ? newCat.trim() : '';
    if (!clean || categories.some(c => c.toLowerCase() === clean.toLowerCase())) return;
    const updated = [...categories, clean];
    setCategories(updated);
    localStorage.setItem('tina_categories', JSON.stringify(updated));
  };

  const saveBrandsLocal = (newList) => {
    setBrands(newList);
    localStorage.setItem('tina_brands', JSON.stringify(newList));
  };

  const addBrand = (newB) => {
    const clean = newB ? newB.trim() : '';
    if (!clean || brands.some(b => b.toLowerCase() === clean.toLowerCase())) return;
    const updated = [...brands, clean];
    saveBrandsLocal(updated);
  };

  const deleteBrand = (bToDelete) => {
    const updated = brands.filter(b => b !== bToDelete);
    saveBrandsLocal(updated);
  };

  const sanitizeProducts = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(p => {
      let code = (p.barcode || '').trim();
      if (!code || code.startsWith('prod-') || /^\d+$/.test(code) || code.startsWith('MAR-') || code.startsWith('A01-')) {
        code = generateAutoCode(p.category || 'General', list, p.name);
      }
      return { ...p, barcode: code };
    });
  };

  const loadAllData = async () => {
    // Modo LocalStorage con resguardo try-catch contra JSON corrupto
    try {
      const storedProds = localStorage.getItem(KEYS.PRODUCTS);
      const rawList = storedProds ? JSON.parse(storedProds) : INITIAL_PRODUCTS;
      const sanitized = sanitizeProducts(rawList);
      setProducts(sanitized);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Error cargando productos:', e);
      const sanitized = sanitizeProducts(INITIAL_PRODUCTS);
      setProducts(sanitized);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(sanitized));
    }

    try {
      const storedCusts = localStorage.getItem(KEYS.CUSTOMERS);
      setCustomers(storedCusts ? JSON.parse(storedCusts) : INITIAL_CUSTOMERS);
    } catch (e) {
      console.error('Error cargando clientes:', e);
      setCustomers(INITIAL_CUSTOMERS);
    }

    try {
      const storedSales = localStorage.getItem(KEYS.SALES);
      setSales(storedSales ? JSON.parse(storedSales) : []);
    } catch (e) {
      console.error('Error cargando ventas:', e);
      setSales([]);
    }

    try {
      const storedPayments = localStorage.getItem(KEYS.PAYMENTS);
      setPayments(storedPayments ? JSON.parse(storedPayments) : []);
    } catch (e) {
      console.error('Error cargando pagos:', e);
      setPayments([]);
    }

    try {
      const storedExpenses = localStorage.getItem(KEYS.EXPENSES);
      if (storedExpenses) {
        const parsed = JSON.parse(storedExpenses);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(e => e && typeof e === 'object').map(e => ({
            id: e.id || ('exp-' + Date.now() + Math.random()),
            category: e.category || 'Mantenimiento / Otros',
            description: e.description || 'Gasto registrado',
            amount: Number(e.amount) || 0,
            paymentMethod: e.paymentMethod || 'Efectivo',
            userName: e.userName || 'Cajero',
            created_at: e.created_at || new Date().toISOString()
          }));
          setExpenses(clean);
        } else {
          setExpenses(INITIAL_EXPENSES);
        }
      } else {
        setExpenses(INITIAL_EXPENSES);
      }
    } catch (e) {
      console.error('Error cargando gastos:', e);
      setExpenses(INITIAL_EXPENSES);
    }

    try {
      const storedCash = localStorage.getItem(KEYS.CASH_SESSION);
      setCashSession(storedCash ? JSON.parse(storedCash) : { status: 'closed', openAmount: 0, openedAt: null });
    } catch (e) {
      console.error('Error cargando sesión de caja:', e);
      setCashSession({ status: 'closed', openAmount: 0, openedAt: null });
    }

    try {
      const storedHistory = localStorage.getItem(KEYS.CASH_HISTORY);
      setCashHistory(storedHistory ? JSON.parse(storedHistory) : []);
    } catch (e) {
      console.error('Error cargando historial de caja:', e);
      setCashHistory([]);
    }
  };

  // --- PERSISTENCIA LOCAL ---
  const saveProductsLocal = (newProds) => {
    setProducts(newProds);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(newProds));
  };

  const saveCustomersLocal = (newCusts) => {
    setCustomers(newCusts);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(newCusts));
  };

  const saveSalesLocal = (newSales) => {
    setSales(newSales);
    localStorage.setItem(KEYS.SALES, JSON.stringify(newSales));
  };

  const savePaymentsLocal = (newPays) => {
    setPayments(newPays);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(newPays));
  };

  // --- OPERACIONES GASTOS DE FUNCIONAMIENTO Y SERVICIOS ---
  const addExpense = (data) => {
    if (!cashSession || cashSession.status !== 'open') {
      throw new Error('La caja diaria se encuentra CERRADA. Inicie la jornada antes de registrar gastos.');
    }

    const categoryStr = (data.category || '').trim() || 'Mantenimiento / Otros';
    const descStr = (data.description || '').trim() || 'Gasto de caja';
    const val = parseFloat(data.amount);
    if (isNaN(val) || val <= 0) {
      throw new Error('El monto del gasto debe ser un número válido mayor a $0.');
    }

    const newExp = {
      id: 'exp-' + Date.now(),
      category: categoryStr,
      description: descStr,
      amount: val,
      paymentMethod: data.paymentMethod || 'Efectivo',
      userName: user?.full_name || 'Cajero',
      created_at: new Date().toISOString()
    };
    const currentList = Array.isArray(expenses) ? expenses : [];
    const updated = [newExp, ...currentList];
    setExpenses(updated);
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(updated));
    return newExp;
  };

  const deleteExpense = (id) => {
    const currentList = Array.isArray(expenses) ? expenses : [];
    const updated = currentList.filter(e => e && e.id !== id);
    setExpenses(updated);
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(updated));
  };

  // --- OPERACIONES PRODUCTOS (CRUD) ---
  const addProduct = async (productData) => {
    const rawStock = parseInt(productData.stock, 10);
    const rawMinStock = parseInt(productData.minStock, 10);

    let finalBarcode = (productData.barcode || '').trim().toUpperCase();
    const isTaken = products.some(p => p.barcode && p.barcode.trim().toUpperCase() === finalBarcode);
    if (!finalBarcode || finalBarcode.startsWith('PROD-') || isTaken) {
      finalBarcode = generateAutoCode(productData.category || 'General', products, productData.name);
    }

    const newProd = {
      id: 'prod-' + Date.now(),
      name: (productData.name || '').trim(),
      brand: (productData.brand || 'Sin Marca').trim(),
      category: productData.category || 'General',
      barcode: finalBarcode,
      costPrice: !isNaN(parseFloat(productData.costPrice)) ? Math.max(0, parseFloat(productData.costPrice)) : 0,
      sellPrice: !isNaN(parseFloat(productData.sellPrice)) ? Math.max(0, parseFloat(productData.sellPrice)) : 0,
      stock: !isNaN(rawStock) ? Math.max(0, rawStock) : 0,
      minStock: !isNaN(rawMinStock) ? Math.max(0, rawMinStock) : 3,
      created_at: new Date().toISOString()
    };

    const updated = [newProd, ...products];
    saveProductsLocal(updated);
    return newProd;
  };

  const updateProduct = async (id, updatedData) => {
    const rawStock = parseInt(updatedData.stock, 10);
    const rawMinStock = parseInt(updatedData.minStock, 10);

    const updatedProds = products.map(p => {
      if (p.id === id) {
        let finalBarcode = (updatedData.barcode || '').trim().toUpperCase();
        const isTaken = products.some(other => other.id !== id && other.barcode && other.barcode.trim().toUpperCase() === finalBarcode);
        if (!finalBarcode || finalBarcode.startsWith('PROD-') || isTaken) {
          finalBarcode = generateAutoCode(updatedData.category || p.category, products, updatedData.name || p.name, '01', id);
        }
        return {
          ...p,
          name: (updatedData.name || '').trim(),
          brand: (updatedData.brand || 'Sin Marca').trim(),
          category: updatedData.category || 'General',
          barcode: finalBarcode,
          costPrice: !isNaN(parseFloat(updatedData.costPrice)) ? Math.max(0, parseFloat(updatedData.costPrice)) : 0,
          sellPrice: !isNaN(parseFloat(updatedData.sellPrice)) ? Math.max(0, parseFloat(updatedData.sellPrice)) : 0,
          stock: !isNaN(rawStock) ? Math.max(0, rawStock) : p.stock,
          minStock: !isNaN(rawMinStock) ? Math.max(0, rawMinStock) : p.minStock
        };
      }
      return p;
    });

    saveProductsLocal(updatedProds);
  };

  const deleteProduct = async (id) => {
    const filtered = products.filter(p => p.id !== id);
    saveProductsLocal(filtered);
  };

  const adjustProductStock = async (id, delta) => {
    const updatedProds = products.map(p => {
      if (p.id === id) {
        const currentStock = parseInt(p.stock, 10) || 0;
        const newStock = Math.max(0, currentStock + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    saveProductsLocal(updatedProds);
  };

  // --- OPERACIONES CLIENTES Y CUENTAS CORRIENTES ---
  const addCustomer = async (custData) => {
    const newCust = {
      id: 'cust-' + Date.now(),
      name: custData.name.trim(),
      dni: custData.dni ? custData.dni.trim() : '-',
      address: custData.address ? custData.address.trim() : '-',
      phone: custData.phone ? custData.phone.trim() : '-',
      balance: 0,
      created_at: new Date().toISOString()
    };

    const updated = [...customers, newCust];
    saveCustomersLocal(updated);
    return newCust;
  };

  const updateCustomer = async (id, custData) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...custData } : c);
    saveCustomersLocal(updated);
  };

  const deleteCustomer = async (id) => {
    const filtered = customers.filter(c => c.id !== id);
    saveCustomersLocal(filtered);
  };

  // Registrar Cobro / Abono a Cuenta Corriente
  const addPayment = async (customerId, amount, paymentMethod = 'Efectivo', notes = '') => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const newPay = {
      id: 'pay-' + Date.now(),
      customerId,
      amount: numAmount,
      paymentMethod,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    const updatedCusts = customers.map(c => {
      if (c.id === customerId) {
        const newBalance = Math.max(0, (c.balance || 0) - numAmount);
        return { ...c, balance: newBalance };
      }
      return c;
    });

    savePaymentsLocal([newPay, ...payments]);
    saveCustomersLocal(updatedCusts);
  };

  // --- PROCESAR VENTA EN POS CON RECARGO AUTOMÁTICO EN CTA CTE (10% a 30 DÍAS) Y DESCUENTOS ---
  const processSale = async ({ items, paymentMethod, customerId, newCustomerData, discountType = 'none', discountValue = 0 }) => {
    if (!cashSession || cashSession.status !== 'open') {
      throw new Error('La caja diaria se encuentra CERRADA. Abra la caja desde la pestaña "Caja Diaria" para poder registrar ventas.');
    }

    let activeCustomer = customers.find(c => c.id === customerId);

    if (!activeCustomer && newCustomerData) {
      activeCustomer = await addCustomer(newCustomerData);
    }

    if (paymentMethod === 'Cuenta Corriente' && (!activeCustomer || activeCustomer.id === 'cust-ocasional')) {
      throw new Error('Debe seleccionar o registrar un cliente válido para cobrar en Cuenta Corriente (Nombre, DNI, Domicilio y Teléfono obligatorios).');
    }

    const subtotal = items.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
    
    let discountAmount = 0;
    const val = parseFloat(discountValue) || 0;
    if (val > 0) {
      if (discountType === 'percent') {
        discountAmount = Math.round(subtotal * (Math.min(100, val) / 100));
      } else if (discountType === 'fixed') {
        discountAmount = Math.min(subtotal, Math.round(val));
      }
    }

    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

    let interestRate = 0;
    let interestAmount = 0;

    if (paymentMethod === 'Cuenta Corriente') {
      interestRate = 10;
      interestAmount = Math.round(subtotalAfterDiscount * 0.10);
    }

    const total = subtotalAfterDiscount + interestAmount;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const saleId = 'sale-' + Date.now();
    const newSale = {
      id: saleId,
      customerId: activeCustomer ? activeCustomer.id : 'cust-ocasional',
      customerName: activeCustomer ? activeCustomer.name : 'Cliente Ocasional',
      userId: user?.id,
      userName: user?.full_name || 'Cajero',
      paymentMethod,
      subtotal,
      discountType,
      discountValue: val,
      discountAmount,
      interestRate,
      interestAmount,
      total,
      dueDate: dueDate.toISOString(),
      status: 'completed',
      created_at: new Date().toISOString(),
      items: items.map(i => ({
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.sellPrice,
        subtotal: i.sellPrice * i.quantity
      }))
    };

    const updatedProducts = products.map(p => {
      const soldItem = items.find(i => i.id === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });

    let updatedCustomers = customers;
    if (paymentMethod === 'Cuenta Corriente' && activeCustomer) {
      updatedCustomers = customers.map(c => {
        if (c.id === activeCustomer.id) {
          return { 
            ...c, 
            balance: (c.balance || 0) + total,
            lastPurchaseDate: new Date().toISOString()
          };
        }
        return c;
      });
    }

    saveProductsLocal(updatedProducts);
    if (paymentMethod === 'Cuenta Corriente') saveCustomersLocal(updatedCustomers);
    saveSalesLocal([newSale, ...sales]);

    return newSale;
  };

  // --- ANULACIÓN DE VENTAS Y DEVOLUCIONES (SOLO ADMIN) ---
  const cancelSale = (saleId) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo el Administrador puede anular ventas y procesar devoluciones.');
    }

    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) throw new Error('La venta no fue encontrada.');
    if (targetSale.status === 'cancelled') throw new Error('Esta venta ya se encuentra anulada.');

    // 1. Reintegrar el stock de los productos vendidos
    const updatedProducts = products.map(p => {
      const item = targetSale.items?.find(i => i.productId === p.id);
      if (item) {
        return { ...p, stock: p.stock + item.quantity };
      }
      return p;
    });

    // 2. Si fue Cta Cte, descontar saldo al cliente
    let updatedCustomers = customers;
    if (targetSale.paymentMethod === 'Cuenta Corriente' && targetSale.customerId) {
      updatedCustomers = customers.map(c => {
        if (c.id === targetSale.customerId) {
          return { ...c, balance: Math.max(0, (c.balance || 0) - targetSale.total) };
        }
        return c;
      });
    }

    // 3. Actualizar estado de la venta a 'cancelled'
    const updatedSales = sales.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: user?.full_name || 'Admin'
        };
      }
      return s;
    });

    saveProductsLocal(updatedProducts);
    if (targetSale.paymentMethod === 'Cuenta Corriente') saveCustomersLocal(updatedCustomers);
    saveSalesLocal(updatedSales);
  };

  // --- CONTROL DE CAJA ---
  const openCash = (openAmount) => {
    const session = {
      id: 'cash-' + Date.now(),
      status: 'open',
      openAmount: parseFloat(openAmount) || 0,
      openedAt: new Date().toISOString(),
      openedBy: user?.full_name || 'Cajero'
    };
    setCashSession(session);
    localStorage.setItem(KEYS.CASH_SESSION, JSON.stringify(session));
  };

  const closeCash = (closeAmount, auditDetails = null) => {
    const closedSession = {
      ...cashSession,
      status: 'closed',
      closeAmount: parseFloat(closeAmount) || 0,
      closedAt: new Date().toISOString(),
      closedBy: user?.full_name || 'Cajero',
      audit: auditDetails
    };
    setCashSession(closedSession);
    localStorage.setItem(KEYS.CASH_SESSION, JSON.stringify(closedSession));

    // Guardar en el historial permanente de arqueos de caja
    const updatedHistory = [closedSession, ...cashHistory];
    setCashHistory(updatedHistory);
    localStorage.setItem(KEYS.CASH_HISTORY, JSON.stringify(updatedHistory));
  };

  const deleteCashHistoryRecord = (id) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo el Administrador puede eliminar registros del historial de caja.');
    }
    const updated = cashHistory.filter(h => h.id !== id);
    setCashHistory(updated);
    localStorage.setItem(KEYS.CASH_HISTORY, JSON.stringify(updated));
  };

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  const overdueCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.balance || c.balance <= 0 || c.id === 'cust-ocasional') return false;
      
      const custSales = sales.filter(s => s.customerId === c.id && s.paymentMethod === 'Cuenta Corriente');
      if (custSales.length === 0) {
        if (c.created_at) {
          const daysDiff = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24);
          return daysDiff >= 30;
        }
        return false;
      }

      const oldestSaleDate = custSales.reduce((min, s) => new Date(s.created_at) < min ? new Date(s.created_at) : min, new Date());
      const daysDiff = (Date.now() - oldestSaleDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff >= 30;
    });
  }, [customers, sales]);

  // --- OPERACIONES DE RESPALDO Y COPIAS DE SEGURIDAD (BACKUP) ---
  const exportBackupData = () => {
    const backupObj = {
      version: '2.5',
      exportDate: new Date().toISOString(),
      appName: 'Regalería Tina Gestor',
      products,
      customers,
      sales,
      payments,
      expenses,
      cashSession,
      cashHistory
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `regaleria_tina_backup_${dateStamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackupData = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('El archivo no contiene un formato válido.');
      }

      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(parsed.products));
      }
      if (parsed.customers && Array.isArray(parsed.customers)) {
        setCustomers(parsed.customers);
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
      }
      if (parsed.sales && Array.isArray(parsed.sales)) {
        setSales(parsed.sales);
        localStorage.setItem(KEYS.SALES, JSON.stringify(parsed.sales));
      }
      if (parsed.payments && Array.isArray(parsed.payments)) {
        setPayments(parsed.payments);
        localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(parsed.payments));
      }
      if (parsed.expenses && Array.isArray(parsed.expenses)) {
        setExpenses(parsed.expenses);
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(parsed.expenses));
      }
      if (parsed.cashSession && typeof parsed.cashSession === 'object') {
        setCashSession(parsed.cashSession);
        localStorage.setItem(KEYS.CASH_SESSION, JSON.stringify(parsed.cashSession));
      }
      if (parsed.cashHistory && Array.isArray(parsed.cashHistory)) {
        setCashHistory(parsed.cashHistory);
        localStorage.setItem(KEYS.CASH_HISTORY, JSON.stringify(parsed.cashHistory));
      }

      return true;
    } catch (e) {
      throw new Error('Error al restaurar copia de seguridad: ' + e.message);
    }
  };

  return (
    <DataContext.Provider value={{
      products,
      categories,
      addCategory,
      brands,
      addBrand,
      deleteBrand,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustProductStock,

      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addPayment,

      sales,
      payments,
      processSale,
      cancelSale,

      expenses,
      expenseCategories: EXPENSE_CATEGORIES,
      addExpense,
      deleteExpense,

      cashSession,
      cashHistory,
      openCash,
      closeCash,
      deleteCashHistoryRecord,

      exportBackupData,
      importBackupData,

      lowStockProducts,
      overdueCustomers
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
