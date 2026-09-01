import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { formatRut } from '../utils/rut';

const ProductoCard = ({ p, agregarAlCarrito }) => {
  const images = p.imagen_url ? p.imagen_url.split(',').map(url => url.trim()).filter(url => url) : [];
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', padding: '15px' }}>
      {images.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: '140px', marginBottom: '12px' }}>
          <img src={images[imgIndex]} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          {images.length > 1 && (
            <>
              <button onClick={prevImg} style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>‹</button>
              <button onClick={nextImg} style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>›</button>
              <div style={{ position: 'absolute', bottom: '5px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '3px' }}>
                {images.map((_, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === imgIndex ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.5)' }} />)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛍️</div>
      )}
      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px', flex: 1 }}>{p.nombre}</div>
      <div style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>${Number(p.precio).toLocaleString('es-CL')}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Stock disponible: {p.stock}</div>
      <button 
        className="btn-outline-gold" 
        style={{ padding: '8px 12px', width: '100%', opacity: p.stock <= 0 ? 0.5 : 1 }} 
        onClick={() => agregarAlCarrito(p)} 
        disabled={p.stock <= 0}
      >
        {p.stock > 0 ? '🛒 Añadir al Carrito' : 'Agotado'}
      </button>
    </div>
  );
};

export default function Tienda({ session, onNuevoPedido, onBackToHome, onGoToCitas }) {
  const [carrito, setCarrito] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(['Más Vendidos']);
  const [catSeleccionada, setCatSeleccionada] = useState('Más Vendidos');

  // Datos para compra / ticket
  const [rutCliente, setRutCliente] = useState(session?.usuario?.rut || '');
  const [nombreCliente, setNombreCliente] = useState(session?.usuario?.nombre || '');
  const [telefonoCliente, setTelefonoCliente] = useState(session?.usuario?.telefono || '');
  const [metodoPago, setMetodoPago] = useState('local'); // 'local' o 'transferencia'
  const [buscandoRut, setBuscandoRut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda de Tickets
  const [modalTickets, setModalTickets] = useState(false);
  const [rutBusquedaTickets, setRutBusquedaTickets] = useState(session?.usuario?.rut || '');
  const [sugerenciasTickets, setSugerenciasTickets] = useState([]);
  const [showDropdownTickets, setShowDropdownTickets] = useState(false);
  const [pedidosEncontrados, setPedidosEncontrados] = useState(null);
  const [cargandoTickets, setCargandoTickets] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api.php?action=get_productos`)
      .then(r => r.json())
      .then(data => {
        setProductos(data || []);
        const uniqueCats = [...new Set((data || []).map(p => p.categoria).filter(Boolean))];
        setCategorias(['Más Vendidos', ...uniqueCats]);
      })
      .catch(e => console.error(e));
  }, []);

  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRutChange = async (e) => {
    const rawVal = e.target.value;
    const formatted = formatRut(rawVal);
    setRutCliente(formatted);

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
            if (exact.telefono) setTelefonoCliente(exact.telefono);
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
    setRutCliente(cli.rut);
    setNombreCliente(cli.nombre);
    if (cli.telefono) setTelefonoCliente(cli.telefono);
    setClienteEncontrado(cli);
    setSugerencias([]);
    setShowDropdown(false);
  };

  // Manejo de búsqueda de tickets
  const handleRutBusquedaTickets = async (e) => {
    const rawVal = e.target.value;
    const formatted = formatRut(rawVal);
    setRutBusquedaTickets(formatted);

    const clean = rawVal.replace(/[^0-9kK]/g, '');
    if (clean.length >= 2) {
      try {
        const resp = await fetch(`${API_URL}/api.php?action=search_clientes&q=${encodeURIComponent(clean)}`);
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setSugerenciasTickets(data);
          setShowDropdownTickets(true);
        } else {
          setSugerenciasTickets([]);
          setShowDropdownTickets(false);
        }
      } catch (err) {
        setSugerenciasTickets([]);
      }
    } else {
      setSugerenciasTickets([]);
      setShowDropdownTickets(false);
    }
  };

  const consultarTickets = async (rutConsultar) => {
    const rutFinal = rutConsultar || rutBusquedaTickets;
    if (!rutFinal || rutFinal.length < 3) return;

    setCargandoTickets(true);
    setShowDropdownTickets(false);
    try {
      const resp = await fetch(`${API_URL}/api.php?action=get_pedidos_by_rut&rut=${encodeURIComponent(rutFinal)}`);
      const data = await resp.json();
      setPedidosEncontrados(data);
    } catch (err) {
      alert('Error consultando tickets.');
    } finally {
      setCargandoTickets(false);
    }
  };

  const productosMostrar = catSeleccionada === 'Más Vendidos' 
    ? [...productos].sort((a,b) => (b.ventas || 0) - (a.ventas || 0)).slice(0, 12)
    : productos.filter(p => p.categoria === catSeleccionada);

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === prod.id);
      if (existe) return prev.map(item => item.id === prod.id ? {...item, cantidad: item.cantidad + 1} : item);
      return [...prev, {...prod, cantidad: 1}];
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const finalizarPedido = async () => {
    if (isSubmitting) return;
    if (!rutCliente || rutCliente.length < 8) {
      alert('Por favor, ingresa tu RUT para emitir tu orden / ticket.');
      return;
    }
    if (!nombreCliente) {
      alert('Por favor, ingresa tu Nombre.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/api.php?action=nuevo_pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: session?.usuario?.id || null,
          rut: rutCliente,
          nombre: nombreCliente,
          telefono: telefonoCliente,
          total: total,
          metodo_pago: metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo',
          carrito: carrito
        })
      });
      const data = await resp.json();
      
      if (data.status === 'success') {
        const idPedido = `LR-${String(data.pedido_id).padStart(4, '0')}`;
        setPedidoConfirmado({
          id: idPedido,
          total: total,
          items: [...carrito],
          metodoPago: metodoPago,
          rut: rutCliente,
          nombre: nombreCliente
        });
        setCarrito([]);
        setRutCliente('');
        setNombreCliente('');
        setTelefonoCliente('');
        setClienteEncontrado(null);
        setSugerencias([]);
        setShowDropdown(false);
        setIsCheckingOut(false);
        
        if (onNuevoPedido) {
          onNuevoPedido({ id: idPedido, total, items: carrito.length, fecha: new Date() });
        }
      } else {
        alert(data.error || 'Error procesando pedido.');
      }
    } catch (e) {
      alert('Error guardando pedido en BD.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VISTA DE TICKET DE COMPRA CONFIRMADA ---
  if (pedidoConfirmado) {
    return (
      <div style={{ padding: '30px 15px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
        <div className="card" style={{ border: '2px solid var(--gold-jewel)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🧾</div>
          <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '5px' }}>¡Ticket de Compra Generado!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Orden: <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{pedidoConfirmado.id}</strong>
          </p>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', textAlign: 'left', marginBottom: '20px', fontSize: '0.9rem' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '10px' }}>
              <div><strong>Cliente:</strong> {pedidoConfirmado.nombre} ({pedidoConfirmado.rut})</div>
              <div><strong>Modalidad de Pago:</strong> {pedidoConfirmado.metodoPago === 'transferencia' ? '🏦 Transferencia Bancaria' : '🏪 Pago en Local'}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong>Detalle de Productos:</strong>
              {pedidoConfirmado.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span>${(it.precio * it.cantidad).toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>Total a pagar:</span>
              <span style={{ color: 'var(--gold-jewel)' }}>${pedidoConfirmado.total.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* DATOS DE TRANSFERENCIA */}
          {pedidoConfirmado.metodoPago === 'transferencia' ? (
            <div style={{ background: 'rgba(39, 174, 96, 0.15)', border: '1px solid var(--green-emerald-light)', borderRadius: '10px', padding: '15px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem', lineHeight: '1.6' }}>
              <h4 style={{ color: 'var(--green-emerald-light)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏦 Datos para Transferir:
              </h4>
              <div><strong>Banco:</strong> Banco Estado / Banco de Chile</div>
              <div><strong>Tipo de Cuenta:</strong> Cuenta Corriente</div>
              <div><strong>N° Cuenta:</strong> 1234567890</div>
              <div><strong>RUT:</strong> 76.543.210-K</div>
              <div><strong>Titular:</strong> La Romana Barbería S.P.A</div>
              <div><strong>Correo de Comprobante:</strong> pagos@laromana.cl</div>
              <div style={{ marginTop: '8px', color: 'var(--gold-jewel)' }}>
                * En el asunto o glosa de la transferencia, coloca tu número de orden: <strong>{pedidoConfirmado.id}</strong>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(218, 165, 32, 0.15)', border: '1px solid var(--gold-jewel)', borderRadius: '10px', padding: '15px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem' }}>
              🏪 <strong>Pago en el Local:</strong> Acércate a la caja en la barbería con tu código de ticket <strong>{pedidoConfirmado.id}</strong> o tu RUT para pagar y retirar tus productos.
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={() => setPedidoConfirmado(null)}>
            Seguir Comprando
          </button>
          {onGoToCitas && (
            <button className="btn-outline-gold" style={{ width: '100%' }} onClick={onGoToCitas}>
              ✂️ Agendar una Hora de Corte
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '15px 0', position: 'relative', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: 'var(--gold-jewel)', margin: 0, fontSize: '1.3rem' }}>🛍️ Catálogo de Productos</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Botón Buscar Ticket / Mis Pedidos */}
          <button 
            onClick={() => setModalTickets(true)} 
            className="btn-img-action" 
            title="Mis Tickets"
            style={{ width: '130px' }}
          >
            <img src="/botones/mis_pedidos.png" alt="Mis Pedidos" style={{ height: '38px', objectFit: 'contain' }} />
          </button>

          {carrito.length > 0 && (
            <button 
              onClick={() => setIsCheckingOut(true)}
              className="btn-img-action"
              style={{ width: '130px' }}
              title={`Ver Carrito (${carrito.reduce((sum, i) => sum + i.cantidad, 0)} ítems)`}
            >
              <img src="/botones/ver_carrito.png" alt="Ver Carrito" style={{ height: '38px', objectFit: 'contain' }} />
            </button>
          )}
          {onGoToCitas && (
            <button onClick={onGoToCitas} className="btn-outline-gold" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              ✂️ Citas
            </button>
          )}
          {onBackToHome && (
            <button className="btn-img-action" onClick={onBackToHome} style={{ width: '80px' }}>
              <img src="/botones/boton_volver.png" alt="Volver" style={{ height: '34px', objectFit: 'contain' }} />
            </button>
          )}
        </div>
      </div>
      
      {/* Categorías */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
        {categorias.map(cat => (
          <button 
            key={cat} 
            onClick={() => setCatSeleccionada(cat)}
            className={catSeleccionada === cat ? 'btn-primary' : 'btn-outline-gold'}
            style={{ padding: '6px 14px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {productos.length === 0 ? <p>Cargando catálogo...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {productosMostrar.map(p => (
            <ProductoCard key={p.id} p={p} agregarAlCarrito={agregarAlCarrito} />
          ))}
        </div>
      )}

      {/* Botón Flotante de Carrito Seguro y Centrado */}
      {carrito.length > 0 && !isCheckingOut && (
        <div style={{ 
          position: 'fixed', 
          bottom: '75px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1200, 
          width: '92%', 
          maxWidth: '420px' 
        }}>
          <button 
            className="btn-primary" 
            style={{ 
              width: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '14px 20px', 
              borderRadius: '50px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 20px rgba(39, 174, 96, 0.4)', 
              fontSize: '1rem', 
              fontWeight: 'bold',
              border: '2px solid var(--gold-jewel)',
              cursor: 'pointer'
            }} 
            onClick={() => setIsCheckingOut(true)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛒 <span>{carrito.reduce((sum, i) => sum + i.cantidad, 0)} {carrito.reduce((sum, i) => sum + i.cantidad, 0) === 1 ? 'ítem' : 'ítems'}</span>
            </span>
            <span style={{ color: '#fff', fontSize: '0.95rem' }}>
              Ver Carrito (${total.toLocaleString('es-CL')}) ➔
            </span>
          </button>
        </div>
      )}

      {/* --- MODAL PARA BUSCAR TICKETS DE COMPRA --- */}
      {modalTickets && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <h3 style={{ color: 'var(--gold-jewel)', margin: 0, fontSize: '1.15rem' }}>🧾 Consultar Mis Tickets</h3>
              <button onClick={() => { setModalTickets(false); setPedidosEncontrados(null); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Ingresa tu RUT para consultar tus compras, órdenes y tickets pendientes o pagados.
            </p>

            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>RUT del Cliente:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: 19123456-7" 
                  value={rutBusquedaTickets} 
                  onChange={handleRutBusquedaTickets}
                  onFocus={() => sugerenciasTickets.length > 0 && setShowDropdownTickets(true)}
                  style={{ marginBottom: 0, fontSize: '1.05rem', fontWeight: 'bold' }}
                />
                <button 
                  onClick={() => consultarTickets()} 
                  className="btn-primary" 
                  style={{ padding: '0 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                  disabled={cargandoTickets}
                >
                  {cargandoTickets ? 'Buscando...' : '🔍 Buscar'}
                </button>
              </div>

              {/* DROPDOWN DE SUGERENCIAS EN BÚSQUEDA DE TICKETS */}
              {showDropdownTickets && sugerenciasTickets.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '65px',
                  left: 0,
                  right: 0,
                  background: '#1c1c1c',
                  border: '2px solid var(--gold-jewel)',
                  borderRadius: '8px',
                  zIndex: 1500,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '6px 10px', background: 'rgba(212,175,55,0.15)', fontSize: '0.75rem', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                    👇 Toca tu nombre para ver tus tickets:
                  </div>
                  {sugerenciasTickets.map(cli => (
                    <div
                      key={cli.id}
                      onClick={() => {
                        setRutBusquedaTickets(cli.rut);
                        setShowDropdownTickets(false);
                        consultarTickets(cli.rut);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(39, 174, 96, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>👤 {cli.nombre}</div>
                        <div style={{ color: 'var(--gold-jewel)', fontSize: '0.75rem' }}>RUT: {cli.rut}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESULTADOS DE TICKETS */}
            {pedidosEncontrados && (
              <div>
                {pedidosEncontrados.found ? (
                  <div>
                    <div style={{ background: 'rgba(39, 174, 96, 0.15)', border: '1px solid var(--green-emerald-light)', padding: '10px 12px', borderRadius: '8px', marginBottom: '15px' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        👤 {pedidosEncontrados.cliente.nombre}
                      </div>
                      <div style={{ color: 'var(--gold-jewel)', fontSize: '0.8rem' }}>
                        RUT: {pedidosEncontrados.cliente.rut} • Total Pedidos: {pedidosEncontrados.pedidos.length}
                      </div>
                    </div>

                    {pedidosEncontrados.pedidos.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                        No tienes compras previas registradas con este RUT.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pedidosEncontrados.pedidos.map(ped => {
                          const idTicket = `LR-${String(ped.id).padStart(4, '0')}`;
                          const isEntregado = ped.estado === 'Entregado';
                          const isPreparando = ped.estado === 'Preparando';
                          const isCancelado = ped.estado === 'Cancelado';

                          return (
                            <div 
                              key={ped.id} 
                              style={{ 
                                background: 'rgba(255,255,255,0.04)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '10px', 
                                padding: '12px',
                                lineHeight: '1.5'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                                <strong style={{ color: 'var(--gold-jewel)', fontSize: '1rem' }}>Ticket {idTicket}</strong>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  background: isEntregado ? 'rgba(39, 174, 96, 0.2)' : isPreparando ? 'rgba(41, 128, 185, 0.2)' : isCancelado ? 'rgba(231, 76, 60, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                                  color: isEntregado ? 'var(--green-emerald-light)' : isPreparando ? '#3498db' : isCancelado ? '#e74c3c' : 'var(--gold-jewel)',
                                  border: `1px solid ${isEntregado ? 'var(--green-emerald-light)' : isPreparando ? '#3498db' : isCancelado ? '#e74c3c' : 'var(--gold-jewel)'}`
                                }}>
                                  {ped.estado || 'Pendiente'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                📅 Fecha: {new Date(ped.fecha_creacion).toLocaleString('es-CL')}
                              </div>

                              <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '8px' }}>
                                <strong>Items:</strong> {ped.detalle_items || 'Productos varios'}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
                                <strong style={{ color: 'var(--gold-jewel)' }}>${Number(ped.total).toLocaleString('es-CL')}</strong>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                    ❌ No encontramos clientes registrados con ese RUT.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DE CHECKOUT / TICKET --- */}
      {isCheckingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--gold-jewel)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <h3 style={{ color: 'var(--gold-jewel)', margin: 0 }}>🛒 Tu Carrito y Checkout</h3>
              <button onClick={() => setIsCheckingOut(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Lista de Items */}
            <div style={{ marginBottom: '15px' }}>
              {carrito.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.nombre}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.cantidad} x ${Number(item.precio).toLocaleString('es-CL')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--green-emerald-light)' }}>
                      ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                    </span>
                    <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
              <span>Total Orden:</span>
              <span style={{ color: 'var(--gold-jewel)' }}>${total.toLocaleString('es-CL')}</span>
            </div>

            {/* Formulario de Identificación con RUT */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', marginBottom: '15px', position: 'relative' }}>
              <h4 style={{ color: 'var(--gold-jewel)', margin: '0 0 10px 0', fontSize: '0.95rem' }}>🪪 Datos del Comprador</h4>
              
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>RUT (ej: 19123456-7):</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="RUT del cliente" 
                  value={rutCliente} 
                  onChange={handleRutChange}
                  onFocus={() => sugerencias.length > 0 && setShowDropdown(true)}
                  maxLength={12}
                  required 
                  style={{ marginBottom: '0' }}
                />
                {buscandoRut && <div style={{ fontSize: '0.75rem', color: 'var(--gold-jewel)', marginTop: '4px' }}>🔍 Buscando...</div>}

                {/* DROPDOWN DE SUGERENCIAS */}
                {showDropdown && sugerencias.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '65px',
                    left: 0,
                    right: 0,
                    background: '#1c1c1c',
                    border: '2px solid var(--gold-jewel)',
                    borderRadius: '8px',
                    zIndex: 1500,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ padding: '6px 10px', background: 'rgba(212,175,55,0.15)', fontSize: '0.75rem', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                      👇 Sugerencias encontradas (toca para autorrellenar):
                    </div>
                    {sugerencias.map(cli => (
                      <div
                        key={cli.id}
                        onClick={() => seleccionarSugerencia(cli)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(39, 174, 96, 0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>👤 {cli.nombre}</div>
                          <div style={{ color: 'var(--gold-jewel)', fontSize: '0.75rem' }}>RUT: {cli.rut}</div>
                        </div>
                        {cli.cortes_acumulados > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--green-emerald-light)' }}>⭐ {cli.cortes_acumulados} cortes</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre Completo:</label>
                {clienteEncontrado && clienteEncontrado.nombre && (
                  <span style={{ color: 'var(--green-emerald-light)', fontSize: '0.75rem', background: 'rgba(39, 174, 96, 0.2)', padding: '2px 6px', borderRadius: '10px' }}>
                    ✨ Autorrellenado con éxito
                  </span>
                )}
              </div>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Tu Nombre y Apellido" 
                value={nombreCliente} 
                onChange={(e) => setNombreCliente(e.target.value)} 
                required 
                style={{ 
                  marginBottom: '10px',
                  border: clienteEncontrado?.nombre ? '1px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)'
                }}
              />

              {/* VALIDACIÓN DE TELÉFONO EN TIENDA */}
              {clienteEncontrado && (!clienteEncontrado.telefono || clienteEncontrado.telefono.trim() === '') ? (
                <div style={{ marginTop: '5px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid var(--gold-jewel)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                    <span>📱 Falta tu Teléfono / WhatsApp:</span>
                    <span style={{ fontSize: '0.7rem', color: '#fff' }}>(Para avisos de tu orden)</span>
                  </label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="Ej: +56912345678" 
                    value={telefonoCliente} 
                    onChange={(e) => setTelefonoCliente(e.target.value)} 
                    style={{ marginBottom: '0', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--gold-jewel)', color: '#fff' }}
                    required 
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Teléfono / WhatsApp:</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="+569..." 
                    value={telefonoCliente} 
                    onChange={(e) => setTelefonoCliente(e.target.value)} 
                    style={{ marginBottom: '0' }}
                  />
                </div>
              )}
            </div>

            {/* Selección de Método de Pago */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--gold-jewel)' }}>
                💳 ¿Cómo deseas pagar tu pedido?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: metodoPago === 'local' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: metodoPago === 'local' ? '2px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="radio" name="metodoPago" value="local" checked={metodoPago === 'local'} onChange={() => setMetodoPago('local')} />
                    <div>
                      <strong>🏪 Pagar en el Local</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Efectivo o Tarjeta al retirar en barbería</div>
                    </div>
                  </div>
                  <img src="/botones/pagar_local.png" alt="Pagar en Local" style={{ height: '36px', objectFit: 'contain' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: metodoPago === 'transferencia' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: metodoPago === 'transferencia' ? '2px solid var(--green-emerald-light)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="radio" name="metodoPago" value="transferencia" checked={metodoPago === 'transferencia'} onChange={() => setMetodoPago('transferencia')} />
                    <div>
                      <strong>🏦 Transferencia Bancaria</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Datos directos para comprobante inmediato</div>
                    </div>
                  </div>
                  <img src="/botones/transferir.png" alt="Transferir" style={{ height: '36px', objectFit: 'contain' }} />
                </label>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '1rem', opacity: isSubmitting ? 0.7 : 1 }} 
              onClick={finalizarPedido} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generando Ticket...' : `Generar Ticket de Compra ($${total.toLocaleString('es-CL')})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
