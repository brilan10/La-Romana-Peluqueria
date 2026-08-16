import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

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
    <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
      {images.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: '120px', marginBottom: '10px' }}>
          <img src={images[imgIndex]} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          {images.length > 1 && (
            <>
              <button onClick={prevImg} style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>‹</button>
              <button onClick={nextImg} style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>›</button>
              <div style={{ position: 'absolute', bottom: '5px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '3px' }}>
                {images.map((_, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === imgIndex ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.5)' }} />)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛍️</div>
      )}
      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', flex: 1 }}>{p.nombre}</div>
      <div style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', marginBottom: '5px' }}>${Number(p.precio).toLocaleString('es-CL')}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Stock: {p.stock}</div>
      <button className="btn-outline-gold" style={{ padding: '8px', opacity: p.stock <= 0 ? 0.5 : 1 }} onClick={() => agregarAlCarrito(p)} disabled={p.stock <= 0}>
        {p.stock > 0 ? 'Añadir' : 'Agotado'}
      </button>
    </div>
  );
};

export default function Tienda({ session, onNuevoPedido }) {
  const [carrito, setCarrito] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(['Más Vendidos']);
  const [catSeleccionada, setCatSeleccionada] = useState('Más Vendidos');

  useEffect(() => {
    fetch(`${API_URL}/api.php?action=get_productos`)
      .then(r => r.json())
      .then(data => {
        setProductos(data);
        const uniqueCats = [...new Set(data.map(p => p.categoria))];
        setCategorias(['Más Vendidos', ...uniqueCats]);
      })
      .catch(e => console.error(e));
  }, []);

  const productosMostrar = catSeleccionada === 'Más Vendidos' 
    ? [...productos].sort((a,b) => b.ventas - a.ventas).slice(0, 10)
    : productos.filter(p => p.categoria === catSeleccionada);

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === prod.id);
      if (existe) return prev.map(item => item.id === prod.id ? {...item, cantidad: item.cantidad + 1} : item);
      return [...prev, {...prod, cantidad: 1}];
    });
  };

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalizarPedido = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/api.php?action=nuevo_pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: session.usuario.id,
          total: total,
          carrito: carrito
        })
      });
      const data = await resp.json();
      
      if (data.status === 'success') {
        const idPedido = `LR-${String(data.pedido_id).padStart(4, '0')}`;
        setPedidoConfirmado(idPedido);
        setCarrito([]);
        setIsCheckingOut(false);
        
        if (onNuevoPedido) {
          onNuevoPedido({ id: idPedido, total, items: carrito.length, fecha: new Date() });
        }
      }
    } catch (e) {
      alert('Error guardando pedido en BD');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pedidoConfirmado) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛍️</div>
          <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '15px' }}>¡Pedido Recibido!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Tu pedido <strong>{pedidoConfirmado}</strong> se preparará en nuestra sucursal.
          </p>
          <div style={{ background: 'rgba(39, 174, 96, 0.1)', border: '1px solid var(--green-emerald-light)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>📧</span>
            <span style={{ color: 'var(--green-emerald-light)' }}>Se ha enviado un correo con el recibo de la orden.</span>
          </div>
          <button className="btn-outline-gold" onClick={() => setPedidoConfirmado(null)}>Volver a la Tienda</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0', position: 'relative' }}>
      <h2 style={{ color: 'var(--gold-jewel)', marginBottom: '20px' }}>Tienda La Romana</h2>
      
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        {categorias.map(cat => (
          <button 
            key={cat} 
            onClick={() => setCatSeleccionada(cat)}
            className={catSeleccionada === cat ? 'btn-primary' : 'btn-outline-gold'}
            style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {productos.length === 0 ? <p>Cargando catálogo desde BD...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {productosMostrar.map(p => (
            <ProductoCard key={p.id} p={p} agregarAlCarrito={agregarAlCarrito} />
          ))}
        </div>
      )}

      {carrito.length > 0 && !isCheckingOut && (
        <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 100 }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 25px', borderRadius: '50px', boxShadow: '0 8px 24px rgba(39, 174, 96, 0.4)' }} onClick={() => setIsCheckingOut(true)}>
            🛒 <span>Ver Carrito ({carrito.reduce((sum, i) => sum + i.cantidad, 0)})</span>
          </button>
        </div>
      )}

      {isCheckingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--gold-jewel)' }}>Tu Carrito</h3>
              <button onClick={() => setIsCheckingOut(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {carrito.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '10px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.nombre}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.cantidad} x ${Number(item.precio).toLocaleString('es-CL')}</div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--green-emerald-light)' }}>
                  ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--gold-jewel)' }}>${total.toLocaleString('es-CL')}</span>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '25px', opacity: isSubmitting ? 0.7 : 1 }} onClick={finalizarPedido} disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Finalizar Pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
