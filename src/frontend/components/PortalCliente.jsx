import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

export default function PortalCliente({ session, setSession }) {
  const [perfilCompleto, setPerfilCompleto] = useState(session.perfilCompleto);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [rut, setRut] = useState(session.usuario?.rut || '');
  const [telefono, setTelefono] = useState(session.usuario?.telefono || '');
  const [email, setEmail] = useState(session.usuario?.email || '');

  // Citas
  const [step, setStep] = useState(1);
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [selectedBarbero, setSelectedBarbero] = useState(null);
  const [selectedDia, setSelectedDia] = useState(null);
  const [selectedHora, setSelectedHora] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  // Historial de Compras
  const [historialCompras, setHistorialCompras] = useState([]);
  const [viendoPerfil, setViendoPerfil] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api.php?action=get_servicios`).then(r => r.json()).then(data => setServicios(data));
    fetch(`${API_URL}/api.php?action=get_barberos`).then(r => r.json()).then(data => setBarberos(data));
    if (session.usuario?.id) {
      // Endpoint simulado para obtener compras. En un entorno real se crea en api.php
      fetch(`${API_URL}/api.php?action=get_mis_pedidos&cliente_id=${session.usuario.id}`)
        .then(r => r.json())
        .then(data => setHistorialCompras(data.error ? [] : data))
        .catch(() => setHistorialCompras([]));
    }
  }, [session.usuario]);

  useEffect(() => {
    if (selectedBarbero && selectedDia) {
      // RF02: Cruce en tiempo real con la base de datos
      const fechaFormat = "2026-08-" + selectedDia.split(' ')[1]; // Simulación de formato YYYY-MM-DD
      fetch(`${API_URL}/api.php?action=get_horarios_ocupados&trabajador_id=${selectedBarbero}&fecha=${fechaFormat}`)
        .then(r => r.json())
        .then(data => setHorariosOcupados(data))
        .catch(e => setHorariosOcupados([]));
    }
  }, [selectedBarbero, selectedDia]);

  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_URL}/api.php?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, telefono, email, cliente_id: session.usuario.id })
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
          throw new Error(data.error || 'Error del servidor');
      }
      alert('✅ Perfil actualizado.');
      setPerfilCompleto(true);
      setEditandoPerfil(false);
      setSession({...session, perfilCompleto: true, usuario: {...session.usuario, rut, telefono, email}});
    } catch (e) {
      alert('Error guardando perfil: ' + e.message);
    }
  };

  const handleConfirm = async () => {
    try {
      const resp = await fetch(`${API_URL}/api.php?action=agendar_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: session.usuario.id,
          trabajador_id: selectedBarbero,
          fecha: "2026-08-" + selectedDia.split(' ')[1],
          hora: selectedHora,
          servicios: selectedServicios
        })
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setIsConfirmed(true);
        setTimeout(() => {
          alert(`📧 [PHPMailer Simulador] Cita enviada por email a ${session.usuario.email}`);
        }, 500);
      }
    } catch (e) {
      alert('Error agendando cita');
    }
  };

  if (!perfilCompleto) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '20px' }}>Completa tu Perfil (RF01)</h2>
        <form onSubmit={guardarPerfil}>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>RUT (Validación Módulo 11 requerida)</label>
          <input type="text" className="input-field" placeholder="19123456-7" value={rut} onChange={(e)=>setRut(e.target.value)} required />
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Teléfono</label>
          <input type="tel" className="input-field" placeholder="+569..." value={telefono} onChange={(e)=>setTelefono(e.target.value)} required />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Guardar y Continuar</button>
        </form>
      </div>
    );
  }

  if (viendoPerfil) {
    return (
      <div style={{ padding: '20px 0' }}>
        <button onClick={() => setViendoPerfil(false)} className="btn-outline-gold" style={{ marginBottom: '20px' }}>⬅ Volver a Citas</button>
        
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '15px' }}>👤 Mi Perfil (RF01)</h2>
          {!editandoPerfil ? (
            <div>
              <p><strong>RUT:</strong> {rut}</p>
              <p><strong>Teléfono:</strong> {telefono}</p>
              <p><strong>Correo:</strong> {email || <span style={{ color: '#e74c3c' }}>No registrado</span>}</p>
              <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => setEditandoPerfil(true)}>Editar Datos</button>
            </div>
          ) : (
            <form onSubmit={guardarPerfil}>
              <input type="text" className="input-field" value={rut} onChange={(e)=>setRut(e.target.value)} required placeholder="RUT" />
              <input type="tel" className="input-field" value={telefono} onChange={(e)=>setTelefono(e.target.value)} required placeholder="Teléfono" />
              <input type="email" className="input-field" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Correo Electrónico (Opcional)" />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setEditandoPerfil(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '15px' }}>🛍️ Historial de Compras (RF03)</h2>
          {historialCompras.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No tienes pedidos previos en la tienda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historialCompras.map(compra => (
                <div key={compra.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>Orden LR-{String(compra.id).padStart(4, '0')}</strong>
                    <span style={{ 
                      color: compra.estado === 'Pagado' || compra.estado === 'Entregado' ? 'var(--green-emerald-light)' : 
                             compra.estado === 'Cancelado' ? '#e74c3c' : 
                             'var(--gold-jewel)',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '0.85rem'
                    }}>{compra.estado}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Total: ${Number(compra.total).toLocaleString('es-CL')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '15px' }}>¡Cita Confirmada!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Revisa tu correo para los detalles (PHPMailer).</p>
          <button onClick={() => { setStep(1); setSelectedBarbero(null); setSelectedDia(null); setSelectedHora(null); setIsConfirmed(false); }} className="btn-primary" style={{ marginTop: '20px' }}>Agendar otra cita</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <button className="btn-outline-gold" onClick={() => setViendoPerfil(true)}>👤 Mi Perfil / Compras</button>
      </div>

      {(!session.usuario?.email) && (
        <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <h4 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>⚠️ Falta tu Correo Electrónico</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#fff' }}>Para recibir confirmaciones de citas y recibos de tus compras, por favor agrega tu correo en tu perfil.</p>
          <button className="btn-primary" onClick={() => { setViendoPerfil(true); setEditandoPerfil(true); }}>Agregar Correo</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: 'var(--gold-jewel)' }}>💈 1. Elegir Servicio</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {servicios.map(servicio => (
            <div key={servicio.id} 
              style={{ background: selectedServicios.includes(servicio.id) ? 'var(--green-emerald-dark)' : 'var(--bg-charcoal)', border: selectedServicios.includes(servicio.id) ? '1px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)', padding: '15px 10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }} 
              onClick={() => setSelectedServicios(prev => prev.includes(servicio.id) ? prev.filter(id => id !== servicio.id) : [...prev, servicio.id])}>
              <div style={{ fontWeight: selectedServicios.includes(servicio.id) ? 'bold' : 'normal', fontSize: '0.9rem' }}>{servicio.nombre}</div>
              <div style={{ color: 'var(--gold-jewel)' }}>${Number(servicio.precio).toLocaleString('es-CL')}</div>
            </div>
          ))}
        </div>
        {selectedServicios.length > 0 && step === 1 && <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={() => setStep(2)}>Continuar</button>}
      </div>

      {step >= 2 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--gold-jewel)' }}>👤 2. Elegir Barbero (RF02)</h3>
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
            {barberos.map(barbero => (
              <div key={barbero.id} style={{ textAlign: 'center', cursor: 'pointer', opacity: (selectedBarbero && selectedBarbero !== barbero.id) ? 0.5 : 1 }} onClick={() => { setSelectedBarbero(barbero.id); if (step === 2) setStep(3); }}>
                <img src={barbero.foto_perfil || `https://i.pravatar.cc/100?u=${barbero.id}`} alt={barbero.nombre} style={{ width: '70px', height: '70px', borderRadius: '50%', border: selectedBarbero === barbero.id ? '3px solid var(--green-emerald-light)' : '2px solid transparent' }} />
                <p style={{ fontSize: '0.9rem', color: selectedBarbero === barbero.id ? 'var(--green-emerald-light)' : '#fff' }}>{barbero.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step >= 3 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--gold-jewel)' }}>📅 3. Fecha (Calendario Deslizable)</h3>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {['Lun 12', 'Mar 13', 'Mie 14', 'Jue 15', 'Vie 16', 'Sáb 17'].map(day => (
              <div key={day} onClick={() => { setSelectedDia(day); if (step === 3) setStep(4); }} style={{ background: selectedDia === day ? 'var(--green-emerald-dark)' : 'var(--bg-charcoal)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', border: selectedDia === day ? '1px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)', minWidth: '80px', textAlign: 'center' }}>
                {day}
              </div>
            ))}
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--gold-jewel)' }}>⏰ 4. Bloque Horario Disponible (Cruce BD)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => {
              const isOccupied = horariosOcupados.includes(time + ':00'); // BD devuelve HH:MM:SS
              return (
                <div key={time} onClick={() => !isOccupied && setSelectedHora(time)} style={{ background: selectedHora === time ? 'var(--green-emerald-dark)' : (isOccupied ? 'rgba(231, 76, 60, 0.2)' : 'var(--bg-charcoal)'), padding: '10px', borderRadius: '8px', cursor: isOccupied ? 'not-allowed' : 'pointer', textAlign: 'center', border: selectedHora === time ? '1px solid var(--green-emerald-light)' : (isOccupied ? '1px solid rgba(231, 76, 60, 0.5)' : '1px solid rgba(255,255,255,0.1)'), color: isOccupied ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                  {time}
                </div>
              );
            })}
          </div>
          <button className="btn-primary" style={{ width: '100%', opacity: selectedHora ? 1 : 0.5 }} disabled={!selectedHora} onClick={handleConfirm}>
            Confirmar Cita
          </button>
        </div>
      )}
    </div>
  );
}
