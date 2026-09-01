import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { formatRut } from '../utils/rut';

export default function PortalCliente({ session, onBackToHome, onGoToTienda }) {
  // Citas State
  const [step, setStep] = useState(1);
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [selectedBarbero, setSelectedBarbero] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [selectedHora, setSelectedHora] = useState(null);
  
  // Cliente RUT State (Solo pide RUT)
  const [rut, setRut] = useState(session?.usuario?.rut || '');
  const [nombreCliente, setNombreCliente] = useState(session?.usuario?.nombre || '');
  const [telefonoCliente, setTelefonoCliente] = useState(session?.usuario?.telefono || '');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [buscandoRut, setBuscandoRut] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [metaCortesPremio, setMetaCortesPremio] = useState(3);

  // Generar próximos días a partir de hoy
  const [diasDisponibles, setDiasDisponibles] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api.php?action=get_servicios`).then(r => r.json()).then(data => setServicios(data || []));
    fetch(`${API_URL}/api.php?action=get_barberos`).then(r => r.json()).then(data => setBarberos(data || []));
    fetch(`${API_URL}/api.php?action=get_crm_config`).then(r => r.json()).then(data => {
      if (data?.meta_cortes_premio) setMetaCortesPremio(Number(data.meta_cortes_premio));
    }).catch(() => {});

    // Generar próximos 10 días dinámicamente
    const hoy = new Date();
    const listaDias = [];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() + i);
      const diaSemana = nombresDias[d.getDay()];
      const diaNum = d.getDate();
      const mes = nombresMeses[d.getMonth()];
      const fechaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
      
      listaDias.push({
        label: `${diaSemana} ${diaNum} ${mes}`,
        fecha: fechaStr
      });
    }
    setDiasDisponibles(listaDias);
    if (listaDias.length > 0) {
      setSelectedFecha(listaDias[0].fecha);
    }
  }, []);

  // Consultar horarios ocupados en tiempo real
  useEffect(() => {
    if (selectedBarbero && selectedFecha) {
      fetch(`${API_URL}/api.php?action=get_horarios_ocupados&trabajador_id=${selectedBarbero}&fecha=${selectedFecha}`)
        .then(r => r.json())
        .then(data => setHorariosOcupados(Array.isArray(data) ? data : []))
        .catch(() => setHorariosOcupados([]));
    }
  }, [selectedBarbero, selectedFecha]);

  // Manejar cambio y búsqueda de RUT / Nombre en tiempo real
  const handleRutChange = async (e) => {
    const rawVal = e.target.value;
    const formatted = formatRut(rawVal);
    setRut(formatted);

    const clean = rawVal.replace(/[^0-9kK]/g, '');
    if (clean.length >= 2) {
      setBuscandoRut(true);
      try {
        const resp = await fetch(`${API_URL}/api.php?action=search_clientes&q=${encodeURIComponent(clean)}`);
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setSugerencias(data);
          setShowDropdown(true);
          const exact = data.find(c => c.rut.replace(/[^0-9kK]/gi, '').toUpperCase() === clean.toUpperCase());
          if (exact) {
            setClienteEncontrado(exact);
            setNombreCliente(exact.nombre);
            setTelefonoCliente(exact.telefono || '');
          }
        } else {
          setSugerencias([]);
          setShowDropdown(false);
          if (clean.length >= 8) setClienteEncontrado(false);
        }
      } catch (err) {
        setSugerencias([]);
      } finally {
        setBuscandoRut(false);
      }
    } else {
      setSugerencias([]);
      setShowDropdown(false);
      setClienteEncontrado(null);
    }
  };

  const seleccionarSugerencia = (cli) => {
    setRut(cli.rut);
    setNombreCliente(cli.nombre);
    setTelefonoCliente(cli.telefono || '');
    setClienteEncontrado(cli);
    setSugerencias([]);
    setShowDropdown(false);
  };

  const totalServicios = servicios
    .filter(s => selectedServicios.includes(s.id))
    .reduce((sum, s) => sum + Number(s.precio), 0);

  const resetFormulario = () => {
    setStep(1);
    setSelectedServicios([]);
    setSelectedBarbero(null);
    setSelectedHora(null);
    setRut('');
    setNombreCliente('');
    setTelefonoCliente('');
    setClienteEncontrado(null);
    setSugerencias([]);
    setShowDropdown(false);
    setIsConfirmed(null);
  };

  const handleConfirm = async () => {
    if (!rut || rut.length < 8) {
      alert('Por favor, ingresa un RUT válido para tu cita.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/api.php?action=agendar_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: session?.usuario?.id || clienteEncontrado?.id || null,
          rut: rut,
          nombre: nombreCliente || (clienteEncontrado?.nombre || 'Cliente ' + rut.substring(0, 8)),
          telefono: telefonoCliente || null,
          trabajador_id: selectedBarbero,
          fecha: selectedFecha,
          hora: selectedHora,
          servicios: selectedServicios
        })
      });
      const data = await resp.json();
      if (data.status === 'success') {
        const barberoObj = barberos.find(b => b.id === selectedBarbero);
        setIsConfirmed({
          citaId: data.cita_id,
          barbero: barberoObj?.nombre || 'Barbero',
          fecha: selectedFecha,
          hora: selectedHora,
          total: totalServicios,
          cliente: nombreCliente || 'Cliente',
          rut: rut
        });

        // Limpiar completamente todos los campos del formulario para la próxima cita
        setStep(1);
        setSelectedServicios([]);
        setSelectedBarbero(null);
        setSelectedHora(null);
        setRut('');
        setNombreCliente('');
        setTelefonoCliente('');
        setClienteEncontrado(null);
        setSugerencias([]);
        setShowDropdown(false);
      } else {
        alert(data.error || 'Error agendando cita');
      }
    } catch (e) {
      alert('Error de conexión agendando la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VISTA DE COMPROBANTE DE CITA ---
  if (isConfirmed) {
    return (
      <div style={{ padding: '20px 10px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', border: '2px solid var(--green-emerald-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>✂️</div>
          <h2 style={{ color: 'var(--green-emerald-light)', marginBottom: '5px' }}>¡Cita Confirmada!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
            Presenta tu RUT en recepción al llegar.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '10px', textAlign: 'left', marginBottom: '18px', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>N° Cita:</span>
              <strong style={{ color: 'var(--gold-jewel)', fontSize: '1.1rem' }}>#CTA-{String(isConfirmed.citaId).padStart(4, '0')}</strong>
            </div>
            <div><strong>RUT:</strong> {isConfirmed.rut}</div>
            <div><strong>Cliente:</strong> {isConfirmed.cliente}</div>
            <div><strong>Barbero:</strong> {isConfirmed.barbero}</div>
            <div><strong>Fecha:</strong> {isConfirmed.fecha} a las {isConfirmed.hora} hrs</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '1.05rem' }}>
              <strong>Total a pagar:</strong>
              <strong style={{ color: 'var(--gold-jewel)' }}>${isConfirmed.total.toLocaleString('es-CL')}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-img-action" 
              style={{ width: '100%', maxWidth: '240px' }}
              onClick={resetFormulario}
            >
              <img src="/botones/boton_agendar_hora.png" alt="Agendar otra cita" style={{ height: '48px', objectFit: 'contain' }} />
            </button>

            {onGoToTienda && (
              <button 
                onClick={() => { resetFormulario(); onGoToTienda(); }} 
                className="btn-img-action" 
                style={{ width: '100%', maxWidth: '240px' }}
              >
                <img src="/botones/ver_catalogo.png" alt="Ver Catálogo" style={{ height: '46px', objectFit: 'contain' }} />
              </button>
            )}

            {onBackToHome && (
              <button 
                className="btn-img-action" 
                style={{ width: '100%', maxWidth: '160px', marginTop: '5px' }}
                onClick={() => { resetFormulario(); onBackToHome(); }}
              >
                <img src="/botones/boton_volver.png" alt="Volver" style={{ height: '38px', objectFit: 'contain' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 0', maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: 'var(--gold-jewel)', margin: 0, fontSize: '1.3rem' }}>✂️ Agendar tu Hora</h2>
        {onBackToHome && (
          <button className="btn-img-action" onClick={onBackToHome} style={{ width: '90px' }}>
            <img src="/botones/boton_volver.png" alt="Volver" style={{ height: '34px', objectFit: 'contain' }} />
          </button>
        )}
      </div>

      {/* --- PASO 1: SERVICIOS --- */}
      <div className="card" style={{ marginBottom: '15px' }}>
        <h3 style={{ marginBottom: '12px', color: 'var(--gold-jewel)', fontSize: '1.05rem' }}>
          💈 1. Selecciona Servicio(s)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          {servicios.map(servicio => {
            const isSelected = selectedServicios.includes(servicio.id);
            return (
              <div 
                key={servicio.id} 
                style={{ 
                  background: isSelected ? 'var(--green-emerald-dark)' : 'var(--bg-charcoal)', 
                  border: isSelected ? '2px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)', 
                  padding: '12px 8px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }} 
                onClick={() => setSelectedServicios(prev => prev.includes(servicio.id) ? prev.filter(id => id !== servicio.id) : [...prev, servicio.id])}
              >
                <div style={{ fontWeight: isSelected ? 'bold' : '500', fontSize: '0.85rem', marginBottom: '4px' }}>{servicio.nombre}</div>
                <div style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.95rem' }}>${Number(servicio.precio).toLocaleString('es-CL')}</div>
              </div>
            );
          })}
        </div>
        {selectedServicios.length > 0 && step === 1 && (
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.9rem' }}><strong>Subtotal:</strong> <span style={{ color: 'var(--gold-jewel)' }}>${totalServicios.toLocaleString('es-CL')}</span></div>
            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setStep(2)}>Siguiente ➔</button>
          </div>
        )}
      </div>

      {/* --- PASO 2: BARBERO --- */}
      {step >= 2 && (
        <div className="card" style={{ marginBottom: '15px' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--gold-jewel)', fontSize: '1.05rem' }}>👤 2. Elige tu Barbero</h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {barberos.map(barbero => {
              const isSelected = selectedBarbero === barbero.id;
              return (
                <div 
                  key={barbero.id} 
                  style={{ 
                    textAlign: 'center', 
                    cursor: 'pointer', 
                    flex: '0 0 auto', 
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(39, 174, 96, 0.15)' : 'transparent',
                    border: isSelected ? '2px solid var(--green-emerald-light)' : '1px solid transparent',
                    opacity: (selectedBarbero && !isSelected) ? 0.6 : 1
                  }} 
                  onClick={() => { setSelectedBarbero(barbero.id); if (step === 2) setStep(3); }}
                >
                  <img 
                    src={barbero.foto_perfil || `https://i.pravatar.cc/100?u=${barbero.id}`} 
                    alt={barbero.nombre} 
                    style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: isSelected ? '3px solid var(--gold-jewel)' : '2px solid rgba(255,255,255,0.2)' }} 
                  />
                  <p style={{ margin: '6px 0 0 0', fontWeight: 'bold', fontSize: '0.85rem', color: isSelected ? 'var(--gold-jewel)' : '#fff' }}>{barbero.nombre}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PASO 3: FECHA Y HORA --- */}
      {step >= 3 && (
        <div className="card" style={{ marginBottom: '15px' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--gold-jewel)', fontSize: '1.05rem' }}>📅 3. Fecha y Hora Disponible</h3>
          
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Elige el día:</label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '15px' }}>
            {diasDisponibles.map(d => {
              const isSelected = selectedFecha === d.fecha;
              return (
                <button
                  key={d.fecha}
                  type="button"
                  onClick={() => setSelectedFecha(d.fecha)}
                  style={{
                    background: isSelected ? 'var(--gold-jewel)' : 'var(--bg-charcoal)',
                    color: isSelected ? '#000' : '#fff',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8rem'
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Elige la hora:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '10px' }}>
            {['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(time => {
              const isOccupied = horariosOcupados.includes(time + ':00') || horariosOcupados.includes(time);
              const isSelected = selectedHora === time;
              return (
                <button
                  key={time}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => { setSelectedHora(time); if (step === 3) setStep(4); }}
                  style={{
                    background: isSelected ? 'var(--green-emerald-light)' : (isOccupied ? 'rgba(231, 76, 60, 0.1)' : 'var(--bg-charcoal)'),
                    color: isSelected ? '#000' : (isOccupied ? 'rgba(255,255,255,0.25)' : '#fff'),
                    fontWeight: isSelected ? 'bold' : 'normal',
                    padding: '8px 0',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--gold-jewel)' : (isOccupied ? '1px dashed rgba(231,76,60,0.3)' : '1px solid rgba(255,255,255,0.1)'),
                    cursor: isOccupied ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PASO 4: RUT DEL CLIENTE --- */}
      {step >= 4 && (
        <div className="card" style={{ marginBottom: '15px', border: '1px solid var(--gold-jewel)' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--gold-jewel)', fontSize: '1.05rem' }}>🪪 4. Ingresa tu RUT para confirmar</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
            Solo necesitamos tu RUT. Si ya eres cliente, cargará tu historial automáticamente.
          </p>

          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>RUT del Cliente:</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: 19123456-7" 
              value={rut} 
              onChange={handleRutChange}
              onFocus={() => sugerencias.length > 0 && setShowDropdown(true)}
              maxLength={12}
              style={{ fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 'bold' }}
              required 
            />
            {buscandoRut && <span style={{ fontSize: '0.75rem', color: 'var(--gold-jewel)' }}>🔍 Buscando en la base de datos...</span>}

            {/* DROPDOWN DE SUGERENCIAS DE AUTORRELLENADO */}
            {showDropdown && sugerencias.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '72px',
                left: 0,
                right: 0,
                background: '#1c1c1c',
                border: '2px solid var(--gold-jewel)',
                borderRadius: '8px',
                zIndex: 1500,
                boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ padding: '6px 12px', background: 'rgba(212,175,55,0.15)', fontSize: '0.75rem', color: 'var(--gold-jewel)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  👇 Clientes encontrados en La Romana (toca para autorrellenar):
                </div>
                {sugerencias.map(cli => (
                  <div
                    key={cli.id}
                    onClick={() => seleccionarSugerencia(cli)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(39, 174, 96, 0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>👤 {cli.nombre}</div>
                      <div style={{ color: 'var(--gold-jewel)', fontSize: '0.8rem' }}>RUT: {cli.rut}</div>
                    </div>
                    {cli.cortes_acumulados > 0 && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(39, 174, 96, 0.2)', color: 'var(--green-emerald-light)', padding: '2px 8px', borderRadius: '8px' }}>
                        ⭐ {cli.cortes_acumulados} cortes
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {clienteEncontrado && clienteEncontrado.nombre && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                  <span>👤 Nombre y Apellido:</span>
                  <span style={{ color: 'var(--green-emerald-light)', fontSize: '0.75rem', background: 'rgba(39, 174, 96, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                    ✨ Autorrellenado con éxito
                  </span>
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={nombreCliente} 
                  onChange={(e) => setNombreCliente(e.target.value)} 
                  style={{ border: '2px solid var(--green-emerald-light)', background: 'rgba(39, 174, 96, 0.1)', color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px' }}
                  required 
                />
                
                {/* VALIDAR SI FALTA EL TELÉFONO EN BD Y PEDIRLO POR ÚNICA VEZ */}
                {(!clienteEncontrado.telefono || clienteEncontrado.telefono.trim() === '') ? (
                  <div style={{ marginTop: '8px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid var(--gold-jewel)', padding: '10px 12px', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                      <span>📱 Agrega tu Teléfono / WhatsApp:</span>
                      <span style={{ fontSize: '0.75rem', color: '#fff' }}>(Para guardarlo en tu cuenta)</span>
                    </label>
                    <input 
                      type="tel" 
                      className="input-field" 
                      placeholder="Ej: +56912345678" 
                      value={telefonoCliente} 
                      onChange={(e) => setTelefonoCliente(e.target.value)} 
                      style={{ marginBottom: '0', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--gold-jewel)', color: '#fff', fontSize: '0.95rem' }}
                      required
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      * Te servirá para avisos de citas y órdenes de compra en la tienda.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '8px' }}>
                    📱 Teléfono registrado: <strong style={{ color: '#fff' }}>{clienteEncontrado.telefono}</strong>
                  </div>
                )}

                {clienteEncontrado.cortes_acumulados > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--green-emerald-light)', marginTop: '8px', background: 'rgba(46, 204, 113, 0.12)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                    ⭐ Tienes <strong>{clienteEncontrado.cortes_acumulados}</strong> cortes acumulados en La Romana.
                    <span style={{ display: 'block', color: 'var(--gold-jewel)', fontSize: '0.76rem', marginTop: '2px' }}>
                      🎁 ¡Premio / Decant de regalo cada {metaCortesPremio} cortes! (Progreso: {clienteEncontrado.cortes_acumulados % metaCortesPremio}/{metaCortesPremio})
                    </span>
                  </div>
                )}
              </div>
            )}

            {clienteEncontrado === false && rut.length >= 8 && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                  👤 Nombre y Apellido (Cliente Nuevo):
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ingresa tu Nombre y Apellido" 
                  value={nombreCliente} 
                  onChange={(e) => setNombreCliente(e.target.value)} 
                  required 
                  style={{ marginBottom: '10px' }}
                />

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                  📱 Teléfono / WhatsApp:
                </label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="Ej: +56912345678" 
                  value={telefonoCliente} 
                  onChange={(e) => setTelefonoCliente(e.target.value)} 
                  required 
                  style={{ marginBottom: '0' }}
                />
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              className="btn-img-action" 
              style={{ width: '100%', maxWidth: '280px', opacity: (!rut || !selectedHora || isSubmitting) ? 0.5 : 1 }} 
              disabled={!rut || !selectedHora || isSubmitting} 
              onClick={handleConfirm}
            >
              <img src="/botones/boton_agendar_hora.png" alt="Confirmar Cita" style={{ height: '52px', objectFit: 'contain' }} />
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-jewel)', marginTop: '6px', fontWeight: 'bold' }}>
              Total a pagar en local: ${totalServicios.toLocaleString('es-CL')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
