import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

export default function PosTrabajador({ session }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [agendados, setAgendados] = useState([]);
  
  // States for Express Booking
  const [showExpress, setShowExpress] = useState(false);
  const [expressData, setExpressData] = useState({ nombre: '', rut: '', hora: '14:00' });

  // States for Payment
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [aromaVIP, setAromaVIP] = useState('');

  // States for Worker Payments View
  const [showMisPagos, setShowMisPagos] = useState(false);
  const [misPagosList, setMisPagosList] = useState([]);
  const [loadingMisPagos, setLoadingMisPagos] = useState(false);

  const fetchMisPagos = async () => {
    if (!session?.usuario?.id) return;
    setLoadingMisPagos(true);
    try {
      const res = await fetch(`${API_URL}/api.php?action=get_mis_pagos_trabajador&trabajador_id=${session.usuario.id}`);
      const data = await res.json();
      setMisPagosList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching mis pagos:", e);
    } finally {
      setLoadingMisPagos(false);
    }
  };

  const fetchAgenda = () => {
    if (session?.usuario?.id) {
      fetch(`${API_URL}/api.php?action=get_citas_trabajador&trabajador_id=${session.usuario.id}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error) setAgendados(data);
        })
        .catch(e => console.error("Error fetching citas:", e));
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [session]);

  const handleCambiarClave = async () => {
    const newPass = prompt("Ingresa tu nueva contraseña secreta:");
    if (!newPass) return;
    
    try {
      const res = await fetch(`${API_URL}/api.php?action=update_password_trabajador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trabajador_id: session.usuario.id, new_password: newPass })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("¡Tu contraseña ha sido actualizada exitosamente!");
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Error cambiando contraseña.");
    }
  };

  const handleAgendarExpress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api.php?action=agendar_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: expressData.rut,
          nombre: expressData.nombre,
          trabajador_id: session.usuario.id,
          fecha: new Date().toISOString().split('T')[0],
          hora: expressData.hora,
          servicios: [1] // dummy default service ID for express
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Cita agendada con éxito");
        setShowExpress(false);
        fetchAgenda();
      } else {
        alert(data.error || "Error al agendar");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red");
    }
  };

  const checkVip = () => {
    const isVip = selectedClient.cortes === 4;
    if (isVip && !aromaVIP) {
      alert("❌ ERROR (RF04): Debes seleccionar obligatoriamente el aroma del decant entregado al cliente VIP antes de poder cerrar la cita.");
      return false;
    }
    return true;
  };

  const handleCobrarAqui = async () => {
    if (!checkVip()) return;
    try {
      const res = await fetch(`${API_URL}/api.php?action=finalizar_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cita_id: selectedClient.id,
          descuento: descuento,
          metodo_pago: metodoPago
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsPaid(true);
        setTimeout(() => {
          setIsPaid(false);
          setSelectedClient(null);
          setAromaVIP('');
          fetchAgenda();
        }, 2500);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDerivarCaja = async () => {
    if (!checkVip()) return;
    try {
      const res = await fetch(`${API_URL}/api.php?action=derivar_a_caja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cita_id: selectedClient.id
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Cliente derivado a caja. El administrador finalizará el pago.");
        setSelectedClient(null);
        setAromaVIP('');
        fetchAgenda();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (selectedClient) {
    if (isPaid) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💳</div>
            <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '15px' }}>¡Cobro Realizado!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>El pago se ha procesado con éxito y la cita se cerró.</p>
          </div>
        </div>
      );
    }

    const isVip = selectedClient.cortes === 4;
    return (
      <div style={{ padding: '20px 0' }}>
        <button onClick={() => setSelectedClient(null)} className="btn-img-action" style={{ width: '120px', marginBottom: '15px' }}>
          <img src="/botones/boton_volver.png" alt="Volver a Agenda" style={{ height: '36px', objectFit: 'contain' }} />
        </button>

        <div className={`card ${isVip ? 'vip-alert' : ''}`} style={{ textAlign: 'center', marginBottom: '20px' }}>
          {isVip && (
            <div style={{ padding: '15px', marginBottom: '20px', background: 'var(--gold-jewel)', color: '#000', borderRadius: '8px', animation: 'vip-pulse 1s infinite', border: '2px solid #FFF' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>¡ALERTA VIP (RF04): 4to Corte Alcanzado!</h3>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '1.1rem' }}>Entregar Decant de 10ml</p>
            </div>
          )}
          
          <img 
            src={selectedClient.foto || 'https://via.placeholder.com/100'} 
            alt={selectedClient.nombre} 
            style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px', objectFit: 'cover', border: isVip ? '3px solid var(--gold-jewel)' : '2px solid transparent' }} 
          />
          <h2 style={{ marginBottom: '5px' }}>{selectedClient.nombre}</h2>
          <div style={{ display: 'inline-block', background: 'var(--bg-charcoal)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--gold-jewel)' }}>
            Cortes: {selectedClient.cortes}/4
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--gold-jewel)' }}>Cierre de Cita</h3>
          
          {isVip && (
            <div style={{ marginBottom: '20px', background: 'rgba(212, 175, 55, 0.1)', padding: '15px', borderRadius: '10px', border: '1px solid var(--gold-jewel)' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>Seleccionar Aroma (Obligatorio - RF04)</label>
              <select className="input-field" style={{ appearance: 'none' }} value={aromaVIP} onChange={e=>setAromaVIP(e.target.value)}>
                <option value="">-- Elige el Decant entregado --</option>
                <option value="creed">Creed Aventus</option>
                <option value="tomford">Tom Ford Oud Wood</option>
                <option value="dior">Dior Sauvage Elixir</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Servicios Realizados (Toggle)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {['Corte de pelo degradado ($14.000)', 'Corte clásico ($12.000)', 'Corte de Barba ($8.000)', 'Corte y barba ($20.000)'].map(servicio => (
                <label key={servicio} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-charcoal)', padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <input type="checkbox" style={{ width: '25px', height: '25px', accentColor: 'var(--green-emerald-light)', cursor: 'pointer' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{servicio}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '20px' }}>
             <h4 style={{ color: 'var(--gold-jewel)', marginTop: 0 }}>Opciones de Pago</h4>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Descuento Manual ($)</label>
                   <input type="number" className="input-field" value={descuento} onChange={e => setDescuento(e.target.value)} placeholder="Ej: 2000" />
                </div>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Método de Pago</label>
                   <select className="input-field" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                     <option value="Efectivo">Efectivo</option>
                     <option value="Transferencia">Transferencia</option>
                     <option value="Tarjeta">Tarjeta</option>
                   </select>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center' }}>
             <button onClick={handleDerivarCaja} className="btn-romana" style={{ flex: 1, backgroundColor: 'transparent', height: '48px' }}>
                <span className="icon-separator">📥</span> DERIVAR A CAJA
             </button>
             <button onClick={handleCobrarAqui} className="btn-img-action" style={{ flex: 1, maxWidth: '200px' }}>
                <img src="/botones/boton_cobrar.png" alt="Cobrar Aquí" style={{ height: '48px', objectFit: 'contain' }} />
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: 'var(--gold-jewel)', margin: 0 }}>Mi Agenda (Hoy)</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
           <button className="btn-romana" style={{ fontSize: '0.8rem', padding: '6px 14px', backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: '#2ecc71', color: '#2ecc71' }} onClick={() => { setShowMisPagos(true); fetchMisPagos(); }}>
             <span className="icon-separator" style={{ minHeight: '22px', fontSize: '1.1rem', paddingRight: '6px', marginRight: '6px' }}>💰</span> MIS PAGOS
           </button>
           <button className="btn-img-action" style={{ width: '130px' }} onClick={() => setShowExpress(!showExpress)}>
             <img src="/botones/boton_agendar_hora.png" alt="Agendar" style={{ height: '38px', objectFit: 'contain' }} />
           </button>
           <button className="btn-romana" style={{ fontSize: '0.8rem', padding: '5px 15px', backgroundColor: 'transparent' }} onClick={handleCambiarClave}>
             <span className="icon-separator" style={{ minHeight: '25px', fontSize: '1.2rem', paddingRight: '10px', marginRight: '10px' }}>🔐</span> CLAVE
           </button>
        </div>
      </div>

      {showExpress && (
         <div className="card" style={{ marginBottom: '20px', background: 'var(--bg-charcoal)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--gold-jewel)' }}>Agendar Cliente Nuevo</h3>
            <form onSubmit={handleAgendarExpress} style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <label>RUT (Sin puntos ni guión)</label>
                 <input type="text" className="input-field" required value={expressData.rut} onChange={e => setExpressData({...expressData, rut: e.target.value})} placeholder="123456789" />
               </div>
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <label>Nombre del Cliente</label>
                 <input type="text" className="input-field" required value={expressData.nombre} onChange={e => setExpressData({...expressData, nombre: e.target.value})} placeholder="Juan Pérez" />
               </div>
               <div style={{ width: '120px' }}>
                 <label>Hora</label>
                 <input type="time" className="input-field" required value={expressData.hora} onChange={e => setExpressData({...expressData, hora: e.target.value})} />
               </div>
               <button type="submit" className="btn-romana" style={{ height: '42px', padding: '0 20px', borderRadius: '8px' }}>AGENDAR</button>
            </form>
         </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {agendados.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay citas agendadas para hoy.</p>}
        {agendados.map(cliente => (
          <div 
            key={cliente.id} 
            className="card" 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', borderLeft: cliente.estado === 'Terminado_Esperando_Pago' ? '4px solid var(--gold-jewel)' : 'none' }}
            onClick={() => cliente.estado === 'Pendiente' ? setSelectedClient(cliente) : alert('Esta cita ya fue derivada a caja.')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src={cliente.foto || 'https://via.placeholder.com/60'} alt={cliente.nombre} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ margin: 0 }}>{cliente.nombre}</h3>
                <span style={{ color: 'var(--gold-jewel)', fontSize: '0.9rem' }}>Cortes: {cliente.cortes}/4</span>
                {cliente.estado === 'Terminado_Esperando_Pago' && <div style={{ fontSize: '0.8rem', color: '#ffb74d', marginTop: '4px' }}>Esperando Pago en Caja</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{cliente.hora}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Mis Pagos */}
      {showMisPagos && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>💰</span>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.15rem' }}>Mis Pagos y Liquidaciones</h3>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Historial de pagos recibidos de la administración</span>
                </div>
              </div>
              <button 
                onClick={() => setShowMisPagos(false)} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Total Liquidado Histórico:</span>
              <strong style={{ fontSize: '1.2rem', color: '#2ecc71' }}>
                ${misPagosList.reduce((sum, p) => sum + Number(p.monto || 0), 0).toLocaleString('es-CL')}
              </strong>
            </div>

            {loadingMisPagos ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>Cargando pagos...</div>
            ) : misPagosList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                No tienes pagos de liquidación registrados aún.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {misPagosList.map((p) => (
                  <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        📅 Pagado: {p.fecha_pago}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2ecc71' }}>
                        ${Number(p.monto).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>
                      <strong>Período:</strong> {p.periodo_inicio} al {p.periodo_fin}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', gap: '15px' }}>
                      <span><strong>Método:</strong> {p.metodo_pago}</span>
                      {p.numero_comprobante && <span><strong>N° Operación:</strong> {p.numero_comprobante}</span>}
                    </div>
                    {p.notas && (
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px', fontStyle: 'italic' }}>
                        "{p.notas}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button className="btn-outline-gold" onClick={() => setShowMisPagos(false)} style={{ padding: '8px 20px' }}>
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
