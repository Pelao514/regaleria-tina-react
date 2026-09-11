import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, 
  Lock, 
  Unlock,
  TrendingUp,
  PlusCircle,
  Trash2,
  Receipt,
  History,
  Eye,
  CheckCircle,
  DollarSign,
  Smartphone,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export function CashRegister() {
  const { user, isAdmin } = useAuth();
  const { 
    sales = [], 
    payments = [],
    expenses = [], 
    expenseCategories = [], 
    addExpense, 
    deleteExpense, 
    cashSession, 
    cashHistory = [],
    openCash, 
    closeCash,
    deleteCashHistoryRecord
  } = useData();

  const safeSales = Array.isArray(sales) ? sales : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeHistory = Array.isArray(cashHistory) ? cashHistory : [];
  const safeCategories = expenseCategories.length > 0 ? expenseCategories : [
    '⚡ Energía Eléctrica',
    '🌐 Internet y Teléfono',
    '🏠 Alquiler del Local',
    '🧹 Limpieza e Insumos',
    '📦 Impuestos y Tasas',
    '🛍️ Mantenimiento / Otros'
  ];

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return '-';
    }
  };

  const formatTime = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  const formatPrice = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '$ 0';
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
    } catch {
      return `$ ${num}`;
    }
  };

  const [activeTab, setActiveTab] = useState('current');

  // Modales
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [detailHistoryItem, setDetailHistoryItem] = useState(null);

  // Form Inputs
  const [openInput, setOpenInput] = useState('0');
  const [actualCloseInput, setActualCloseInput] = useState('');
  
  const [expCategory, setExpCategory] = useState(safeCategories[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expMethod, setExpMethod] = useState('Efectivo');
  const [expError, setExpError] = useState('');

  const isCashOpen = cashSession && cashSession.status === 'open';

  // CÁLCULOS DE MOVIMIENTOS DESDE LA APERTURA DE MANERA 100% SEGURA
  const sessionStartTimeMs = useMemo(() => {
    if (!isCashOpen || !cashSession?.openedAt) return null;
    const t = new Date(cashSession.openedAt).getTime();
    return isNaN(t) ? null : t;
  }, [isCashOpen, cashSession]);

  const currentSessionSales = useMemo(() => {
    if (!sessionStartTimeMs) return [];
    return safeSales.filter(s => {
      if (!s || !s.created_at) return false;
      const t = new Date(s.created_at).getTime();
      return !isNaN(t) && t >= sessionStartTimeMs;
    });
  }, [safeSales, sessionStartTimeMs]);

  const currentSessionPayments = useMemo(() => {
    if (!sessionStartTimeMs) return [];
    return safePayments.filter(p => {
      if (!p || !p.created_at) return false;
      const t = new Date(p.created_at).getTime();
      return !isNaN(t) && t >= sessionStartTimeMs;
    });
  }, [safePayments, sessionStartTimeMs]);

  const currentSessionExpenses = useMemo(() => {
    if (!sessionStartTimeMs) return [];
    return safeExpenses.filter(e => {
      if (!e || !e.created_at) return false;
      const t = new Date(e.created_at).getTime();
      return !isNaN(t) && t >= sessionStartTimeMs;
    });
  }, [safeExpenses, sessionStartTimeMs]);

  // Totales por Método de Pago
  const cashSalesTotal = useMemo(() => {
    return currentSessionSales.filter(s => s && s.paymentMethod === 'Efectivo').reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [currentSessionSales]);

  const cashPaymentsTotal = useMemo(() => {
    return currentSessionPayments.filter(p => p && p.paymentMethod === 'Efectivo').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [currentSessionPayments]);

  const digitalSalesTotal = useMemo(() => {
    return currentSessionSales.filter(s => s && (s.paymentMethod === 'Transferencia' || s.paymentMethod === 'Tarjeta')).reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [currentSessionSales]);

  const digitalPaymentsTotal = useMemo(() => {
    return currentSessionPayments.filter(p => p && (p.paymentMethod === 'Transferencia' || p.paymentMethod === 'Tarjeta')).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [currentSessionPayments]);

  const ctaCteSalesTotal = useMemo(() => {
    return currentSessionSales.filter(s => s && s.paymentMethod === 'Cuenta Corriente').reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [currentSessionSales]);

  const cashExpensesTotal = useMemo(() => {
    return currentSessionExpenses.filter(e => e && e.paymentMethod === 'Efectivo').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [currentSessionExpenses]);

  const openAmount = isCashOpen ? (Number(cashSession?.openAmount) || 0) : 0;
  const cashInHand = openAmount + cashSalesTotal + cashPaymentsTotal - cashExpensesTotal;

  const handleOpenSubmit = (e) => {
    e.preventDefault();
    openCash(openInput || 0);
    setShowOpenModal(false);
  };

  const handleOpenCloseModal = () => {
    setActualCloseInput(cashInHand.toString());
    setShowCloseModal(true);
  };

  const handleConfirmClose = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalCounted = parseFloat(actualCloseInput);
    const countedCash = isNaN(finalCounted) ? cashInHand : finalCounted;
    const diff = countedCash - cashInHand;

    const auditDetails = {
      openAmount,
      cashSalesTotal,
      cashPaymentsTotal,
      digitalSalesTotal,
      digitalPaymentsTotal,
      ctaCteSalesTotal,
      cashExpensesTotal,
      expectedCash: cashInHand,
      countedCash,
      diff
    };

    closeCash(countedCash, auditDetails);
    setShowCloseModal(false);
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    setExpError('');
    if (!expDesc.trim() || !expAmount || parseFloat(expAmount) <= 0) {
      return setExpError('Ingrese una descripción y un monto válido mayor a $0.');
    }

    try {
      addExpense({
        category: expCategory || safeCategories[0],
        description: expDesc,
        amount: expAmount,
        paymentMethod: expMethod || 'Efectivo'
      });
      setShowExpenseModal(false);
      setExpDesc('');
      setExpAmount('');
    } catch (err) {
      setExpError(err.message || 'Error al guardar el gasto.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 20px' }}>
      
      {/* PESTAÑAS JORNADA / HISTORIAL */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('current')}
          style={{ borderRadius: 'var(--radius-full)', padding: '8px 22px', fontWeight: 800 }}
        >
          <Wallet size={18} /> Caja de Turno Actual
        </button>

        <button 
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('history')}
          style={{ borderRadius: 'var(--radius-full)', padding: '8px 22px', fontWeight: 800 }}
        >
          <History size={18} /> Historial de Arqueos y Cierres
        </button>
      </div>

      {activeTab === 'current' && (
        <>
          {/* BANNER ESTADO CAJA */}
          <div className="glass-card" style={{ 
            padding: '24px 30px', 
            marginBottom: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'space-between', 
            flexWrap: 'wrap', 
            gap: '16px',
            borderColor: isCashOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: isCashOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isCashOpen ? '#10b981' : '#ef4444',
                display: 'flex', 
                alignItems: 'center', 
                justify: 'center'
              }}>
                {isCashOpen ? <Unlock size={28} /> : <Lock size={28} />}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Estado de Caja Diaria</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: isCashOpen ? '#10b981' : '#ef4444' }}>
                  {isCashOpen ? 'CAJA ABIERTA (EN TURNO)' : 'CAJA CERRADA'}
                </h2>
                {isCashOpen && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Abierta por: <strong>{cashSession.openedBy || 'Cajero'}</strong> ({formatDate(cashSession.openedAt)})
                  </div>
                )}
              </div>
            </div>

            <div>
              {!isCashOpen ? (
                <button className="btn btn-success" onClick={() => setShowOpenModal(true)} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 800, borderRadius: 'var(--radius-full)' }}>
                  <Unlock size={18} /> Abrir Caja Diaria
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-warning" onClick={() => setShowExpenseModal(true)} style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                    <PlusCircle size={18} /> + Registrar Gasto / Egreso
                  </button>
                  <button className="btn btn-danger" onClick={handleOpenCloseModal} style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                    <Lock size={18} /> Cerrar Caja y Arqueo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TARJETAS MÉTRICAS DE RESUMEN FINANCIERO */}
          {isCashOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '24px' }}>
              
              <div className="stat-card">
                <div className="stat-icon emerald"><DollarSign size={26} /></div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Efectivo Estimado en Caja</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{formatPrice(cashInHand)}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Apertura: {formatPrice(openAmount)}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple"><Smartphone size={26} /></div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas Digitales (MP / Tarjeta)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-secondary)' }}>{formatPrice(digitalSalesTotal + digitalPaymentsTotal)}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon pink"><Receipt size={26} /></div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas en Cta. Corriente</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>{formatPrice(ctaCteSalesTotal)}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon red"><TrendingUp size={26} /></div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Gastos / Egresos del Día</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>{formatPrice(cashExpensesTotal)}</div>
                </div>
              </div>

            </div>
          )}

          {/* TABLA DE GASTOS DEL TURNO */}
          {isCashOpen && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>📋 Gastos y Salidas de Caja Registradas</h3>
                <button className="btn btn-warning btn-sm" onClick={() => setShowExpenseModal(true)} style={{ borderRadius: 'var(--radius-full)' }}>
                  <PlusCircle size={15} /> + Cargar Gasto
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Descripción / Concepto</th>
                      <th>Registrado por</th>
                      <th>Medio de Pago</th>
                      <th>Monto</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSessionExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                          No hay gastos o egresos registrados en el turno activo.
                        </td>
                      </tr>
                    ) : (
                      currentSessionExpenses.map(e => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{e.category}</td>
                          <td>{e.description}</td>
                          <td>{e.userName}</td>
                          <td>{e.paymentMethod}</td>
                          <td style={{ fontWeight: 900, color: '#ef4444' }}>{formatPrice(e.amount)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => deleteExpense(e.id)} style={{ color: '#ef4444' }}>
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* PESTAÑA HISTORIAL DE CIERRES */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>📜 Historial de Arqueos y Turnos Cerrados</h3>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Fecha de Cierre</th>
                  <th>Cerrado por</th>
                  <th>Apertura</th>
                  <th>Efectivo Esperado</th>
                  <th>Efectivo Contado</th>
                  <th>Diferencia</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {safeHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      No hay cierres registrados en el historial.
                    </td>
                  </tr>
                ) : (
                  safeHistory.map(item => {
                    const audit = item.audit || {};
                    const diff = audit.diff || 0;
                    return (
                      <tr key={item.id}>
                        <td>{formatDate(item.closedAt)}</td>
                        <td>{item.closedBy || 'Cajero'}</td>
                        <td>{formatPrice(audit.openAmount || 0)}</td>
                        <td>{formatPrice(audit.expectedCash || 0)}</td>
                        <td style={{ fontWeight: 800, color: '#fff' }}>{formatPrice(item.closeAmount || 0)}</td>
                        <td style={{ fontWeight: 800, color: diff === 0 ? '#10b981' : diff > 0 ? '#3b82f6' : '#ef4444' }}>
                          {diff > 0 ? `+${formatPrice(diff)}` : formatPrice(diff)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setDetailHistoryItem(item)}>
                              <Eye size={15} /> Ver Detalle
                            </button>
                            {isAdmin && (
                              <button className="btn btn-secondary btn-sm" onClick={() => deleteCashHistoryRecord(item.id)} style={{ color: '#ef4444' }}>
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL APERTURA CAJA */}
      {showOpenModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Abrir Turno de Caja</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowOpenModal(false)}>✕</button>
            </div>
            <form onSubmit={handleOpenSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Monto de Apertura ($)</label>
                  <input type="number" step="any" min="0" className="form-control" value={openInput} onChange={e => setOpenInput(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOpenModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Abrir Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE CAJA */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Arqueo y Cierre de Caja</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCloseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmClose}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Efectivo Estimado:</span>
                    <strong style={{ color: '#10b981' }}>{formatPrice(cashInHand)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Ventas Digitales MP/Tarjeta:</span>
                    <span>{formatPrice(digitalSalesTotal + digitalPaymentsTotal)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Efectivo Real en Caja al Contar ($) *</label>
                  <input type="number" step="any" min="0" className="form-control" required value={actualCloseInput} onChange={e => setActualCloseInput(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Confirmar Cierre de Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGAR GASTO */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Registrar Gasto / Egreso</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddExpenseSubmit}>
              <div className="modal-body">
                {expError && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.85rem' }}>⚠️ {expError}</div>}
                <div className="form-group">
                  <label className="form-label">Categoría del Gasto *</label>
                  <select className="form-control" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                    {safeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción / Concepto *</label>
                  <input type="text" className="form-control" required value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Ej. Pago servicio luz local" />
                </div>
                <div className="form-group">
                  <label className="form-label">Monto ($) *</label>
                  <input type="number" step="any" min="1" className="form-control" required value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Ej. 12000" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-warning">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE HISTORIAL */}
      {detailHistoryItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalle de Arqueo de Caja</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetailHistoryItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Cerrado por:</strong> {detailHistoryItem.closedBy}</p>
              <p><strong>Fecha:</strong> {formatDate(detailHistoryItem.closedAt)}</p>
              <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monto contado:</span>
                <strong>{formatPrice(detailHistoryItem.closeAmount)}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailHistoryItem(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
