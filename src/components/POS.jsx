import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateAutoCode } from '../lib/utils';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  DollarSign,
  CreditCard,
  Smartphone,
  FileText,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Package,
  Printer,
  Sparkles
} from 'lucide-react';

export function POS() {
  const {
    products,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    processSale,
    cashSession,
    sales,
    categories = [],
    brands = [],
    addProduct
  } = useData();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Formulario de Producto Nuevo Rápido en POS
  const [showNewProdModal, setShowNewProdModal] = useState(false);
  const [newProdForm, setNewProdForm] = useState({
    name: '',
    brand: 'Sin Marca',
    category: 'General',
    sellPrice: '',
    stock: '1',
    barcode: '',
    variantCode: '01',
    autoAddToCart: true
  });

  // Formulario de Cliente Nuevo Rápido en POS
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custDni, setCustDni] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Formulario de Edición de Cliente Seleccionado en POS
  const [showEditCustModal, setShowEditCustModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', dni: '', address: '', phone: '' });

  // Modal de Ticket / Confirmación de Venta
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Objeto de Cliente Seleccionado
  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filtrado de Productos
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return products.filter(p => selectedCategory === 'ALL' || p.category === selectedCategory || p.category.startsWith(selectedCategory));
    }
    const cleanTerm = term.replace(/[^a-z0-9]/g, '');
    return products.filter(p => {
      const codeLower = (p.barcode || '').toLowerCase();
      const cleanCode = codeLower.replace(/[^a-z0-9]/g, '');

      const matchCode = codeLower.includes(term) || (cleanCode && cleanCode.includes(cleanTerm));
      const matchName = p.name.toLowerCase().includes(term);
      const matchCategory = p.category.toLowerCase().includes(term);
      const matchBrand = p.brand && p.brand.toLowerCase().includes(term);

      const matchSearch = matchCode || matchName || matchCategory || matchBrand;
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory || p.category.startsWith(selectedCategory);
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const term = search.trim().toLowerCase();
      const cleanTerm = term.replace(/[^a-z0-9]/g, '');
      const exactMatch = products.find(p => {
        const codeLower = (p.barcode || '').toLowerCase();
        const cleanCode = codeLower.replace(/[^a-z0-9]/g, '');
        return codeLower === term || (cleanCode && cleanCode === cleanTerm);
      });
      if (exactMatch) {
        if (exactMatch.stock > 0) {
          addToCart(exactMatch);
          setSearch('');
          setErrorMsg('');
        } else {
          setErrorMsg(`El producto "${exactMatch.name}" (${exactMatch.barcode}) se encuentra AGOTADO.`);
        }
      }
    }
  };

  // Manejo del Carrito de Ventas
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItemFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearAllCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  // Cálculos de Total y Recargo del 10% en Cta Cte
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
  }, [cart]);

  const interestAmount = paymentMethod === 'Cuenta Corriente' ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + interestAmount;
  const formatPrice = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

  // CREAR PRODUCTO NUEVO CON STOCK DESDE POS
  const handleCreateProductInPOS = async (e) => {
    e.preventDefault();
    if (!newProdForm.name.trim()) {
      setErrorMsg('Por favor ingrese el Nombre del Producto.');
      return;
    }
    if (!newProdForm.sellPrice || isNaN(parseFloat(newProdForm.sellPrice))) {
      setErrorMsg('Por favor ingrese un Precio de Venta válido.');
      return;
    }

    let finalBarcode = (newProdForm.barcode || '').trim();
    if (!finalBarcode || finalBarcode.startsWith('prod-')) {
      finalBarcode = generateAutoCode(newProdForm.category || 'General', products, newProdForm.name, newProdForm.variantCode || '01');
    }

    const payload = {
      name: newProdForm.name.trim(),
      brand: (newProdForm.brand || 'Sin Marca').trim(),
      category: newProdForm.category || 'General',
      sellPrice: parseFloat(newProdForm.sellPrice),
      costPrice: 0,
      stock: !isNaN(parseInt(newProdForm.stock, 10)) ? Math.max(0, parseInt(newProdForm.stock, 10)) : 1,
      minStock: 3,
      barcode: finalBarcode
    };

    try {
      const createdProd = await addProduct(payload);
      if (newProdForm.autoAddToCart && createdProd && createdProd.stock > 0) {
        addToCart(createdProd);
      }
      setShowNewProdModal(false);
      setNewProdForm({
        name: '',
        brand: 'Sin Marca',
        category: 'General',
        sellPrice: '',
        stock: '1',
        barcode: '',
        autoAddToCart: true
      });
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error al registrar producto: ' + err.message);
    }
  };

  // AGREGAR CLIENTE NUEVO DESDE POS
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !custDni.trim() || !custAddress.trim() || !custPhone.trim()) {
      setErrorMsg('Para registrar en Cuenta Corriente debe ingresar Nombre, DNI, Domicilio y Teléfono.');
      return;
    }

    try {
      const newCust = await addCustomer({
        name: custName,
        dni: custDni,
        address: custAddress,
        phone: custPhone
      });

      setSelectedCustomerId(newCust.id);
      setShowNewCustModal(false);
      setCustName('');
      setCustDni('');
      setCustAddress('');
      setCustPhone('');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error al guardar cliente: ' + err.message);
    }
  };

  // EDITAR CLIENTE SELECCIONADO DESDE POS
  const openEditCustomerModal = () => {
    if (!selectedCustomerObj) return;
    setEditForm({
      name: selectedCustomerObj.name,
      dni: selectedCustomerObj.dni || '',
      address: selectedCustomerObj.address || '',
      phone: selectedCustomerObj.phone || ''
    });
    setShowEditCustModal(true);
  };

  const handleSaveEditCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomerObj || !editForm.name.trim()) return;

    try {
      await updateCustomer(selectedCustomerObj.id, editForm);
      setShowEditCustModal(false);
    } catch (err) {
      setErrorMsg('Error al actualizar cliente: ' + err.message);
    }
  };

  const handleDeleteSelectedCustomer = async () => {
    if (selectedCustomerObj && window.confirm(`¿Eliminar al cliente "${selectedCustomerObj.name}"?`)) {
      try {
        await deleteCustomer(selectedCustomerObj.id);
        setSelectedCustomerId('');
      } catch (err) {
        setErrorMsg(err.message);
      }
    }
  };

  const handleCheckout = () => {
    setErrorMsg('');
    if (!cashSession || cashSession.status !== 'open') {
      return setErrorMsg('La caja diaria se encuentra CERRADA. Abra la caja en la pestaña "Caja Diaria" para cobrar.');
    }
    if (cart.length === 0) return setErrorMsg('El carrito de compras está vacío.');
    if (paymentMethod === 'Cuenta Corriente' && !selectedCustomerId) {
      return setErrorMsg('Debe seleccionar o registrar un cliente válido para cobrar en Cuenta Corriente.');
    }

    try {
      const saleResult = processSale({
        items: cart,
        paymentMethod,
        customerId: selectedCustomerId
      });
      setCompletedSale(saleResult);
      clearAllCart();
      setSelectedCustomerId('');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la venta.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 20px' }}>

      {/* ALERTA DE CAJA CERRADA */}
      {cashSession?.status !== 'open' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
        }}>
          <AlertTriangle size={24} />
          <div>
            <strong style={{ fontSize: '1rem' }}>Caja Diaria Cerrada:</strong> Abra el turno en la pestaña <strong>"Caja Diaria"</strong> para poder cobrar ventas.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '24px', alignItems: 'start' }}>

        {/* COLUMNA IZQUIERDA: CATÁLOGO Y BUSCADOR */}
        <div>

          {/* BUSCADOR Y CHIPS DE CATEGORÍA */}
          <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '48px', fontSize: '1.05rem', borderRadius: 'var(--radius-full)' }}
                  placeholder="🔍 Buscar por Código (ej. MB-01-0001), Nombre, Marca o Categoría..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const initCategory = selectedCategory !== 'ALL' ? selectedCategory : 'General';
                  const autoCode = generateAutoCode(initCategory, products);
                  setNewProdForm(f => ({ ...f, name: search, category: initCategory, barcode: autoCode }));
                  setShowNewProdModal(true);
                }}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> + Nuevo Producto
              </button>
            </div>

            {/* CATEGORY PILLS */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['ALL', 'Marroquinería', 'Ropa Interior', 'Bijouterie', 'Regalería'].map(cat => (
                <button
                  key={cat}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px', fontWeight: 700 }}
                >
                  {cat === 'ALL' ? '✨ Todos los Productos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* GRID DE PRODUCTOS */}
          {filteredProducts.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--color-primary)' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '6px', fontWeight: 800 }}>No se encontraron productos</h4>
              <p style={{ fontSize: '0.88rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
                No hay ítems en catálogo que coincidan con la búsqueda "{search}".
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setNewProdForm(f => ({ ...f, name: search }));
                  setShowNewProdModal(true);
                }}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 900, padding: '10px 22px' }}
              >
                <Plus size={18} /> Registrar "{search || 'Nuevo Producto'}" con Stock
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '18px' }}>
              {filteredProducts.map(p => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= p.minStock && !isOutOfStock;
                return (
                  <div key={p.id} className="product-card" style={{ opacity: isOutOfStock ? 0.65 : 1 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
                          {p.category.split(' - ')[1] || p.category}
                        </span>
                        <span className={`badge ${isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'}`}>
                          {isOutOfStock ? 'Agotado' : `Stock: ${p.stock}`}
                        </span>
                      </div>

                      <div style={{ marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(236, 72, 153, 0.15)',
                          color: '#ec4899',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          🏷️ {p.brand || 'Sin Marca'}
                        </span>
                        {p.barcode && (
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            fontFamily: 'monospace'
                          }}>
                            🔑 {p.barcode}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', lineHeight: '1.3' }}>
                        {p.name}
                      </h4>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        {formatPrice(p.sellPrice)}
                      </div>
                      <div className="stock-level-bar" style={{ marginBottom: '14px' }} title={`Stock disponible: ${p.stock}`}>
                        <div
                          className="stock-level-fill"
                          style={{
                            width: isOutOfStock ? '0%' : `${Math.min(100, Math.max(15, (p.stock / (p.minStock * 3)) * 100))}%`,
                            background: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981'
                          }}
                        ></div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '9px 14px' }}
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock}
                      >
                        <Plus size={16} /> Agregar al Carrito
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: CARRITO LATERAL DE COMPRAS */}
        <div>
          <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: 'var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
                Carrito de Ventas ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h3>
              {cart.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={clearAllCart} style={{ color: '#ef4444', borderRadius: 'var(--radius-full)' }}>
                  <Trash2 size={14} /> Vaciar
                </button>)
              }
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* LISTA DE ITEMS DEL CARRITO */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {cart.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0', fontSize: '0.92rem' }}>
                  🛒 Carrito vacío.<br />Haz clic en <strong>"+ Agregar al Carrito"</strong> para comenzar.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                        {item.name} {item.barcode && <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700 }}>({item.barcode})</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatPrice(item.sellPrice)} c/u × {item.quantity} = <strong style={{ color: '#fff' }}>{formatPrice(item.sellPrice * item.quantity)}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="btn btn-secondary btn-icon" onClick={() => updateCartQty(item.id, -1)} style={{ padding: '4px 8px' }}><Minus size={13} /></button>
                      <span style={{ fontWeight: 900, width: '24px', textAlign: 'center', fontSize: '0.95rem' }}>{item.quantity}</span>
                      <button className="btn btn-secondary btn-icon" onClick={() => updateCartQty(item.id, 1)} style={{ padding: '4px 8px' }}><Plus size={13} /></button>
                      <button className="btn btn-secondary btn-icon" onClick={() => removeItemFromCart(item.id)} style={{ padding: '6px', color: '#ef4444', marginLeft: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MÉTODO DE PAGO */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Forma de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button className={`btn btn-sm ${paymentMethod === 'Efectivo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentMethod('Efectivo')}>
                  <DollarSign size={15} /> Efectivo
                </button>
                <button className={`btn btn-sm ${paymentMethod === 'Transferencia' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentMethod('Transferencia')}>
                  <Smartphone size={15} /> Transferencia
                </button>
                <button className={`btn btn-sm ${paymentMethod === 'Tarjeta' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentMethod('Tarjeta')}>
                  <CreditCard size={15} /> Tarjeta
                </button>
                <button className={`btn btn-sm ${paymentMethod === 'Cuenta Corriente' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentMethod('Cuenta Corriente')}>
                  <FileText size={15} /> Cta. Corriente
                </button>
              </div>
            </div>

            {/* CUENTA CORRIENTE SELECCIÓN DE CLIENTE */}
            {paymentMethod === 'Cuenta Corriente' && (
              <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary)' }}>CLIENTE CUENTA CORRIENTE</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewCustModal(true)} style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: 'var(--radius-full)' }}>
                    <UserPlus size={13} /> + Nuevo Cliente
                  </button>
                </div>

                <select className="form-control" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} style={{ fontSize: '0.88rem', marginBottom: selectedCustomerObj ? '12px' : '0' }}>
                  <option value="">-- Seleccionar Cliente Registrado --</option>
                  {customers.filter(c => c.id !== 'cust-ocasional').map(c => (
                    <option key={c.id} value={c.id}>{c.name} (DNI: {c.dni})</option>
                  ))}
                </select>

                {selectedCustomerObj && (
                  <div style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{selectedCustomerObj.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>DNI: {selectedCustomerObj.dni || '-'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={openEditCustomerModal} style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={handleDeleteSelectedCustomer} style={{ padding: '4px 8px', color: '#ef4444' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {selectedCustomerObj.address || '-'} | 📞 {selectedCustomerObj.phone || '-'}</div>
                  </div>
                )}

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dotted rgba(236,72,153,0.3)', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', fontWeight: 800 }}>
                    <span>Recargo 10% Cta. Cte. (30 días):</span>
                    <span>+ {formatPrice(interestAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TOTALES */}
            <div style={{ borderTop: 'var(--glass-border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <span>Subtotal:</span><span>{formatPrice(subtotal)}</span>
              </div>
              {paymentMethod === 'Cuenta Corriente' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '8px', fontSize: '0.92rem' }}>
                  <span>Recargo Cta Cte (+10%):</span><span>+ {formatPrice(interestAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>
                <span>Total a Cobrar:</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatPrice(total)}</span>
              </div>
            </div>

            {/* BOTÓN COBRAR */}
            <button
              className={`btn ${cashSession?.status === 'open' ? 'btn-success' : 'btn-secondary'}`}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 800, borderRadius: 'var(--radius-sm)' }}
              onClick={handleCheckout}
              disabled={cart.length === 0 || cashSession?.status !== 'open'}
            >
              <CheckCircle size={20} /> {cashSession?.status !== 'open' ? '🔒 Caja Cerrada' : 'Confirmar Venta y Cobrar'}
            </button>

          </div>
        </div>

      </div>

      {/* MODAL CLIENTE NUEVO RÁPIDO */}
      {showNewCustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registrar Cliente para Cta. Cte.</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewCustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleQuickAddCustomer}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Nombre y Apellido *</label><input type="text" className="form-control" required value={custName} onChange={e => setCustName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">DNI *</label><input type="text" className="form-control" required value={custDni} onChange={e => setCustDni(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Domicilio *</label><input type="text" className="form-control" required value={custAddress} onChange={e => setCustAddress(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Teléfono *</label><input type="tel" className="form-control" required value={custPhone} onChange={e => setCustPhone(e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCustModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar y Seleccionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TICKET / COMPROBANTE TÉRMICO */}
      {completedSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', textAlign: 'center' }}>
            <div className="modal-header" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <h3 style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={22} /> ¡Venta Registrada con Éxito!
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setCompletedSale(null)}>✕</button>
            </div>
            <div className="modal-body">

              <div className="receipt-box">
                <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>REGALERÍA TINA</h3>
                  <p style={{ fontSize: '0.75rem' }}>Gestor de Ventas & Cuentas Corrientes</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Ticket #{completedSale.id}</p>
                  <p style={{ fontSize: '0.75rem' }}>Fecha: {new Date(completedSale.created_at).toLocaleString()}</p>
                  <p style={{ fontSize: '0.75rem' }}>Atendido por: {completedSale.userName}</p>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                    <span>CANT / PRODUCTO</span>
                    <span>TOTAL</span>
                  </div>
                  {completedSale.items && completedSale.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span>${it.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Forma de Pago:</span>
                    <strong>{completedSale.paymentMethod}</strong>
                  </div>
                  {completedSale.interestAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Recargo Cta Cte (+10%):</span>
                      <span>+ ${completedSale.interestAmount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, marginTop: '6px' }}>
                    <span>TOTAL:</span>
                    <span>${completedSale.total}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                  ¡Muchas gracias por su compra!
                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir Comprobante
              </button>
              <button className="btn btn-primary" onClick={() => setCompletedSale(null)}>
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL NUEVO PRODUCTO RÁPIDO EN POS */}
      {showNewProdModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.15))', padding: '20px 24px' }}>
              <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', margin: 0 }}>
                <Package size={22} style={{ color: 'var(--color-primary)' }} /> Alta Rápida de Producto con Stock
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewProdModal(false)} style={{ borderRadius: '50%', padding: '6px' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProductInPOS}>
              <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Nombre del Producto *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newProdForm.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setNewProdForm(f => {
                        const autoCode = generateAutoCode(f.category || 'General', products, newName, f.variantCode || '01');
                        return { ...f, name: newName, barcode: autoCode };
                      });
                    }}
                    placeholder="Ej. Cartera Bandolera Chica Eco-cuero"
                    style={{ fontWeight: 700, fontSize: '1rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Categoría / Rubro</label>
                    <select
                      className="form-control"
                      value={newProdForm.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        const autoCode = generateAutoCode(newCat, products, newProdForm.name, newProdForm.variantCode || '01');
                        setNewProdForm(f => ({ ...f, category: newCat, barcode: autoCode }));
                      }}
                    >
                      <option value="General">General</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Marca</label>
                    <select
                      className="form-control"
                      value={newProdForm.brand}
                      onChange={e => setNewProdForm({ ...newProdForm, brand: e.target.value })}
                    >
                      <option value="Sin Marca">Sin Marca</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Precio de Venta ($) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-control"
                      required
                      value={newProdForm.sellPrice}
                      onChange={e => setNewProdForm({ ...newProdForm, sellPrice: e.target.value })}
                      placeholder="Ej. 12500"
                      style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#f59e0b', fontWeight: 800 }}>📦 Cantidad Stock *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      required
                      value={newProdForm.stock}
                      onChange={e => setNewProdForm({ ...newProdForm, stock: e.target.value })}
                      placeholder="Ej. 1, 5, 10..."
                      style={{ fontWeight: 900, fontSize: '1.1rem', borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.05)' }}
                    />
                  </div>
                </div>

                {/* BOTONES RÁPIDOS DE CANTIDAD EN POS */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                    ⚡ Suma Rápida de Stock:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[1, 5, 10, 20, 50].map(addVal => (
                      <button
                        key={addVal}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const current = parseInt(newProdForm.stock, 10) || 0;
                          setNewProdForm({ ...newProdForm, stock: String(current + addVal) });
                        }}
                        style={{ borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.78rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)' }}
                      >
                        +{addVal} u.
                      </button>
                    ))}
                  </div>
                </div>

                {/* PANEL CÓDIGO DE BARRAS INTUITIVO EN POS */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#a78bfa', margin: 0, fontSize: '0.85rem' }}>
                      🏷️ Código de Producto / SKU Intuitivo
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const auto = generateAutoCode(newProdForm.category || 'General', products, newProdForm.name, newProdForm.variantCode || '01');
                        setNewProdForm(f => ({ ...f, barcode: auto }));
                      }}
                      style={{ padding: '2px 10px', fontSize: '0.74rem', borderRadius: 'var(--radius-full)', color: '#a78bfa', fontWeight: 800, background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                    >
                      ⚡ Regenerar Intuitivo
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 2px 0' }}>Variante</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProdForm.variantCode || '01'}
                        onChange={e => {
                          const newVar = e.target.value;
                          const auto = generateAutoCode(newProdForm.category || 'General', products, newProdForm.name, newVar);
                          setNewProdForm(f => ({ ...f, variantCode: newVar, barcode: auto }));
                        }}
                        placeholder="01"
                        style={{ textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 2px 0' }}>Código de Producto (Modificable)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProdForm.barcode}
                        onChange={e => setNewProdForm({ ...newProdForm, barcode: e.target.value })}
                        placeholder="Ej. MB-01-0001"
                        style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}
                      />
                    </div>
                  </div>

                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                    💡 Formato profesional (ej: <strong>MB-01-0001</strong> para <strong>M</strong>arroquinería <strong>B</strong>andolera). Modificable a gusto.
                  </small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(236, 72, 153, 0.08)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                  <input
                    type="checkbox"
                    id="autoAdd"
                    checked={newProdForm.autoAddToCart}
                    onChange={e => setNewProdForm({ ...newProdForm, autoAddToCart: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor="autoAdd" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                    🛒 Agregar 1 unidad de este producto al carrito actual al guardar
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '18px 24px', background: 'var(--bg-secondary)', borderTop: 'var(--glass-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewProdModal(false)} style={{ borderRadius: 'var(--radius-full)' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', fontWeight: 900, padding: '10px 24px' }}>
                  <Sparkles size={16} /> Guardar Producto & Cargar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
