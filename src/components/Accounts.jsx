import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  FileText,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Plus,
  Printer,
  Filter,
  Receipt
} from 'lucide-react';

export function Accounts() {
  const { customers, sales, payments, addCustomer, updateCustomer, deleteCustomer, addPayment, overdueCustomers } = useData();

  const [search, setSearch] = useState('');

  // Modales
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [custForm, setCustForm] = useState({ name: '', dni: '', address: '', phone: '' });

  const [paymentCust, setPaymentCust] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [payNotes, setPayNotes] = useState('');

  const [detailCust, setDetailCust] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [printSheetCust, setPrintSheetCust] = useState(null);

  // Filtrar clientes (excluir cliente ocasional)
  const activeCustomers = useMemo(() => {
    return customers.filter(c => c.id !== 'cust-ocasional');
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return activeCustomers.filter(c => {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
        (c.dni && c.dni.includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));
    });
  }, [activeCustomers, search]);

  const totalDebt = useMemo(() => {
    return activeCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [activeCustomers]);

  const formatPrice = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  // Formato Seguro con Fecha y Hora Exacta
  const formatDateTime = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      const dateStr = d.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} - ${timeStr} hs`;
    } catch {
      return '-';
    }
  };

  // Helper para Filtrar Movimientos por Período (Hoy, Semana, Mes, Todos)
  const isDateInFilter = (dateVal, filter) => {
    if (filter === 'all' || !dateVal) return true;
    const d = new Date(dateVal).getTime();
    if (isNaN(d)) return false;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    if (filter === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return d >= todayStart.getTime();
    } else if (filter === 'week') {
      return d >= (now - 7 * dayMs);
    } else if (filter === 'month') {
      return d >= (now - 30 * dayMs);
    }
    return true;
  };

  const isCustomerLate = (cust) => {
    if (!cust.balance || cust.balance <= 0) return false;
    return overdueCustomers.some(o => o.id === cust.id);
  };

  // Abrir Modal de Cliente (Crear / Editar)
  const openCustomerModal = (cust = null) => {
    if (cust) {
      setEditingCust(cust);
      setCustForm({ name: cust.name, dni: cust.dni || '', address: cust.address || '', phone: cust.phone || '' });
    } else {
      setEditingCust(null);
      setCustForm({ name: '', dni: '', address: '', phone: '' });
    }
    setShowCustModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!custForm.name.trim()) return;

    if (editingCust) {
      await updateCustomer(editingCust.id, custForm);
      if (detailCust && detailCust.id === editingCust.id) {
        setDetailCust({ ...detailCust, ...custForm });
      }
    } else {
      await addCustomer(custForm);
    }
    setShowCustModal(false);
  };

  const handleDelete = async (cust) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${cust.name}"?`)) {
      await deleteCustomer(cust.id);
      if (detailCust && detailCust.id === cust.id) setDetailCust(null);
    }
  };

  const openPaymentModal = (cust) => {
    setPaymentCust(cust);
    setPayAmount('');
    setPayMethod('Efectivo');
    setPayNotes('');
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentCust || !payAmount || parseFloat(payAmount) <= 0) return;

    await addPayment(paymentCust.id, payAmount, payMethod, payNotes);

    if (detailCust && detailCust.id === paymentCust.id) {
      const updatedBalance = Math.max(0, (detailCust.balance || 0) - parseFloat(payAmount));
      setDetailCust({ ...detailCust, balance: updatedBalance });
    }
    setPaymentCust(null);
  };

  // Filtrado de Movimientos del Cliente Activo
  const filteredSalesForDetail = useMemo(() => {
    if (!detailCust) return [];
    return sales.filter(s => s.customerId === detailCust.id && s.paymentMethod === 'Cuenta Corriente' && isDateInFilter(s.created_at, timeFilter));
  }, [sales, detailCust, timeFilter]);

  const filteredPaymentsForDetail = useMemo(() => {
    if (!detailCust) return [];
    return payments.filter(p => p.customerId === detailCust.id && isDateInFilter(p.created_at, timeFilter));
  }, [payments, detailCust, timeFilter]);

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 20px' }}>

      {/* HEADER TARJETAS DE ESTADÍSTICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '24px' }}>

        <div className="stat-card">
          <div className="stat-icon pink"><DollarSign size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deuda Total Registrada</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(totalDebt)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><Users size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Clientes en Cta. Corriente</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{activeCustomers.length} Clientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><Clock size={26} /></div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deudas Vencidas (&gt; 30 días)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>
              {overdueCustomers.length} Alerta{overdueCustomers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

      </div>

      {/* BARRA DE ACCIÓN Y BUSCADOR */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '48px', borderRadius: 'var(--radius-full)' }}
            placeholder="Buscar cliente por nombre, DNI, teléfono o dirección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => openCustomerModal()} style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
          <UserPlus size={18} /> + Nuevo Cliente
        </button>
      </div>

      {/* TABLA DE CLIENTES EN CUENTA CORRIENTE */}
      <div className="table-responsive glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Cliente / DNI</th>
              <th>Contacto</th>
              <th>Domicilio</th>
              <th>Estado de Deuda</th>
              <th>Saldo Pendiente</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron clientes registrados con cuentas corrientes.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => {
                const isLate = isCustomerLate(cust);
                const hasDebt = cust.balance > 0;
                return (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{cust.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>DNI: {cust.dni || '-'}</div>
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>📞 {cust.phone || '-'}</td>
                    <td style={{ fontSize: '0.88rem' }}>📍 {cust.address || '-'}</td>
                    <td>
                      {isLate ? (
                        <span className="badge badge-danger">⚠️ Vencido (&gt; 30 días)</span>
                      ) : hasDebt ? (
                        <span className="badge badge-warning">⏳ Pendiente Al Día</span>
                      ) : (
                        <span className="badge badge-success">✓ Sin Deuda</span>
                      )}
                    </td>
                    <td style={{ fontSize: '1.15rem', fontWeight: 900, color: hasDebt ? 'var(--color-primary)' : 'var(--color-success)' }}>
                      {formatPrice(cust.balance || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => openPaymentModal(cust)} disabled={!hasDebt} title="Registrar Pago / Entrega">
                          <DollarSign size={15} /> Abonar
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setDetailCust(cust); setTimeFilter('all'); }} title="Ver Movimientos y Detalle">
                          <Eye size={15} /> Historial
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setPrintSheetCust(cust)} title="Imprimir / Exportar Ficha">
                          <Printer size={15} /> Ficha
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openCustomerModal(cust)} title="Editar Datos">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(cust)} style={{ color: '#ef4444' }} title="Eliminar Cliente">
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

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {showCustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCust ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Nombre y Apellido *</label><input type="text" className="form-control" required value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">DNI *</label><input type="text" className="form-control" required value={custForm.dni} onChange={e => setCustForm({ ...custForm, dni: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Domicilio *</label><input type="text" className="form-control" required value={custForm.address} onChange={e => setCustForm({ ...custForm, address: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Teléfono *</label><input type="tel" className="form-control" required value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO / ABONO */}
      {paymentCust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Registrar Entrega de Dinero / Pago</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setPaymentCust(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: 'var(--glass-border)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{paymentCust.name}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Saldo Actual Pendiente: <strong style={{ color: 'var(--color-primary)' }}>{formatPrice(paymentCust.balance || 0)}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monto a Entregar / Abonar ($) *</label>
                  <input type="number" step="any" min="1" max={paymentCust.balance || undefined} className="form-control" required value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Ej. 5000" />
                </div>

                <div className="form-group">
                  <label className="form-label">Medio de Pago</label>
                  <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Transferencia">📱 Transferencia bancaria / MP</option>
                    <option value="Tarjeta">💳 Tarjeta de Débito / Crédito</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas u Observaciones (Opcional)</label>
                  <input type="text" className="form-control" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Ej. Pago parcial de cartera" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentCust(null)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Confirmar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE MOVIMIENTOS E HISTORIAL (DÍA, SEMANA, MES) */}
      {detailCust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} style={{ color: 'var(--color-primary)' }} />
                Historial Detallado: {detailCust.name}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetailCust(null)}>✕</button>
            </div>

            <div className="modal-body">

              {/* ENCABEZADO DATOS CLIENTE Y SALDO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '20px', background: 'var(--bg-primary)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: 'var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{detailCust.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    🪪 DNI: <strong>{detailCust.dni || '-'}</strong> | 📍 {detailCust.address || '-'} | 📞 {detailCust.phone || '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Saldo Deudor Pendiente</div>
                  <div style={{ color: detailCust.balance > 0 ? 'var(--color-primary)' : 'var(--color-success)', fontSize: '1.4rem', fontWeight: 900 }}>
                    {formatPrice(detailCust.balance || 0)}
                  </div>
                </div>
              </div>

              {/* FILTROS TEMPORALES: DÍA, SEMANA, MES, TODOS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: 'var(--glass-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={16} /> Filtrar Movimientos:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn btn-sm ${timeFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTimeFilter('today')}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    📅 Hoy (Día)
                  </button>
                  <button
                    className={`btn btn-sm ${timeFilter === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTimeFilter('week')}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    🗓️ Esta Semana (7 días)
                  </button>
                  <button
                    className={`btn btn-sm ${timeFilter === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTimeFilter('month')}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    📆 Este Mes (30 días)
                  </button>
                  <button
                    className={`btn btn-sm ${timeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTimeFilter('all')}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    📜 Todos
                  </button>
                </div>
              </div>

              {/* TABLA DE COMPRAS A CUENTA CORRIENTE */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} /> Compras a Crédito Registradas (con Fecha y Hora Exacta)
              </h4>
              <div className="table-responsive" style={{ marginBottom: '24px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha & Hora</th>
                      <th>Ticket #</th>
                      <th>Artículos / Desglose</th>
                      <th>Atendido por</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesForDetail.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                          No hay compras registradas para el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredSalesForDetail.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                            {formatDateTime(s.created_at)}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>#{s.id}</td>
                          <td style={{ fontSize: '0.88rem' }}>
                            {s.items && Array.isArray(s.items) ? (
                              s.items.map((it, idx) => (
                                <div key={idx} style={{ fontSize: '0.82rem' }}>
                                  • {it.quantity}x <strong>{it.name}</strong> (${it.unitPrice} c/u)
                                </div>
                              ))
                            ) : '-'}
                            {s.interestAmount > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '2px', fontWeight: 700 }}>
                                + Recargo Cta Cte 10%: ${s.interestAmount}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.userName || 'Cajero'}</td>
                          <td style={{ fontWeight: 900, color: '#fff', fontSize: '1.05rem' }}>{formatPrice(s.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLA DE ENTREGAS DE DINERO / ABONOS */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Entregas de Dinero / Abonos (con Fecha y Hora Exacta)
              </h4>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha & Hora</th>
                      <th>Medio de Pago</th>
                      <th>Notas / Observaciones</th>
                      <th>Monto Abonado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaymentsForDetail.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                          No hay abonos registrados para el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredPaymentsForDetail.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)' }}>
                            {formatDateTime(p.created_at)}
                          </td>
                          <td><span className="badge badge-success">{p.paymentMethod}</span></td>
                          <td style={{ fontSize: '0.85rem' }}>{p.notes || '-'}</td>
                          <td style={{ fontWeight: 900, color: 'var(--color-success)', fontSize: '1.05rem' }}>
                            {formatPrice(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPrintSheetCust(detailCust)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Exportar / Imprimir Ficha
              </button>
              <button className="btn btn-primary" onClick={() => setDetailCust(null)}>Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / COMPROBANTE DE IMPRESIÓN Y EXPORTACIÓN FICHA CLIENTE */}
      {printSheetCust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Ficha de Resumen de Cuenta Corriente</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setPrintSheetCust(null)}>✕</button>
            </div>
            <div className="modal-body">

              <div className="receipt-box">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>REGALERÍA TINA</h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>ESTADO DE CUENTA CORRIENTE CLIENTE A 30 DÍAS</p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Emisión: {new Date().toLocaleString()}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.88rem', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div><strong>Cliente:</strong> {printSheetCust.name}</div>
                    <div><strong>DNI:</strong> {printSheetCust.dni || '-'}</div>
                  </div>
                  <div>
                    <div><strong>Domicilio:</strong> {printSheetCust.address || '-'}</div>
                    <div><strong>Teléfono:</strong> {printSheetCust.phone || '-'}</div>
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 700, color: '#475569' }}>Saldo Deudor Pendiente Actual</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: printSheetCust.balance > 0 ? '#dc2626' : '#059669' }}>
                    {formatPrice(printSheetCust.balance || 0)}
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a', textTransform: 'uppercase' }}>Detalle de Compras y Movimientos:</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Fecha & Hora</th>
                      <th style={{ padding: '6px' }}>Concepto / Artículos</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.filter(s => s.customerId === printSheetCust.id && s.paymentMethod === 'Cuenta Corriente').map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px' }}>{formatDateTime(s.created_at)}</td>
                        <td style={{ padding: '6px' }}>
                          Ticket #{s.id}: {s.items ? s.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Compra'}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>+ ${s.total}</td>
                      </tr>
                    ))}
                    {payments.filter(p => p.customerId === printSheetCust.id).map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#f0fdf4' }}>
                        <td style={{ padding: '6px' }}>{formatDateTime(p.created_at)}</td>
                        <td style={{ padding: '6px' }}>ABONO DE CUENTA ({p.paymentMethod}) {p.notes ? `- ${p.notes}` : ''}</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>- ${p.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', padding: '0 20px', fontSize: '0.8rem', color: '#64748b' }}>
                  <div style={{ textAlign: 'center', borderTop: '1px dashed #94a3b8', paddingTop: '6px', width: '180px' }}>Firma del Cliente</div>
                  <div style={{ textAlign: 'center', borderTop: '1px dashed #94a3b8', paddingTop: '6px', width: '180px' }}>Firma Regalería Tina</div>
                </div>

              </div>

            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir / Guardar Ficha (PDF)
              </button>
              <button className="btn btn-secondary" onClick={() => setPrintSheetCust(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
