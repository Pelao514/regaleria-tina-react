import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  ShoppingBag, 
  Package, 
  Wallet, 
  LogOut, 
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  Activity
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin } = useAuth();
  const { lowStockProducts, overdueCustomers, cashSession } = useData();

  // Reloj Digital en Tiempo Real
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Atajos de Teclado (F2: POS, F3: Cuentas, F4: Caja)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('accounts');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('cash');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // Estado del Tema (Claro / Oscuro)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tina_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tina_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isCashOpen = cashSession && cashSession.status === 'open';

  return (
    <header className="glass-card" style={{ 
      borderRadius: 0, 
      borderLeft: 'none', 
      borderRight: 'none', 
      borderTop: 'none',
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      padding: '14px 28px',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)'
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* LOGO E IDENTIDAD + LIVE STATUS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('pos')}>
          <div style={{ position: 'relative' }}>
            <img 
              src="/logo.jpg" 
              alt="Regalería Tina Logo" 
              style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '14px', 
                objectFit: 'cover',
                border: '2px solid var(--color-primary)',
                boxShadow: '0 0 20px rgba(236, 72, 153, 0.55)'
              }} 
            />
            <span style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              right: '-2px' 
            }} className="live-pulse-dot" title="Sistema en línea"></span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              REGALERÍA TINA
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Enterprise System
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 800 }}>
                • {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL ENTRE SECCIONES CON ATAJOS DE TECLADO */}
        <nav style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          overflowX: 'auto', 
          padding: '6px 8px', 
          background: 'rgba(15, 23, 42, 0.35)', 
          borderRadius: 'var(--radius-full)', 
          border: 'var(--glass-border)' 
        }}>
          <button 
            className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pos')}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
          >
            <ShoppingBag size={18} />
            Sector Ventas
            <span className="shortcut-badge">F2</span>
          </button>

          <button 
            className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('accounts')}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', position: 'relative' }}
          >
            <Clock size={18} />
            Cuentas Corrientes
            <span className="shortcut-badge">F3</span>
            {(overdueCustomers || []).length > 0 && (
              <span className="badge badge-danger" style={{ padding: '2px 8px', fontSize: '0.68rem', marginLeft: '4px' }}>
                {(overdueCustomers || []).length}
              </span>
            )}
          </button>

          <button 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('inventory')}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', position: 'relative' }}
          >
            <Package size={18} />
            Inventario
            {(lowStockProducts || []).length > 0 && (
              <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.68rem', marginLeft: '4px' }}>
                {(lowStockProducts || []).length}
              </span>
            )}
          </button>

          <button 
            className={`btn ${activeTab === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('cash')}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
          >
            <Wallet size={18} />
            Caja Diaria
            <span className="shortcut-badge">F4</span>
            <span className={`badge ${isCashOpen ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '4px', fontSize: '0.65rem' }}>
              {isCashOpen ? 'Abierta' : 'Cerrada'}
            </span>
          </button>
        </nav>

        {/* DERECHA: TEMA, USUARIO ACTIVO, BOTÓN ADMINISTRADOR Y BOTÓN CERRAR SESIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            style={{ color: theme === 'dark' ? '#fbbf24' : '#8b5cf6', borderRadius: 'var(--radius-full)', padding: '8px 14px', gap: '6px' }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Claro</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Oscuro</span>
              </>
            )}
          </button>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{user?.full_name || 'Usuario'}</div>
            <span className={`badge ${isAdmin ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
              {isAdmin ? '🛡️ Admin' : '👤 Cajero'}
            </span>
          </div>

          <button 
            type="button"
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
            style={{ 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <ShieldCheck size={18} />
            Usuarios
          </button>

          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={logout} 
            title="Cerrar Sesión" 
            style={{ 
              color: '#ef4444', 
              borderColor: 'rgba(239, 68, 68, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontWeight: 700,
              borderRadius: 'var(--radius-full)' 
            }}
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>

      </div>
    </header>
  );
}
