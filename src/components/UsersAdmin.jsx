import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Mail, 
  User, 
  CheckCircle,
  AlertCircle,
  Key,
  Trash2,
  Edit3,
  Lock
} from 'lucide-react';

import { useData } from '../context/DataContext';

export function UsersAdmin() {
  const { usersList, updateUserRole, updateUser, createNewUser, deleteUser, user: currentUser } = useAuth();
  const { exportBackupData, importBackupData } = useData();

  // Modal para Crear / Editar Usuario y Clave
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cajero');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Abrir Modal (Crear o Editar)
  const openModal = (u = null) => {
    setError('');
    if (u) {
      setEditingUser(u);
      setFullName(u.full_name || '');
      setEmail(u.email || '');
      setPassword(u.password || '');
      setRole(u.role || 'cajero');
    } else {
      setEditingUser(null);
      setFullName('');
      setEmail('');
      setPassword('123456');
      setRole('cajero');
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !fullName.trim() || !password.trim()) {
      setError('Complete todos los campos requeridos: Nombre, Correo y Clave.');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, { full_name: fullName, email, password, role });
        setMsg(`✅ Usuario "${fullName}" y clave actualizados correctamente.`);
      } else {
        await createNewUser(email, password, fullName, role);
        setMsg(`✅ Nuevo usuario "${fullName}" creado exitosamente.`);
      }

      setShowModal(false);
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setError(err.message || 'Error al procesar la operación.');
    }
  };

  const handleQuickRoleToggle = async (u, newRole) => {
    try {
      await updateUserRole(u.id, newRole);
      setMsg(`Rol de ${u.full_name || u.email} cambiado a "${newRole === 'admin' ? 'Administrador' : 'Cajero'}".`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (u) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario "${u.full_name || u.email}"?`)) {
      try {
        await deleteUser(u.id);
        setMsg('Usuario eliminado correctamente.');
        setTimeout(() => setMsg(''), 3000);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '24px auto', padding: '0 20px' }}>
      
      {/* HEADER DE GESTIÓN DE USUARIOS */}
      <div className="glass-card" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gestor de Usuarios y Seguridad
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Administre cuentas de cajeros, roles, correos y modificación de contraseñas.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => openModal()} style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
          <UserPlus size={18} /> + Nuevo Usuario
        </button>
      </div>

      {msg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <CheckCircle size={20} /> {msg}
        </div>
      )}

      {/* GRID DE TARGETAS DE USUARIOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {usersList.map(u => {
          const isSelf = currentUser?.id === u.id;
          const isAdminRole = u.role === 'admin';
          return (
            <div key={u.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isAdminRole ? 'rgba(236, 72, 153, 0.15)' : 'rgba(139, 92, 246, 0.15)', color: isAdminRole ? 'var(--color-primary)' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={`badge ${isAdminRole ? 'badge-primary' : 'badge-warning'}`}>
                    {isAdminRole ? '🛡️ Admin' : '👤 Cajero'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {u.full_name || 'Sin Nombre'} {isSelf && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '6px' }}>(Tú)</span>}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', wordBreak: 'break-all' }}>
                  ✉️ {u.email}
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                  🔑 Contraseña: <strong style={{ color: '#fff' }}>{u.password || '••••••••'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: 'var(--glass-border)', paddingTop: '14px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openModal(u)} style={{ flex: 1 }}>
                  <Edit3 size={15} /> Modificar
                </button>
                {!isSelf && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(u)} style={{ color: '#ef4444' }} title="Eliminar Usuario">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR USUARIO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Modificar Usuario y Contraseña' : 'Crear Nuevo Usuario'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                {error && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.85rem' }}>⚠️ {error}</div>}

                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input type="text" className="form-control" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej. Sofía Vendedora" />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico (Login) *</label>
                  <input type="email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} placeholder="sofia@regaleriatina.com" />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña de Acceso *</label>
                  <input type="text" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingrese clave" />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol del Usuario</label>
                  <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="cajero">👤 Cajero (Ventas, Caja e Inventario)</option>
                    <option value="admin">🛡️ Administrador (Acceso Total + Gestión de Usuarios)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECCIÓN DE RESGUARDO Y COPIAS DE SEGURIDAD (BACKUP) */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '30px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
          <ShieldCheck size={22} /> Resguardo de Información & Copias de Seguridad (Backups)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Exporte una copia comprimida de resguardo con todos los productos, clientes, ventas, entregas y cierres de caja a su equipo. En caso de cambiar de computadora o formatear el disco, podrá restaurar toda la información al instante.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportBackupData} style={{ fontWeight: 800, padding: '12px 20px' }}>
            📥 Descargar Copia de Seguridad Completa (JSON)
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer', fontWeight: 800, padding: '12px 20px', border: '1px dashed var(--color-primary)' }}>
            📤 Restaurar Sistema desde Archivo Backup
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      importBackupData(event.target.result);
                      alert('✅ Copia de seguridad restaurada exitosamente.');
                    } catch (err) {
                      alert('⚠️ Error al importar copia: ' + err.message);
                    }
                  };
                  reader.readAsText(file);
                }
              }} 
            />
          </label>
        </div>
      </div>

    </div>
  );
}
