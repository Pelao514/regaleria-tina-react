import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { POS } from './components/POS';
import { Accounts } from './components/Accounts';
import { Inventory } from './components/Inventory';
import { CashRegister } from './components/CashRegister';
import { UsersAdmin } from './components/UsersAdmin';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleClearData = this.handleClearData.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  handleClearData() {
    if (window.confirm("¿Desea restablecer los registros locales de caja y gastos para recuperar el acceso?")) {
      localStorage.removeItem('tina_cash_session');
      localStorage.removeItem('tina_expenses');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '60px auto', background: 'rgba(30, 41, 59, 0.95)', borderRadius: '16px', border: '1px solid #ef4444', color: '#fff', textAlign: 'center' }}>
          <h2 style={{ color: '#f87171', marginBottom: '16px' }}>⚠️ Se detectó un problema al renderizar la vista</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error ? this.state.error.toString() : 'Error inesperado'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={this.handleReset}>🔄 Recargar Página</button>
            <button className="btn btn-secondary" onClick={this.handleClearData} style={{ color: '#fbbf24' }}>🛠️ Restablecer Sesión y Gastos de Caja</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
        <h2>Cargando Gestor Regalería Tina...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="ambient-orb-1"></div>
      <div className="ambient-orb-2"></div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        <ErrorBoundary key={activeTab}>
          {activeTab === 'pos' && <POS />}
          {activeTab === 'accounts' && <Accounts />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'cash' && <CashRegister />}
          {activeTab === 'users' && <UsersAdmin />}
        </ErrorBoundary>
      </main>

      <footer style={{ 
        background: 'rgba(15, 23, 42, 0.9)', 
        borderTop: 'var(--glass-border)', 
        padding: '16px 24px', 
        textAlign: 'center', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)' 
      }}>
        Regalería Tina - Sistema Gestor de Ventas, Inventario & Cuentas Corrientes a 30 Días © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
