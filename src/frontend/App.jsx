import React, { useState, useEffect } from 'react';
import PortalCliente from './components/PortalCliente';
import PosTrabajador from './components/PosTrabajador';
import AdminDashboard from './components/AdminDashboard';
import Tienda from './components/Tienda';

export const API_URL = 'http://localhost:8000';

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('login'); 
  const [notificacionAdmin, setNotificacionAdmin] = useState(null);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Revisar si hay sesión guardada
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const data = JSON.parse(saved);
      setSession(data);
      setView(data.rol); // 'cliente', 'trabajador', 'admin'
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user_session');
    setSession(null);
    setView('login');
  };

  const handleNuevoPedido = (pedido) => {
    setNotificacionAdmin(pedido);
    setTimeout(() => setNotificacionAdmin(null), 10000);
  };

  return (
    <>
      <div className="barber-pole-bg"></div>

      {notificacionAdmin && view === 'admin' && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--bg-lead)', border: '2px solid var(--green-emerald-light)', borderRadius: '10px', padding: '15px', zIndex: 2000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxWidth: '300px', animation: 'slideIn 0.3s ease-out' }}>
          <h4 style={{ color: 'var(--green-emerald-light)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>🔔 ¡NUEVO PEDIDO!</h4>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}><strong>ID:</strong> {notificacionAdmin.id}</p>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}><strong>Items:</strong> {notificacionAdmin.items}</p>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--gold-jewel)', fontWeight: 'bold' }}><strong>Total:</strong> ${notificacionAdmin.total.toLocaleString('es-CL')}</p>
          <button className="btn-primary" style={{ width: '100%', padding: '8px' }} onClick={() => setNotificacionAdmin(null)}>Entendido</button>
        </div>
      )}

      <div className="container" style={{ paddingBottom: '100px' }}>
        {/* Barra superior de cierre de sesión si estamos logueados */}
        {session && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <img src={session.usuario.foto_perfil || 'https://i.pravatar.cc/100'} alt="Perfil" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
               <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{session.usuario.nombre} ({session.rol})</span>
               <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--gold-jewel)', color: 'var(--gold-jewel)', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
             </div>
          </div>
        )}

        {/* --- VISTAS POR ROL --- */}
        {!session && (
          <div className="card" style={{ textAlign: 'center', marginTop: '50px', maxWidth: '400px', margin: '50px auto' }}>
            <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '20px' }}>Bienvenido a La Romana</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
              Ingresa con tu RUT o correo registrado.
            </p>



            <form onSubmit={async (e) => {
              e.preventDefault();
              const nombre = e.target.nombre ? e.target.nombre.value : '';
              const identificador = e.target.identificador.value;
              const password = e.target.password.value;
              
              try {
                const response = await fetch(`${API_URL}/auth.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ identificador, password, nombre, login_type: isRegistering ? 'register' : 'standard' })
                });
                const data = await response.json();
                
                if (data.status === 'success') {
                  localStorage.setItem('user_session', JSON.stringify(data));
                  setSession(data);
                  setView(data.rol);
                } else {
                  alert(data.error);
                }
              } catch (err) {
                alert('Error conectando al backend PHP.');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
              
              {isRegistering ? (
                <>
                  <input type="text" name="nombre" className="input-field" placeholder="Nombre completo" required style={{ marginBottom: 0 }} />
                  <input type="text" name="identificador" className="input-field" placeholder="Tu RUT (ej: 12345678-9)" required style={{ marginBottom: 0 }} />
                </>
              ) : (
                <input type="text" name="identificador" className="input-field" placeholder="RUT o Correo Electrónico" required style={{ marginBottom: 0 }} />
              )}
              <input type="password" name="password" className="input-field" placeholder="Contraseña" required style={{ marginBottom: 0 }} />
              
              <button type="submit" className={isRegistering ? "btn-primary" : "btn-outline-gold"} style={{ width: '100%' }}>
                {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
              </button>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
              
              {!isRegistering && (
                <button onClick={async () => {
                  const email = prompt("Ingresa tu correo o RUT de administrador:");
                  if (!email) return;
                  const newPass = prompt("Ingresa tu nueva contraseña:");
                  if (!newPass) return;
                  
                  try {
                    const res = await fetch(`${API_URL}/auth.php`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ identificador: email, new_password: newPass, login_type: 'reset_password' })
                    });
                    const data = await res.json();
                    alert(data.message || data.error);
                  } catch (e) {
                    alert('Error de conexión.');
                  }
                }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ¿Olvidaste tu contraseña de Admin?
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'cliente' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button className="btn-primary" style={{flex: 1}} onClick={() => setView('cliente')}>Reservar Cita</button>
              <button className="btn-outline-gold" style={{flex: 1}} onClick={() => setView('tienda_cliente')}>Tienda Exclusiva</button>
            </div>
            <PortalCliente session={session} setSession={setSession} />
          </>
        )}

        {view === 'tienda_cliente' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button className="btn-outline-gold" style={{flex: 1}} onClick={() => setView('cliente')}>Reservar Cita</button>
              <button className="btn-primary" style={{flex: 1}} onClick={() => setView('tienda_cliente')}>Tienda Exclusiva</button>
            </div>
            <Tienda session={session} onNuevoPedido={handleNuevoPedido} />
          </>
        )}

        {view === 'trabajador' && <PosTrabajador session={session} />}
        {view === 'admin' && <AdminDashboard session={session} logout={logout} />}
      </div>

      {view !== 'admin' && (
        <footer className="global-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Creado por <img src="/logo_pcg.png" alt="PCG" style={{ height: '24px', objectFit: 'contain' }} />
          </div>
          <div className="footer-links">
            <a href="https://www.instagram.com/la_romana_cl/" target="_blank" rel="noreferrer" style={{textDecoration: 'none'}}>
              <img src="/botones/boton insta.png" alt="Instagram" style={{ height: '35px' }} />
            </a>
            <a href="https://wa.me/123456789" target="_blank" rel="noreferrer" style={{textDecoration: 'none'}}>
              <img src="/botones/boton wasap.png" alt="WhatsApp" style={{ height: '35px' }} />
            </a>
          </div>
        </footer>
      )}
    </>
  );
}

export default App;
