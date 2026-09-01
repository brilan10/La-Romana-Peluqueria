import React, { useState, useEffect } from 'react';
import PortalCliente from './components/PortalCliente';
import PosTrabajador from './components/PosTrabajador';
import AdminDashboard from './components/AdminDashboard';
import Tienda from './components/Tienda';

export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/backend');

function App() {
  const [session, setSession] = useState(null);
  // Vistas públicas: 'home', 'agendar_cita', 'tienda', 'login_staff'
  // Vistas privadas: 'cliente', 'trabajador', 'admin'
  const [view, setView] = useState('home'); 
  const [notificacionAdmin, setNotificacionAdmin] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Revisar si hay sesión guardada
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSession(data);
        setView(data.rol); // 'cliente', 'trabajador', 'admin'
      } catch (e) {
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user_session');
    setSession(null);
    setView('home');
  };

  const handleNuevoPedido = (pedido) => {
    setNotificacionAdmin(pedido);
    setTimeout(() => setNotificacionAdmin(null), 10000);
  };

  return (
    <>
      <div className="barber-pole-bg"></div>

      {notificacionAdmin && view === 'admin' && (
        <div style={{ position: 'fixed', top: '15px', right: '15px', left: '15px', background: 'var(--bg-lead)', border: '2px solid var(--green-emerald-light)', borderRadius: '10px', padding: '12px', zIndex: 2000, boxShadow: '0 10px 25px rgba(0,0,0,0.6)', maxWidth: '360px', margin: '0 auto', animation: 'slideIn 0.3s ease-out' }}>
          <h4 style={{ color: 'var(--green-emerald-light)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>🔔 ¡NUEVO PEDIDO!</h4>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>ID:</strong> {notificacionAdmin.id}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Items:</strong> {notificacionAdmin.items}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--gold-jewel)', fontWeight: 'bold' }}><strong>Total:</strong> ${notificacionAdmin.total.toLocaleString('es-CL')}</p>
          <button className="btn-primary" style={{ width: '100%', padding: '6px' }} onClick={() => setNotificacionAdmin(null)}>Entendido</button>
        </div>
      )}

      <div className="container">
        
        {/* --- BARRA SUPERIOR DE NAVEGACIÓN (RESPONSIVE) --- */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
          <div 
            onClick={() => setView(session ? session.rol : 'home')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <img src="/Logo_romana_dorado.png" alt="La Romana" style={{ height: '42px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--gold-jewel)', letterSpacing: '1px', textTransform: 'uppercase' }}>La Romana</h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Barber Shop, Accesorios & Perfumería</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {session && (
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {session.usuario.nombre.split(' ')[0]} <strong style={{ color: 'var(--gold-jewel)' }}>({session.rol})</strong>
                </span>
                <button 
                  onClick={logout} 
                  className="btn-img-action" 
                  title="Cerrar Sesión" 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <img src="/botones/puerta_salida.png" alt="Salir" style={{ height: '28px', objectFit: 'contain' }} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* --- 1. PANTALLA PRINCIPAL / BIENVENIDA (HOME) --- */}
        {view === 'home' && !session && (
          <div style={{ textAlign: 'center', padding: '10px 0', maxWidth: '600px', margin: '0 auto' }}>
            <img src="/Logo_romana_dorado.png" alt="LA ROMANA" style={{ width: '110px', marginBottom: '15px', filter: 'drop-shadow(0 0 18px rgba(218,165,32,0.35))' }} />
            <h1 style={{ color: 'var(--gold-jewel)', fontSize: '2.1rem', marginBottom: '8px', letterSpacing: '2px', textTransform: 'uppercase' }}>LA ROMANA</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
              Barbería clásica, productos capilares de alta gama y perfumería de autor.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '25px' }}>
              {/* Botón Principal Agendar Cita */}
              <button 
                className="btn-img-action" 
                style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
                onClick={() => setView('agendar_cita')}
              >
                <img src="/botones/boton_agendar_hora.png" alt="Agendar Hora" style={{ height: '54px', objectFit: 'contain' }} />
              </button>

              {/* Botón Ver Catálogo */}
              <button 
                className="btn-img-action" 
                style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
                onClick={() => setView('tienda')}
              >
                <img src="/botones/ver_catalogo.png" alt="Ver Catálogo" style={{ height: '54px', objectFit: 'contain' }} />
              </button>

              {/* Botón Staff y Administración */}
              <button 
                className="btn-img-action" 
                style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
                onClick={() => setView('login_staff')}
              >
                <img src="/botones/para_staff.png" alt="Staff y Administración" style={{ height: '48px', objectFit: 'contain' }} />
              </button>
            </div>
          </div>
        )}

        {/* --- 2. VISTA DE AGENDAR CITA (DIRECTA CON RUT) --- */}
        {view === 'agendar_cita' && !session && (
          <PortalCliente 
            session={session} 
            onBackToHome={() => setView('home')} 
            onGoToTienda={() => setView('tienda')} 
          />
        )}

        {/* --- 3. VISTA DE TIENDA / CATÁLOGO (DIRECTA O LOGUEADO) --- */}
        {(view === 'tienda' || (view === 'tienda_cliente' && session)) && (
          <Tienda 
            session={session} 
            onNuevoPedido={handleNuevoPedido} 
            onBackToHome={() => setView(session ? session.rol : 'home')} 
            onGoToCitas={() => setView(session ? 'cliente' : 'agendar_cita')} 
          />
        )}

        {/* --- 4. VISTA DE LOGIN / ACCESO STAFF & ADMIN --- */}
        {view === 'login_staff' && !session && (
          <div className="card" style={{ textAlign: 'center', maxWidth: '390px', margin: '20px auto', border: '1px solid var(--gold-jewel)', padding: '25px 20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <img src="/botones/para_staff.png" alt="Staff y Administración" style={{ height: '46px', objectFit: 'contain' }} />
            </div>
            <p style={{ marginBottom: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {isRegistering ? 'Crea tu cuenta de cliente en La Romana' : 'Panel de acceso para Administradores, Barberos y Clientes.'}
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
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              
              {isRegistering ? (
                <>
                  <input type="text" name="nombre" className="input-field" placeholder="Nombre completo" required style={{ marginBottom: 0 }} />
                  <input type="text" name="identificador" className="input-field" placeholder="Tu RUT (ej: 19123456-7)" required style={{ marginBottom: 0 }} />
                </>
              ) : (
                <input type="text" name="identificador" className="input-field" placeholder="RUT o Correo Electrónico" required style={{ marginBottom: 0 }} />
              )}
              <input type="password" name="password" className="input-field" placeholder="Contraseña" required style={{ marginBottom: 0 }} />
              
              <button type="submit" className={isRegistering ? "btn-primary" : "btn-outline-gold"} style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>
                {isRegistering ? 'Crear Cuenta' : 'Ingresar al Panel'}
              </button>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
              
              <button className="btn-img-action" onClick={() => setView('home')} style={{ width: '120px', marginTop: '5px' }}>
                <img src="/botones/boton_volver.png" alt="Volver" style={{ height: '36px', objectFit: 'contain' }} />
              </button>
            </div>
          </div>
        )}

        {/* --- VISTAS PRIVADAS (CON SESIÓN INICIADA) --- */}
        {session && view === 'cliente' && (
          <>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '15px' }}>
              <button 
                className="btn-img-action" 
                style={{ width: '150px' }} 
                onClick={() => setView('cliente')}
              >
                <img src="/botones/boton_agendar_hora.png" alt="Reservar Cita" style={{ height: '42px', objectFit: 'contain' }} />
              </button>
              <button 
                className="btn-img-action" 
                style={{ width: '150px' }} 
                onClick={() => setView('tienda_cliente')}
              >
                <img src="/botones/ver_catalogo.png" alt="Catálogo" style={{ height: '42px', objectFit: 'contain' }} />
              </button>
            </div>
            <PortalCliente session={session} onGoToTienda={() => setView('tienda_cliente')} />
          </>
        )}

        {session && view === 'trabajador' && <PosTrabajador session={session} />}
        {session && view === 'admin' && <AdminDashboard session={session} logout={logout} />}

        {/* --- REDES SOCIALES Y CRÉDITOS AL FINAL DEL APARTADO DE CLIENTES --- */}
        {view !== 'admin' && view !== 'trabajador' && (
          <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px 10px 85px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'var(--gold-jewel)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
              💈 LA ROMANA BARBER SHOP Y ACCESORIOS / PERFUMERÍA
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              ¿Tienes dudas o consultas? Escríbenos en nuestras redes oficiales:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
              <a href="https://wa.me/56935379392" target="_blank" rel="noreferrer" className="btn-img-action" title="WhatsApp">
                <img src="/botones/boton_wasap.png" alt="WhatsApp" style={{ height: '42px', objectFit: 'contain' }} />
              </a>
              <a href="https://www.instagram.com/la_romana_cl/" target="_blank" rel="noreferrer" className="btn-img-action" title="Instagram">
                <img src="/botones/boton_insta.png" alt="Instagram" style={{ height: '42px', objectFit: 'contain' }} />
              </a>
            </div>

            {/* Créditos de Desarrollo PCG SpA */}
            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>
                Este software es creado por:
              </span>
              <a 
                href="https://www.instagram.com/pcg_servicio_tecnico/" 
                target="_blank" 
                rel="noreferrer"
                title="Desarrollado por PCG SpA"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  textDecoration: 'none', 
                  background: 'rgba(255,255,255,0.04)', 
                  padding: '8px 18px', 
                  borderRadius: '30px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <img src="/logo_pcg.png" alt="PCG SpA" style={{ height: '24px', objectFit: 'contain', background: '#fff', borderRadius: '4px', padding: '2px 4px' }} />
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>PCG SpA</span>
                <span style={{ fontSize: '0.75rem', color: '#f39c12', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  📸 @pcg_servicio_tecnico
                </span>
              </a>
            </div>
          </footer>
        )}
      </div>

      {/* --- BARRA INFERIOR DE NAVEGACIÓN PARA FORMATO MÓVIL --- */}
      {view !== 'admin' && view !== 'trabajador' && (
        <nav className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${(view === 'home' || view === 'agendar_cita') ? 'active' : ''}`}
            onClick={() => setView('agendar_cita')}
          >
            <span className="mobile-nav-icon">✂️</span>
            <span>Agendar</span>
          </button>

          <button 
            className={`mobile-nav-item ${(view === 'tienda' || view === 'tienda_cliente') ? 'active' : ''}`}
            onClick={() => setView(session ? 'tienda_cliente' : 'tienda')}
          >
            <span className="mobile-nav-icon">🛍️</span>
            <span>Catálogo</span>
          </button>

          <button 
            className={`mobile-nav-item ${(view === 'login_staff' || view === 'cliente') ? 'active' : ''}`}
            onClick={() => setView(session ? session.rol : 'login_staff')}
          >
            <span className="mobile-nav-icon">👤</span>
            <span>{session ? 'Mi Panel' : 'Staff'}</span>
          </button>
        </nav>
      )}
    </>
  );
}

export default App;
