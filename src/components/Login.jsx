import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export function Login() {
  const { login, resetPassword } = useAuth();
  
  // Modos de vista: 'login', 'forgot'
  const [mode, setMode] = useState('login');

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !newPassword.trim()) {
      setErrorMsg('Por favor complete el correo y la nueva contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      await resetPassword(email, newPassword);
      setSuccessMsg('✅ Contraseña actualizada correctamente. Ya puede iniciar sesión.');
      setTimeout(() => {
        setPassword(newPassword);
        setMode('login');
        clearMessages();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al modificar la contraseña.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '36px 32px', textAlign: 'center' }}>
        
        {/* LOGO */}
        <img 
          src="/logo.jpg" 
          alt="Regalería Tina Logo" 
          style={{ 
            width: '90px', 
            height: '90px', 
            borderRadius: '24px', 
            objectFit: 'cover',
            border: '3px solid var(--color-primary)',
            boxShadow: '0 0 25px rgba(236, 72, 153, 0.5)',
            marginBottom: '14px'
          }} 
        />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          REGALERÍA TINA
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Gestor de Ventas, Caja & Cuentas Corrientes
        </p>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'left' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            {successMsg}
          </div>
        )}

        {/* MODULO 1: INICIAR SESIÓN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Correo Electrónico *</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="ejemplo@regaleriatina.com" 
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Contraseña *</label>
                <button 
                  type="button" 
                  onClick={() => { setMode('forgot'); clearMessages(); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '1rem' }}>
              <LogIn size={18} />
              Iniciar Sesión
            </button>
          </form>
        )}

        {/* MODULO 2: MODIFICAR / RESTABLECER CONTRASEÑA OLVIDADA */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fbbf24' }}>
              <KeyRound size={20} />
              Modificar Contraseña Olvidada
            </h3>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Correo Electrónico Registrado *</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="admin@regaleriatina.com" 
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Nueva Contraseña *</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Ingrese nueva contraseña" 
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Confirmar Nueva Contraseña *</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Repita la nueva contraseña" 
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              Modificar y Guardar Nueva Clave
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => { setMode('login'); clearMessages(); }}
            >
              <ArrowLeft size={16} />
              Volver al Inicio de Sesión
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
