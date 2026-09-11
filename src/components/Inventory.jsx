import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateAutoCode } from '../lib/utils';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Filter,
  DollarSign,
  TrendingUp,
  Flame,
  Award,
  BarChart2,
  ShoppingBag,
  Tag,
  Barcode,
  Folder,
  Sparkles,
  Percent,
  Save,
  X
} from 'lucide-react';

export function Inventory() {
  const { products, categories, addCategory, brands = [], addBrand, addProduct, updateProduct, deleteProduct, adjustProductStock, lowStockProducts, sales } = useData();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory' | 'top_sales'

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    brandMode: 'SELECT',
    customBrand: '',
    category: '',
    categoryMode: 'SELECT',
    customCategory: '',
    barcode: '',
    variantCode: '01',
    costPrice: '',
    sellPrice: '',
    stock: '1',
    minStock: '3'
  });

  // CÁLCULO DEL HISTORIAL DE PRODUCTOS MÁS VENDIDOS
  const topSellingProducts = useMemo(() => {
    const map = {};

    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const pId = item.productId || item.id;
          const qty = item.quantity || 0;
          const sub = item.subtotal || (qty * (item.unitPrice || 0));

          if (!map[pId]) {
            map[pId] = {
              id: pId,
              name: item.name,
              totalQty: 0,
              totalRevenue: 0,
              salesCount: 0
            };
          }
          map[pId].totalQty += qty;
          map[pId].totalRevenue += sub;
          map[pId].salesCount += 1;
        });
      }
    });

    const rankingList = Object.values(map).map(item => {
      const liveProd = products.find(p => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase());
      return {
        ...item,
        category: liveProd ? liveProd.category : 'General',
        brand: liveProd ? (liveProd.brand || 'Sin Marca') : 'Sin Marca',
        stock: liveProd ? liveProd.stock : 0,
        minStock: liveProd ? liveProd.minStock : 3,
        sellPrice: liveProd ? liveProd.sellPrice : (item.totalRevenue / (item.totalQty || 1))
      };
    });

    return rankingList.sort((a, b) => b.totalQty - a.totalQty);
  }, [sales, products]);

  const maxSold = useMemo(() => {
    return topSellingProducts.length > 0 ? topSellingProducts[0].totalQty : 1;
  }, [topSellingProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/g, '');

    return products.filter(p => {
      const codeLower = (p.barcode || '').toLowerCase();
      const cleanCode = codeLower.replace(/[^a-z0-9]/g, '');

      const matchSearch = codeLower.includes(term) || 
                          (cleanCode && cleanTerm && cleanCode.includes(cleanTerm)) ||
                          p.name.toLowerCase().includes(term) || 
                          p.category.toLowerCase().includes(term) ||
                          (p.brand && p.brand.toLowerCase().includes(term));
                          
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory || p.category.startsWith(selectedCategory);
      const matchBrand = selectedBrand === 'ALL' || (p.brand || 'Sin Marca') === selectedBrand;
      const matchLow = !onlyLowStock || p.stock <= p.minStock;
      return matchSearch && matchCat && matchBrand && matchLow;
    });
  }, [products, search, selectedCategory, selectedBrand, onlyLowStock]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0);
  }, [products]);

  const formatPrice = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const openModal = (prod = null) => {
    if (prod) {
      setEditingProd(prod);
      let variant = '01';
      if (prod.barcode && prod.barcode.includes('-')) {
        const parts = prod.barcode.split('-');
        if (parts.length >= 3) variant = parts[1];
      }
      setForm({
        name: prod.name,
        brand: prod.brand || '',
        brandMode: 'SELECT',
        customBrand: '',
        category: prod.category || '',
        categoryMode: 'SELECT',
        customCategory: '',
        barcode: prod.barcode || '',
        variantCode: variant,
        costPrice: prod.costPrice !== undefined ? String(prod.costPrice) : '',
        sellPrice: prod.sellPrice !== undefined ? String(prod.sellPrice) : '',
        stock: prod.stock !== undefined ? String(prod.stock) : '1',
        minStock: prod.minStock !== undefined ? String(prod.minStock) : '3'
      });
    } else {
      setEditingProd(null);
      const defaultCat = categories.length > 0 ? categories[0] : 'Bijouterie';
      const autoCode = generateAutoCode(defaultCat, products, '', '01');
      setForm({
        name: '',
        brand: '',
        brandMode: 'SELECT',
        customBrand: '',
        category: defaultCat,
        categoryMode: 'SELECT',
        customCategory: '',
        barcode: autoCode,
        variantCode: '01',
        costPrice: '',
        sellPrice: '',
        stock: '1',
        minStock: '3'
      });
    }
    setShowModal(true);
  };

  const duplicateProd = useMemo(() => {
    const codeToTest = (form.barcode || '').trim().toUpperCase();
    if (!codeToTest) return null;
    return products.find(p => 
      p.barcode && 
      p.barcode.trim().toUpperCase() === codeToTest && 
      (!editingProd || p.id !== editingProd.id)
    );
  }, [form.barcode, products, editingProd]);

  const suggestedAlternativeCode = useMemo(() => {
    if (!duplicateProd) return '';
    const currentCat = form.categoryMode === 'CUSTOM' ? form.customCategory : form.category;
    return generateAutoCode(currentCat, products, form.name, form.variantCode || '01', editingProd ? editingProd.id : null);
  }, [duplicateProd, form.category, form.categoryMode, form.customCategory, form.name, form.variantCode, products, editingProd]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Por favor ingrese el Nombre Comercial del producto.');
      return;
    }
    if (!form.sellPrice || isNaN(parseFloat(form.sellPrice))) {
      alert('Por favor ingrese un Precio de Venta válido.');
      return;
    }

    let finalBrand = form.brandMode === 'CUSTOM' ? form.customBrand.trim() : form.brand.trim();
    if (!finalBrand) finalBrand = 'Sin Marca';

    if (finalBrand !== 'Sin Marca' && !brands.includes(finalBrand) && addBrand) {
      addBrand(finalBrand);
    }

    let finalCategory = form.categoryMode === 'CUSTOM' ? form.customCategory.trim() : form.category.trim();
    if (!finalCategory) finalCategory = 'General';

    if (finalCategory !== 'General' && !categories.includes(finalCategory) && addCategory) {
      addCategory(finalCategory);
    }

    const parsedStock = parseInt(form.stock, 10);
    const parsedMinStock = parseInt(form.minStock, 10);

    let finalBarcode = form.barcode.trim().toUpperCase();
    if (!finalBarcode || finalBarcode.startsWith('PROD-')) {
      finalBarcode = generateAutoCode(finalCategory, products, form.name.trim(), form.variantCode || '01', editingProd ? editingProd.id : null);
    }

    const existingDuplicate = products.find(p => 
      p.barcode && 
      p.barcode.trim().toUpperCase() === finalBarcode && 
      (!editingProd || p.id !== editingProd.id)
    );

    if (existingDuplicate) {
      const alt = generateAutoCode(finalCategory, products, form.name.trim(), form.variantCode || '01', editingProd ? editingProd.id : null);
      alert(`⚠️ El código "${finalBarcode}" ya pertenece al producto "${existingDuplicate.name}".\n\nSe asignó automáticamente el código disponible sugerido: "${alt}".`);
      finalBarcode = alt;
      setForm(f => ({ ...f, barcode: alt }));
    }

    const payload = {
      name: form.name.trim(),
      brand: finalBrand,
      category: finalCategory,
      barcode: finalBarcode,
      costPrice: form.costPrice !== '' && !isNaN(parseFloat(form.costPrice)) ? Math.max(0, parseFloat(form.costPrice)) : 0,
      sellPrice: parseFloat(form.sellPrice),
      stock: !isNaN(parsedStock) ? Math.max(0, parsedStock) : 0,
      minStock: !isNaN(parsedMinStock) ? Math.max(0, parsedMinStock) : 3
    };

    if (editingProd) {
      await updateProduct(editingProd.id, payload);
    } else {
      await addProduct(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (prod) => {
    if (window.confirm(`¿Eliminar producto "${prod.name}" del inventario?`)) {
      await deleteProduct(prod.id);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 20px' }}>
      
      {/* HEADER METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        
        <div className="stat-card">
          <div className="stat-icon purple"><Package size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Ítems en Catálogo</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{products.length} Productos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink"><DollarSign size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Valor Estimado Inventario</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(totalInventoryValue)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><AlertTriangle size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Stock Bajo o Agotado</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b' }}>
              {lowStockProducts.length} Alerta{lowStockProducts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

      </div>

      {/* PESTAÑAS SUB-NAVEGACIÓN DE INVENTARIO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`btn ${activeSubTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('inventory')}
          style={{ borderRadius: 'var(--radius-full)', padding: '8px 20px', fontWeight: 800 }}
        >
          <Package size={18} /> Gestión de Productos
        </button>

        <button 
          className={`btn ${activeSubTab === 'top_sales' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('top_sales')}
          style={{ borderRadius: 'var(--radius-full)', padding: '8px 20px', fontWeight: 800 }}
        >
          <Flame size={18} /> Top Productos Más Vendidos
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE PRODUCTOS */}
      {activeSubTab === 'inventory' && (
        <>
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '48px', borderRadius: 'var(--radius-full)' }} 
                  placeholder="Buscar por nombre, marca, código alfanumérico (ej: A01-0001) o categoría..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* SELECTOR DE MARCA */}
                <select 
                  className="form-control" 
                  value={selectedBrand} 
                  onChange={e => setSelectedBrand(e.target.value)}
                  style={{ borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: '0.88rem', fontWeight: 700, width: 'auto' }}
                >
                  <option value="ALL">🏷️ Todas las Marcas</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                  <input 
                    type="checkbox" 
                    checked={onlyLowStock} 
                    onChange={e => setOnlyLowStock(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Sólo Stock Bajo
                </label>

                <button className="btn btn-primary" onClick={() => openModal()} style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  <Plus size={18} /> + Nuevo Producto
                </button>
              </div>
            </div>

            {/* CHIPS DE CATEGORÍAS */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button 
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory('ALL')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                Todas las Categorías
              </button>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  {cat.split(' - ')[1] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* TABLA DE PRODUCTOS */}
          <div className="table-responsive glass-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Categoría</th>
                  <th>Código de Producto</th>
                  <th>Costo</th>
                  <th>Precio Venta</th>
                  <th>Estado Stock</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isOutOfStock = p.stock <= 0;
                    const isLowStock = p.stock <= p.minStock && !isOutOfStock;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{p.name}</td>
                        <td>
                          <span style={{ 
                            background: 'rgba(236, 72, 153, 0.15)', 
                            color: '#ec4899', 
                            padding: '4px 10px', 
                            borderRadius: 'var(--radius-full)', 
                            fontSize: '0.8rem', 
                            fontWeight: 800 
                          }}>
                            🏷️ {p.brand || 'Sin Marca'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.category}</td>
                        <td>
                          <span style={{ 
                            background: 'rgba(139, 92, 246, 0.15)', 
                            color: '#c4b5fd', 
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            fontSize: '0.85rem', 
                            fontFamily: 'monospace', 
                            fontWeight: 900,
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            letterSpacing: '0.05em'
                          }}>
                            {p.barcode && !p.barcode.startsWith('prod-') ? p.barcode : generateAutoCode(p.category, products, p.name)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formatPrice(p.costPrice || 0)}</td>
                        <td style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(p.sellPrice || 0)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge ${isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: '85px', textAlign: 'center' }}>
                              {isOutOfStock ? 'Agotado (0)' : `Stock: ${p.stock}`}
                            </span>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => adjustProductStock(p.id, -1)}
                                disabled={p.stock <= 0}
                                title="Restar 1 unidad"
                                style={{ padding: '3px 7px', fontSize: '0.78rem', fontWeight: 900, borderRadius: '6px' }}
                              >
                                -1
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => adjustProductStock(p.id, 1)}
                                title="Sumar 1 unidad"
                                style={{ padding: '3px 7px', fontSize: '0.78rem', fontWeight: 900, borderRadius: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}
                              >
                                +1
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => adjustProductStock(p.id, 5)}
                                title="Sumar 5 unidades"
                                style={{ padding: '3px 7px', fontSize: '0.78rem', fontWeight: 900, borderRadius: '6px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)' }}
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openModal(p)} title="Editar Producto">
                              <Edit2 size={15} /> Editar
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(p)} style={{ color: '#ef4444' }} title="Eliminar Producto">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PESTAÑA 2: TOP PRODUCTOS MÁS VENDIDOS */}
      {activeSubTab === 'top_sales' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={22} style={{ color: '#f59e0b' }} /> Ranking de Productos Más Vendidos
          </h3>

          {topSellingProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              No hay suficientes registros de ventas aún para generar el ranking.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topSellingProducts.map((item, idx) => {
                const percent = Math.round((item.totalQty / maxSold) * 100);
                return (
                  <div key={item.id} style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{item.name}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🏷️ {item.brand} | {item.category}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>{item.totalQty} unidades vendidas</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Ingresos: {formatPrice(item.totalRevenue)}</div>
                      </div>
                    </div>
                    {/* BARRA DE PROGRESO RELATIVA */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL EDITAR / AGREGAR PRODUCTO (DISEÑO PROFESIONAL ELEVADO) */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            
            {/* CABECERA DEL MODAL */}
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))', 
              padding: '20px 24px',
              flexShrink: 0,
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)'
                }}>
                  {editingProd ? <Edit2 size={22} /> : <Package size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                    {editingProd ? '✏️ Modificar Producto del Catálogo' : '✨ Agregar Nuevo Producto'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    {editingProd ? 'Edite los precios, marcas o stock del producto seleccionado.' : 'Complete la información comercial y stock para ingresarlo al sistema.'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-icon" 
                onClick={() => setShowModal(false)}
                style={{ borderRadius: '50%', padding: '8px', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
                
                {/* BLOQUE 1: INFORMACIÓN GENERAL DEL PRODUCTO */}
                <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: 'var(--glass-border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> 1. Información General del Producto
                  </div>

                  {/* NOMBRE DEL PRODUCTO */}
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Nombre Comercial del Producto *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={form.name} 
                      onChange={e => {
                        const newName = e.target.value;
                        setForm(f => {
                          const currentCat = f.categoryMode === 'CUSTOM' ? f.customCategory : f.category;
                          const autoCode = editingProd ? f.barcode : generateAutoCode(currentCat || 'General', products, newName, f.variantCode || '01');
                          return { ...f, name: newName, barcode: autoCode };
                        });
                      }} 
                      placeholder="Ej. Cartera Bandolera Eco-Cuero Suave con Cierre" 
                      style={{ fontSize: '1rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* MARCA DEL PRODUCTO */}
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={15} style={{ color: '#ec4899' }} /> Marca del Producto
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select 
                        className="form-control" 
                        value={form.brandMode === 'CUSTOM' ? 'CUSTOM' : form.brand} 
                        onChange={e => {
                          if (e.target.value === 'CUSTOM') {
                            setForm({ ...form, brandMode: 'CUSTOM', customBrand: '' });
                          } else {
                            setForm({ ...form, brandMode: 'SELECT', brand: e.target.value, customBrand: '' });
                          }
                        }}
                        style={{ fontWeight: 800, fontSize: '0.95rem' }}
                      >
                        <option value="">-- Seleccionar Marca de la Lista --</option>
                        <option value="Sin Marca">Sin Marca</option>
                        {brands.filter(b => b !== 'Sin Marca').map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="CUSTOM">➕ Escribir / Crear Nueva Marca...</option>
                      </select>

                      {form.brandMode === 'CUSTOM' && (
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ borderColor: 'var(--color-primary)', fontWeight: 700 }} 
                          value={form.customBrand} 
                          onChange={e => setForm({ ...form, customBrand: e.target.value })} 
                          placeholder="Escriba el nombre de la nueva marca..." 
                        />
                      )}
                    </div>
                  </div>

                  {/* CATEGORÍA / RUBRO */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Folder size={15} style={{ color: '#8b5cf6' }} /> Categoría / Rubro *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select 
                        className="form-control" 
                        value={form.categoryMode === 'CUSTOM' ? 'CUSTOM' : form.category} 
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setForm(f => ({ ...f, categoryMode: 'CUSTOM', customCategory: '' }));
                          } else {
                            const autoCode = editingProd ? form.barcode : generateAutoCode(val, products, form.name, form.variantCode || '01');
                            setForm(f => ({ ...f, categoryMode: 'SELECT', category: val, customCategory: '', barcode: autoCode }));
                          }
                        }}
                        style={{ fontWeight: 700, fontSize: '0.95rem' }}
                      >
                        <option value="">-- Seleccionar Categoría / Rubro de la Lista --</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="CUSTOM">➕ Escribir / Crear Nueva Categoría...</option>
                      </select>

                      {form.categoryMode === 'CUSTOM' && (
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ borderColor: '#8b5cf6', fontWeight: 700 }} 
                          value={form.customCategory} 
                          onChange={e => {
                            const customVal = e.target.value;
                            const autoCode = editingProd ? form.barcode : generateAutoCode(customVal, products, form.name, form.variantCode || '01');
                            setForm(f => ({ ...f, customCategory: customVal, barcode: autoCode }));
                          }} 
                          placeholder="Escriba la nueva categoría o rubro..." 
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: PANEL DE CÓDIGO DE BARRAS / SKU INTUITIVO */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))', 
                  padding: '22px', 
                  borderRadius: '18px', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  {/* ENCABEZADO Y BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Barcode size={18} style={{ color: '#a78bfa' }} /> 2. Panel de Código de Producto & SKU Intuitivo
                    </div>
                    <span style={{ 
                      background: 'rgba(139, 92, 246, 0.15)', 
                      color: '#c4b5fd', 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      border: '1px solid rgba(139, 92, 246, 0.3)' 
                    }}>
                      ✨ Generación Profesional Intuitiva
                    </span>
                  </div>

                  {/* TARJETA DE VISTA PREVIA DEL CÓDIGO DE BARRAS */}
                  <div style={{ 
                    background: '#090d16', 
                    borderRadius: '14px', 
                    padding: '16px 20px', 
                    marginBottom: '16px',
                    border: '1px dashed rgba(167, 139, 250, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px'
                  }}>
                    {/* BARRAS SIMULADAS DE CÓDIGO */}
                    <div style={{ display: 'flex', gap: '3px', height: '36px', alignItems: 'center' }}>
                      {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3].map((w, i) => (
                        <div key={i} style={{ width: `${w * 2}px`, height: '100%', background: i % 2 === 0 ? '#f3e8ff' : '#090d16', borderRadius: '1px' }}></div>
                      ))}
                    </div>
                    <div style={{ 
                      fontFamily: 'Consolas, Monaco, monospace', 
                      fontSize: '1.4rem', 
                      fontWeight: 900, 
                      letterSpacing: '0.15em', 
                      color: '#fbbf24',
                      textShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                    }}>
                      {form.barcode || 'MB-01-0001'}
                    </div>
                    
                    {/* DESGLOSE DE LAS SIGLAS */}
                    {(() => {
                      const parts = (form.barcode || '').split('-');
                      const prefix = parts[0] || 'MB';
                      const catInitial = prefix.charAt(0) || 'M';
                      const subInitial = prefix.charAt(1) || 'B';
                      const variant = parts.length > 2 ? parts[1] : '01';
                      const seq = parts.length > 2 ? parts[2] : (parts[1] || '0001');

                      return (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                          <span style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', padding: '2px 8px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 800 }}>
                            Rubro: <strong>{catInitial}</strong>
                          </span>
                          <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 800 }}>
                            Tipo: <strong>{subInitial}</strong>
                          </span>
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 800 }}>
                            Variante: <strong>{variant}</strong>
                          </span>
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 800 }}>
                            Secuencia: <strong>{seq}</strong>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* GRILLA DE CONTROLES: VARIANTE Y CAMPO EDITABLE */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Variante / Modelo</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={form.variantCode || '01'}
                        onChange={e => {
                          const newVar = e.target.value;
                          const currentCat = form.categoryMode === 'CUSTOM' ? form.customCategory : form.category;
                          const auto = generateAutoCode(currentCat || 'Bijouterie', products, form.name, newVar);
                          setForm(f => ({ ...f, variantCode: newVar, barcode: auto }));
                        }}
                        placeholder="01"
                        style={{ textAlign: 'center', fontWeight: 800, fontFamily: 'monospace' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>Código de Producto (Modificable)</label>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const currentCat = form.categoryMode === 'CUSTOM' ? form.customCategory : form.category;
                            const auto = generateAutoCode(currentCat || 'Bijouterie', products, form.name, form.variantCode || '01');
                            setForm(f => ({ ...f, barcode: auto }));
                          }}
                          style={{ padding: '2px 10px', fontSize: '0.74rem', borderRadius: 'var(--radius-full)', color: '#a78bfa', fontWeight: 800, background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                        >
                          ⚡ Regenerar Intuitivo
                        </button>
                      </div>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff', borderColor: duplicateProd ? '#ef4444' : 'rgba(139, 92, 246, 0.4)' }} 
                        value={form.barcode} 
                        onChange={e => setForm({ ...form, barcode: e.target.value.toUpperCase() })} 
                        placeholder="Ej. MB-01-0001 (Edite libremente)" 
                      />
                    </div>
                  </div>

                  {duplicateProd && (
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      border: '1px solid rgba(239, 68, 68, 0.4)', 
                      borderRadius: '12px', 
                      padding: '10px 14px', 
                      marginBottom: '12px',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px' 
                    }}>
                      <div style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} />
                        <span>¡Atención! El código <strong>{form.barcode.toUpperCase()}</strong> ya pertenece a: <strong>"{duplicateProd.name}"</strong>.</span>
                      </div>

                      {suggestedAlternativeCode && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setForm({ ...form, barcode: suggestedAlternativeCode })}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            alignSelf: 'flex-start'
                          }}
                        >
                          💡 Usar código disponible sugerido: <strong>{suggestedAlternativeCode}</strong>
                        </button>
                      )}
                    </div>
                  )}

                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    💡 <strong>Formato Profesional Intuitivo:</strong> Inicial Rubro + Inicial Tipo + Variante + Secuencia (ej: <strong>MB-01-0001</strong> = <strong>M</strong>arroquinería <strong>B</strong>andolera). Modificable a gusto.
                  </small>
                </div>

                {/* BLOQUE 3: PRECIOS Y MARGEN DE GANANCIA */}
                <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: 'var(--glass-border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} /> 3. Precios y Márgenes de Ganancia
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 800 }}>Precio Costo ($)</label>
                      <input 
                        type="number" 
                        step="any" 
                        min="0" 
                        className="form-control" 
                        value={form.costPrice} 
                        onChange={e => setForm({ ...form, costPrice: e.target.value })} 
                        placeholder="Ej. 9500" 
                        style={{ fontSize: '1.05rem', fontWeight: 800 }} 
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>Precio Venta Público ($) *</label>
                      <input 
                        type="number" 
                        step="any" 
                        min="0" 
                        className="form-control" 
                        required
                        value={form.sellPrice} 
                        onChange={e => setForm({ ...form, sellPrice: e.target.value })} 
                        placeholder="Ej. 21900" 
                        style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} 
                      />
                    </div>
                  </div>

                  {/* CALCULADORA DE MARGEN EN TIEMPO REAL */}
                  {(() => {
                    const cost = parseFloat(form.costPrice) || 0;
                    const sell = parseFloat(form.sellPrice) || 0;
                    const profit = sell - cost;
                    const marginPercent = cost > 0 ? Math.round((profit / cost) * 100) : 0;
                    const isPositive = profit >= 0;

                    return (
                      <div style={{ 
                        background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                        border: isPositive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
                        borderRadius: '12px', 
                        padding: '12px 16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingUp size={18} style={{ color: isPositive ? '#10b981' : '#ef4444' }} />
                          <span style={{ fontSize: '0.88rem', color: isPositive ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                            Ganancia estimada por unidad: <strong>{formatPrice(profit)}</strong>
                          </span>
                        </div>
                        <span style={{ 
                          background: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                          color: isPositive ? '#34d399' : '#f87171', 
                          padding: '4px 12px', 
                          borderRadius: 'var(--radius-full)', 
                          fontSize: '0.82rem', 
                          fontWeight: 900 
                        }}>
                          {marginPercent}% Margen
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* BLOQUE 4: CANTIDAD Y CONTROL DE STOCK (UBICADO DEBAJO DE PRECIOS) */}
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '2px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.12)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} /> 4. Cantidad de Productos y Control de Stock
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      
                      {/* CAMPO DE CANTIDAD DE STOCK */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📦 Cantidad de Stock (Unidades) *
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                              const current = parseInt(form.stock, 10) || 0;
                              setForm({ ...form, stock: String(Math.max(0, current - 1)) });
                            }}
                            style={{ width: '40px', height: '40px', borderRadius: '10px', fontWeight: 900, fontSize: '1.2rem', padding: 0 }}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0" 
                            className="form-control" 
                            required 
                            value={form.stock} 
                            onChange={e => setForm({ ...form, stock: e.target.value })} 
                            placeholder="Ej. 1, 5, 10..." 
                            style={{ flex: 1, fontSize: '1.25rem', fontWeight: 900, borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(15, 23, 42, 0.85)', textAlign: 'center' }} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                              const current = parseInt(form.stock, 10) || 0;
                              setForm({ ...form, stock: String(current + 1) });
                            }}
                            style={{ width: '40px', height: '40px', borderRadius: '10px', fontWeight: 900, fontSize: '1.2rem', padding: 0, color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* STOCK MÍNIMO */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={15} style={{ color: '#f59e0b' }} /> Stock Mínimo (Alerta)
                        </label>
                        <input 
                          type="number" 
                          min="0" 
                          className="form-control" 
                          value={form.minStock} 
                          onChange={e => setForm({ ...form, minStock: e.target.value })} 
                          placeholder="Ej. 3" 
                          style={{ fontSize: '1.05rem', fontWeight: 800 }} 
                        />
                      </div>
                    </div>

                    {/* FICHAS DE CARGA RÁPIDA DE UNIDADES */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>
                        ⚡ Carga Rápida de Unidades de Entrada:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[1, 5, 10, 20, 50, 100].map(addVal => (
                          <button
                            key={addVal}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              const current = parseInt(form.stock, 10) || 0;
                              setForm({ ...form, stock: String(current + addVal) });
                            }}
                            style={{ 
                              borderRadius: 'var(--radius-full)', 
                              fontWeight: 800, 
                              fontSize: '0.8rem',
                              padding: '4px 10px',
                              borderColor: 'rgba(245, 158, 11, 0.35)',
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.12)'
                            }}
                          >
                            +{addVal} u.
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PIE DE PÁGINA / ACCIONES - SIEMPRE VISIBLE FIJO EN EL PIE */}
              <div className="modal-footer" style={{ padding: '18px 24px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)} 
                  style={{ borderRadius: 'var(--radius-full)', padding: '10px 20px', fontWeight: 700 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ 
                    borderRadius: 'var(--radius-full)', 
                    padding: '12px 28px', 
                    fontWeight: 900, 
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={18} /> {editingProd ? 'Guardar Modificaciones' : 'Guardar Nuevo Producto'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
