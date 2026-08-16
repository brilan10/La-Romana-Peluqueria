import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function AdminDashboard({ session, logout }) {
  const [tab, setTab] = useState('dashboard');

  // Datos Bodega
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editingProd, setEditingProd] = useState(null);

  // Datos Equipo
  const [trabajadores, setTrabajadores] = useState([]);
  const [editingTrabajador, setEditingTrabajador] = useState(null);

  // Datos Servicios
  const [servicios, setServicios] = useState([]);
  const [editingServicio, setEditingServicio] = useState(null);

  // Datos Dashboard Real
  const [metrics, setMetrics] = useState({ ingresos_totales: 0, citas_atendidas: 0, ventas_tienda: 0, total_pedidos: 0, decants_mes: 0 });
  const [citasCalendario, setCitasCalendario] = useState([]);
  const [crmClientes, setCrmClientes] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  // Caja y CRM extra
  const [citasCaja, setCitasCaja] = useState([]);
  const [comisionesConfig, setComisionesConfig] = useState({ porcentaje_barbero: 60, porcentaje_tienda: 40 });

  // Datos Pedidos (Tienda)
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [pedidosSearch, setPedidosSearch] = useState('');

  // Datos Analitica Custom
  const [customCharts, setCustomCharts] = useState([]);
  
  // Calendario Interactivo
  const [fechaCalendario, setFechaCalendario] = useState(new Date().toISOString().split('T')[0]);
  const [vistaCalendario, setVistaCalendario] = useState('dia'); // dia, semana, mes
  const [showModalCita, setShowModalCita] = useState(false);
  const [nuevaCitaForm, setNuevaCitaForm] = useState({ rut: '', nombre: '', trabajador_id: '', hora: '10:00' });
  const [filtroBarberoCal, setFiltroBarberoCal] = useState('');

  // Modales Extra
  const [cobroActivo, setCobroActivo] = useState(null);
  const [historialCRMActivo, setHistorialCRMActivo] = useState(null);
  const [historialData, setHistorialData] = useState({ citas: [], recompensas: [], cortes_mes: 0 });
  const [filtroBarberoDashboard, setFiltroBarberoDashboard] = useState('');
  const [showPremioModal, setShowPremioModal] = useState(false);
  const [clientePremio, setClientePremio] = useState(null);
  const [toast, setToast] = useState(null); // { message: '', type: 'success'|'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [estadoCaja, setEstadoCaja] = useState(null);
  const [datosCaja, setDatosCaja] = useState(null);
  const [showAbrirCaja, setShowAbrirCaja] = useState(false);
  const [showCerrarCaja, setShowCerrarCaja] = useState(false);
  const [efectivoInicialForm, setEfectivoInicialForm] = useState('');

  const [reportForm, setReportForm] = useState({ 
    metric: 'ingresos_cortes', 
    groupBy: 'fecha', 
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0], 
    chartType: 'line', 
    title: '' 
  });

  const generarGrafico = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/admin_api.php?action=get_custom_analytics`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(reportForm)
    });
    const data = await res.json();
    
    const newChart = {
      id: Date.now(),
      config: { ...reportForm, title: reportForm.title || `Reporte ${customCharts.length + 1}` },
      data: data.aggregated || data, // fallback for safety
      details: data.details || []
    };
    
    setCustomCharts([newChart, ...customCharts]);
  };

  const exportarExcel = async () => {
    if (customCharts.length === 0) return alert("Primero genera algunos gráficos para exportar.");
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Romana Back-Office';
    
    customCharts.forEach((chart, index) => {
      // 1. Hoja de Resumen (Gráfico)
      let summaryName = `R${index+1} ` + chart.config.title.substring(0, 20).replace(/[\\/*?:[\]]/g, '');
      const wsSummary = workbook.addWorksheet(summaryName);
      
      const isMoney = chart.config.metric.includes('ingresos');
      
      wsSummary.columns = [
        { header: 'ETIQUETA', key: 'label', width: 30 },
        { header: 'VALOR', key: 'valor', width: 20, style: { numFmt: isMoney ? '"$"#,##0' : '#,##0' } }
      ];
      
      wsSummary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsSummary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
      wsSummary.getRow(1).border = { bottom: { style: 'thick', color: { argb: 'FFD4AF37' } } };
      
      chart.data.forEach(d => {
        // Asegurar que el valor sea un número limpio sin decimales si no se necesitan, aunque el estilo se encargará visualmente.
        wsSummary.addRow({ label: d.label, valor: Number(d.valor) });
      });
      
      // 2. Hoja de Detalles (Transacciones)
      if (chart.details && chart.details.length > 0) {
        let detailsName = `Det${index+1} ` + chart.config.title.substring(0, 20).replace(/[\\/*?:[\]]/g, '');
        const wsDetails = workbook.addWorksheet(detailsName);
        
        const keys = Object.keys(chart.details[0]);
        wsDetails.columns = keys.map(k => {
          let numFmt = undefined;
          const keyLower = k.toLowerCase();
          if (['monto', 'precio_cobrado', 'precio_unitario', 'subtotal'].includes(keyLower)) numFmt = '"$"#,##0';
          else if (['cantidad'].includes(keyLower)) numFmt = '#,##0';
          
          return { header: k.toUpperCase(), key: k, width: 25, style: numFmt ? { numFmt } : {} };
        });
        
        wsDetails.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
        wsDetails.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } }; // Fondo dorado
        wsDetails.getRow(1).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
        
        chart.details.forEach(d => {
          // Convertir campos numéricos a Number para que Excel los formatee correctamente
          const rowData = { ...d };
          keys.forEach(k => {
            if (['monto', 'precio_cobrado', 'precio_unitario', 'subtotal', 'cantidad', 'valor'].includes(k.toLowerCase())) {
              rowData[k] = Number(rowData[k]);
            }
          });
          wsDetails.addRow(rowData);
        });
      }
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Analitica_LaRomana_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const borrarGrafico = (id) => {
    setCustomCharts(customCharts.filter(c => c.id !== id));
  };

  useEffect(() => {
    const fetchData = () => {
      if (tab === 'dashboard') cargarDashboard();
      if (tab === 'bodega') cargarBodega();
      if (tab === 'equipo') cargarEquipo();
      if (tab === 'servicios') cargarServicios();
      if (tab === 'pedidos') cargarPedidosAdmin();
      if (tab === 'caja') cargarCaja();
      if (tab === 'crm') {
        cargarCRM();
        cargarBodega();
      }
      if (tab === 'calendario') {
         cargarEquipo();
         let start_date = fechaCalendario;
         let end_date = fechaCalendario;
         
         const d = new Date(fechaCalendario + 'T12:00:00'); // Evitar timezone issues
         if (vistaCalendario === 'semana') {
             const day = d.getDay();
             const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para Lunes como primer día
             const startOfWeek = new Date(d.setDate(diff));
             const endOfWeek = new Date(startOfWeek);
             endOfWeek.setDate(endOfWeek.getDate() + 6);
             start_date = startOfWeek.toISOString().split('T')[0];
             end_date = endOfWeek.toISOString().split('T')[0];
         } else if (vistaCalendario === 'mes') {
             const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
             const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
             start_date = startOfMonth.toISOString().split('T')[0];
             end_date = endOfMonth.toISOString().split('T')[0];
         }
         
         fetch(`${API_URL}/admin_api.php?action=get_todas_citas&start_date=${start_date}&end_date=${end_date}`)
            .then(resC => resC.json())
            .then(data => setCitasCalendario(data));
      }
    };

    fetchData(); // Carga inicial

    // Polling cada 10 segundos para mantener datos actualizados
    const intervalId = setInterval(fetchData, 60000);

    return () => clearInterval(intervalId);
  }, [tab, fechaCalendario, vistaCalendario]);

  const cargarPedidosAdmin = async () => {
    const res = await fetch(`${API_URL}/admin_api.php?action=get_pedidos_admin`);
    setPedidosAdmin(await res.json());
  };

  const cambiarEstadoPedido = async (id, estado) => {
    await fetch(`${API_URL}/admin_api.php?action=update_pedido_estado`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id, estado})
    });
    cargarPedidosAdmin();
  };

  const cargarDashboard = async () => {
    const resM = await fetch(`${API_URL}/admin_api.php?action=get_dashboard_metrics`);
    setMetrics(await resM.json());
    const resC = await fetch(`${API_URL}/admin_api.php?action=get_todas_citas`);
    setCitasCalendario(await resC.json());
    const resCRM = await fetch(`${API_URL}/admin_api.php?action=get_crm_clientes`);
    setCrmClientes(await resCRM.json());
    const resChart = await fetch(`${API_URL}/admin_api.php?action=get_chart_data`);
    setChartData((await resChart.json()).reverse()); // De más antiguo a más reciente
  };

  const cargarCaja = async () => {
    const res = await fetch(`${API_URL}/admin_api.php?action=get_citas_por_cobrar`);
    setCitasCaja(await res.json());
    
    const resEstado = await fetch(`${API_URL}/admin_api.php?action=get_estado_caja`);
    const dataEstado = await resEstado.json();
    setEstadoCaja(dataEstado.estado);
    setDatosCaja(dataEstado);
  };

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/admin_api.php?action=abrir_caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ efectivo_inicial: efectivoInicialForm || 0 })
    });
    setShowAbrirCaja(false);
    cargarCaja();
  };

  const handleCerrarCaja = async () => {
    await fetch(`${API_URL}/admin_api.php?action=cerrar_caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_ingresos: datosCaja?.ingresos?.Total || 0 })
    });
    setShowCerrarCaja(false);
    cargarCaja();
  };

  const handleReabrirCaja = async () => {
    if(!window.confirm("¿Estás seguro de reabrir la caja de hoy?")) return;
    await fetch(`${API_URL}/admin_api.php?action=reabrir_caja`, { method: 'POST' });
    cargarCaja();
  };

  const handleCobrarCaja = async (cita_id, descuento, metodo_pago, decant_producto_id = null) => {
    const res = await fetch(`${API_URL}/api.php?action=finalizar_cita`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cita_id, descuento, metodo_pago, decant_producto_id })
    });
    const data = await res.json();
    if (data.status === 'success') {
      setCobroActivo(null);
      cargarCaja();
      cargarDashboard();
      cargarBodega(); // Refrescar stock de decants si se usó
      cargarCRM();
      showToast('Cobro finalizado con éxito.', 'success');
    }
  };

  const abrirHistorialCRM = async (cliente) => {
    setHistorialCRMActivo(cliente);
    const res = await fetch(`${API_URL}/admin_api.php?action=get_historial_cliente&cliente_id=${cliente.id}`);
    const data = await res.json();
    setHistorialData(data);
  };

  const handleEntregarPremio = async (e) => {
    e.preventDefault();
    const form = e.target;
    const producto_id = form.producto_id.value;
    
    if (!producto_id) return;

    const res = await fetch(`${API_URL}/admin_api.php?action=entregar_premio_crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clientePremio.id, producto_id })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      showToast('Premio entregado exitosamente', 'success');
      setShowPremioModal(false);
      setClientePremio(null);
      cargarCRM();
      cargarBodega();
    } else {
      showToast('Error al entregar premio', 'error');
    }
  };

  const cargarCRM = async () => {
    const resCRM = await fetch(`${API_URL}/admin_api.php?action=get_crm_clientes`);
    setCrmClientes(await resCRM.json());
  };

  const handleAgendarCita = async (e) => {
    e.preventDefault();
    if (!nuevaCitaForm.rut || !nuevaCitaForm.nombre || !nuevaCitaForm.trabajador_id) {
        alert("Rut, nombre y barbero son obligatorios.");
        return;
    }
    
    // Default dummy service for admin calendar block if not provided
    const payload = {
        rut: nuevaCitaForm.rut,
        nombre: nuevaCitaForm.nombre,
        fecha: fechaCalendario,
        hora: nuevaCitaForm.hora,
        trabajador_id: nuevaCitaForm.trabajador_id,
        servicios: [] 
    };

    const res = await fetch(`${API_URL}/api.php?action=agendar_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
        alert("Cita agendada exitosamente.");
        setShowModalCita(false);
        setNuevaCitaForm({ rut: '', nombre: '', trabajador_id: '', hora: '10:00' });
        // Refetch calendar (se confía en polling o se puede recalcular acá)
        setFechaCalendario(new Date(fechaCalendario).toISOString().split('T')[0]); // Trigger effect
    } else {
        alert(data.error || 'Error al agendar cita');
    }
  };

  const guardarNotasCRM = async (cliente_id, notas_crm) => {
    await fetch(`${API_URL}/admin_api.php?action=guardar_notas_crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id, notas_crm })
    });
    // alert removido para evitar bloqueos
    cargarCRM();
  };

  const cargarBodega = async () => {
    const resP = await fetch(`${API_URL}/admin_api.php?action=get_productos`);
    setProductos(await resP.json());
    const resC = await fetch(`${API_URL}/admin_api.php?action=get_categorias`);
    setCategorias(await resC.json());
  };

  const cargarEquipo = async () => {
    const res = await fetch(`${API_URL}/admin_api.php?action=get_trabajadores`);
    setTrabajadores(await res.json());
  };

  const cargarServicios = async () => {
    const res = await fetch(`${API_URL}/admin_api.php?action=get_servicios`);
    setServicios(await res.json());
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=upload_image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEditingProd({...editingProd, imagen_url: data.url});
      } else {
        alert(data.error || 'Error subiendo imagen');
      }
    } catch (err) {
      alert('Error de conexión subiendo imagen');
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    const isNew = !editingProd.id;
    await fetch(`${API_URL}/admin_api.php?action=${isNew ? 'add' : 'update'}_producto`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(editingProd)
    });
    setEditingProd(null);
    cargarBodega();
  };

  const borrarProducto = async (id) => {
    if (!window.confirm("¿Seguro de eliminar este producto?")) return;
    await fetch(`${API_URL}/admin_api.php?action=delete_producto`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id})
    });
    cargarBodega();
  };

  const guardarTrabajador = async (e) => {
    e.preventDefault();
    const isNew = !editingTrabajador.id;
    await fetch(`${API_URL}/admin_api.php?action=${isNew ? 'add' : 'update'}_trabajador`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(editingTrabajador)
    });
    setEditingTrabajador(null);
    cargarEquipo();
  };

  const toggleTrabajador = async (id) => {
    await fetch(`${API_URL}/admin_api.php?action=toggle_trabajador`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id})
    });
    cargarEquipo();
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    const isNew = !editingServicio.id;
    await fetch(`${API_URL}/admin_api.php?action=${isNew ? 'add' : 'update'}_servicio`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(editingServicio)
    });
    setEditingServicio(null);
    cargarServicios();
  };

  const borrarServicio = async (id) => {
    if (!window.confirm("¿Seguro de eliminar este servicio permanentemente?")) return;
    await fetch(`${API_URL}/admin_api.php?action=delete_servicio`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id})
    });
    cargarServicios();
  };


  // --- STYLES ---
  const sidebarBtnStyle = (isActive) => ({
    width: '100%',
    padding: '15px 20px',
    textAlign: 'left',
    background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
    color: isActive ? 'var(--gold-jewel)' : '#ccc',
    border: 'none',
    borderRight: isActive ? '3px solid var(--gold-jewel)' : '3px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s'
  });

  const tableHeaderStyle = { padding: '15px', textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid #333', fontSize: '0.9rem', textTransform: 'uppercase' };
  const tableCellStyle = { padding: '15px', borderBottom: '1px solid #222', color: '#eee', verticalAlign: 'middle' };

  const guardarComisiones = async () => {
    await fetch(`${API_URL}/admin_api.php?action=configurar_comisiones_dia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...comisionesConfig, fecha: new Date().toISOString().split('T')[0] })
    });
    alert('Comisiones del día actualizadas.');
  };

  const renderCaja = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Caja (Por Cobrar)</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {estadoCaja === 'abierta' && (
               <button className="btn-outline-gold" style={{ borderColor: '#e74c3c', color: '#e74c3c' }} onClick={() => setShowCerrarCaja(true)}>Cerrar Caja</button>
            )}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(26, 26, 26, 0.6)', padding: '10px 20px', borderRadius: '12px', border: '1px solid #333' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Comisiones (Hoy):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.8rem' }}>Barbero %</span>
                <input type="number" className="input-field" style={{ margin: 0, padding: '5px', width: '60px' }} value={comisionesConfig.porcentaje_barbero} onChange={e => setComisionesConfig({...comisionesConfig, porcentaje_barbero: e.target.value})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.8rem' }}>Tienda %</span>
                <input type="number" className="input-field" style={{ margin: 0, padding: '5px', width: '60px' }} value={comisionesConfig.porcentaje_tienda} onChange={e => setComisionesConfig({...comisionesConfig, porcentaje_tienda: e.target.value})} />
              </div>
              <button className="btn-outline-gold" style={{ padding: '5px 15px', fontSize: '0.8rem' }} onClick={guardarComisiones}>Guardar</button>
            </div>
          </div>
        </div>

        {estadoCaja === 'no_iniciada' || estadoCaja === 'cerrada' ? (
           <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(26, 26, 26, 0.6)', borderRadius: '12px', border: '1px dashed var(--gold-jewel)' }}>
             <h3 style={{ color: '#fff', marginBottom: '20px' }}>La Caja está {estadoCaja === 'no_iniciada' ? 'Cerrada' : 'Cerrada (Jornada Finalizada)'}</h3>
             {estadoCaja === 'no_iniciada' ? (
                <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem' }} onClick={() => setShowAbrirCaja(true)}>Abrir Caja del Día</button>
             ) : (
                <div>
                  <p style={{ color: '#888', marginBottom: '15px' }}>La jornada de hoy ya fue cerrada. Vuelve mañana.</p>
                  <button className="btn-outline-gold" style={{ fontSize: '0.8rem' }} onClick={handleReabrirCaja}>Deshacer Cierre (Reabrir Caja)</button>
                </div>
             )}
           </div>
        ) : (
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Hora</th>
                <th style={tableHeaderStyle}>Cliente</th>
                <th style={tableHeaderStyle}>Barbero</th>
                <th style={tableHeaderStyle}>Subtotal</th>
                <th style={tableHeaderStyle}>Cobrar</th>
              </tr>
            </thead>
            <tbody>
              {citasCaja.length === 0 ? (
                <tr><td colSpan="5" style={{...tableCellStyle, textAlign: 'center'}}>No hay clientes esperando pago.</td></tr>
              ) : (
                citasCaja.map((c, i) => (
                  <tr key={c.id}>
                    <td style={tableCellStyle}>{c.hora.slice(0,5)}</td>
                    <td style={tableCellStyle}>{c.cliente}</td>
                    <td style={tableCellStyle}>{c.barbero}</td>
                    <td style={{...tableCellStyle, color: 'var(--gold-jewel)'}}>${Number(c.subtotal).toLocaleString('es-CL')}</td>
                    <td style={tableCellStyle}>
                      {c.estado === 'Completada' ? (
                          <span style={{ color: 'var(--green-emerald-light)', fontWeight: 'bold' }}>Cobrado (${Number(c.total_pagado).toLocaleString('es-CL')})</span>
                      ) : (
                          <button className="btn-primary" onClick={() => {
                            setCobroActivo({
                              ...c,
                              descuento: 0,
                              metodo: 'Efectivo',
                              decant_producto_id: ''
                            });
                          }}>Cobrar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    );
  };

  const renderCRM = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Cartera de Clientes (CRM)</h2>
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Nombre</th>
                <th style={tableHeaderStyle}>Contacto</th>
                <th style={tableHeaderStyle}>Cortes</th>
                <th style={tableHeaderStyle}>Notas CRM</th>
                <th style={tableHeaderStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {crmClientes.map((c, i) => (
                <tr key={c.id}>
                  <td style={tableCellStyle}>{c.nombre} <br/> <small>{c.rut}</small></td>
                  <td style={tableCellStyle}>{c.email} <br/> {c.telefono}</td>
                  <td style={tableCellStyle}>
                    {(() => {
                      const cortesMes = Number(c.cortes_mes || 0);
                      const premiosEntregados = Number(c.premios_mes || 0);
                      const premiosGanados = cortesMes < 2 ? 0 : 1 + Math.floor((cortesMes - 2) / 4);
                      const meta = premiosEntregados === 0 ? 2 : 2 + (premiosEntregados * 4);
                      
                      if (premiosGanados > premiosEntregados) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--gold-jewel)' }}>{cortesMes}/{premiosGanados * 4} <small style={{color:'#888', fontWeight:'normal'}}>(Este Mes)</small></span>
                            <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.8rem', background: 'var(--gold-jewel)', color: '#000', fontWeight: 'bold' }} onClick={() => { setClientePremio(c); setShowPremioModal(true); }}>
                              🎁 Entregar Premio
                            </button>
                          </div>
                        );
                      } else if (premiosEntregados > 0 && cortesMes >= 4) {
                         return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--gold-jewel)' }}>{cortesMes}/{meta} <small style={{color:'#888', fontWeight:'normal'}}>(Este Mes)</small></span>
                            <button disabled style={{ padding: '8px 15px', fontSize: '0.8rem', background: '#e74c3c', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '25px', opacity: 0.8, cursor: 'not-allowed' }}>
                              🎁 Entregado
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <span style={{ fontWeight: 'bold', color: 'var(--gold-jewel)' }}>{cortesMes}/{meta} <small style={{color:'#888', fontWeight:'normal'}}>(Este Mes)</small></span>
                        );
                      }
                    })()}
                  </td>
                  <td style={tableCellStyle}>
                    <textarea 
                      className="input-field" 
                      style={{ height: '40px', width: '200px' }} 
                      defaultValue={c.notas_crm} 
                      onBlur={e => { if(e.target.value !== c.notas_crm) guardarNotasCRM(c.id, e.target.value); }} 
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <button className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => abrirHistorialCRM(c)}>
                      Ver Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    );
  };

  const renderCalendario = () => {
    // Horarios de 10:00 a 20:00
    const horas = [];
    for (let h = 10; h <= 20; h++) {
      horas.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 20) horas.push(`${String(h).padStart(2, '0')}:30`);
    }

    // Filtrar trabajadores
    const trabajadoresFiltrados = trabajadores.filter(t => filtroBarberoCal === '' || String(t.id) === String(filtroBarberoCal));

      const getCitaParaFechaHora = (fecha, barberoNombre, hora) => {
        return citasCalendario.find(c => c.fecha === fecha && c.trabajador === barberoNombre && c.hora.startsWith(hora));
      };

      const getCitasParaFecha = (fecha) => {
        return citasCalendario.filter(c => c.fecha === fecha && (filtroBarberoCal === '' || String(c.trabajador_id) === String(filtroBarberoCal))); // Assuming API can return trabajador_id, wait, API returns t.nombre as trabajador. Let's filter by string matching.
      };

      const getCitasParaFechaFiltered = (fecha) => {
        return citasCalendario.filter(c => c.fecha === fecha && (filtroBarberoCal === '' || c.trabajador === trabajadores.find(t=>String(t.id) === String(filtroBarberoCal))?.nombre));
      };

      const renderGridDia = () => {
        if (trabajadoresFiltrados.length === 0) return <div style={{ color: '#aaa', textAlign: 'center' }}>No hay barberos registrados o no coinciden con el filtro.</div>;
        return (
             <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${trabajadoresFiltrados.length}, 1fr)`, gap: '10px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'right', paddingRight: '10px' }}>Hora</div>
                {trabajadoresFiltrados.map(b => (
                   <div key={b.id} style={{ fontWeight: 'bold', color: 'var(--gold-jewel)', textAlign: 'center', background: '#222', padding: '10px', borderRadius: '8px' }}>{b.nombre}</div>
                ))}
                {horas.map(hora => (
                   <React.Fragment key={hora}>
                      <div style={{ color: '#888', textAlign: 'right', paddingRight: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{hora}</div>
                      {trabajadoresFiltrados.map(barbero => {
                         const cita = getCitaParaFechaHora(fechaCalendario, barbero.nombre, hora);
                         return (
                            <div key={`${barbero.id}-${hora}`} style={{ minHeight: '60px', background: cita ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)', border: cita ? '1px solid var(--gold-jewel)' : '1px dashed #333', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => {
                                if (!cita) { 
                                    setNuevaCitaForm({ ...nuevaCitaForm, hora, trabajador_id: barbero.id }); 
                                    setShowModalCita(true); 
                                } else if (cita.estado === 'Pendiente' || cita.estado === 'Terminado_Esperando_Pago') {
                                    setCobroActivo({
                                        ...cita,
                                        barbero: cita.trabajador,
                                        descuento: 0,
                                        metodo: 'Efectivo',
                                        decant_producto_id: ''
                                    });
                                }
                            }}>
                               {cita ? (<><div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{cita.cliente}</div><div style={{ fontSize: '0.75rem', color: cita.estado === 'Completada' ? 'var(--green-emerald-light)' : (cita.estado === 'Cancelada' ? '#e74c3c' : 'var(--gold-jewel)'), marginTop: '5px' }}>{cita.estado}</div></>) : (<div style={{ color: 'transparent', transition: 'color 0.2s' }} className="hover-add-cita">+ Añadir</div>)}
                            </div>
                         );
                      })}
                   </React.Fragment>
                ))}
             </div>
        );
      };

      const renderGridSemana = () => {
        const d = new Date(fechaCalendario + 'T12:00:00');
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        
        const diasSemana = Array.from({length: 7}, (_, i) => {
            const dStr = new Date(startOfWeek);
            dStr.setDate(startOfWeek.getDate() + i);
            return dStr.toISOString().split('T')[0];
        });
        const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        return (
             <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(7, 1fr)`, gap: '10px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'right', paddingRight: '10px' }}>Hora</div>
                {diasSemana.map((fecha, i) => (
                   <div key={fecha} style={{ fontWeight: 'bold', color: 'var(--gold-jewel)', textAlign: 'center', background: '#222', padding: '10px', borderRadius: '8px' }}>
                       <div>{nombresDias[i]}</div>
                       <div style={{fontSize: '0.8rem', color: '#888'}}>{fecha.slice(5)}</div>
                   </div>
                ))}
                {horas.map(hora => (
                   <React.Fragment key={hora}>
                      <div style={{ color: '#888', textAlign: 'right', paddingRight: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{hora}</div>
                      {diasSemana.map(fecha => {
                         const barberoSeleccionado = trabajadoresFiltrados.length === 1 ? trabajadoresFiltrados[0] : null;
                         let citasHora = [];
                         if (barberoSeleccionado) {
                             const c = getCitaParaFechaHora(fecha, barberoSeleccionado.nombre, hora);
                             if (c) citasHora.push(c);
                         } else {
                             citasHora = getCitasParaFechaFiltered(fecha).filter(c => c.hora.startsWith(hora));
                         }

                         return (
                            <div key={`${fecha}-${hora}`} style={{ minHeight: '60px', background: citasHora.length > 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)', border: citasHora.length > 0 ? '1px solid var(--gold-jewel)' : '1px dashed #333', borderRadius: '8px', padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
                               {citasHora.map((cita, i) => (
                                   <div key={i} style={{ background: '#222', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', borderLeft: '2px solid var(--gold-jewel)', cursor: 'pointer' }} onClick={(e) => {
                                        e.stopPropagation();
                                        if (cita.estado === 'Pendiente' || cita.estado === 'Terminado_Esperando_Pago') {
                                            setCobroActivo({
                                                ...cita,
                                                barbero: cita.trabajador,
                                                descuento: 0,
                                                metodo: 'Efectivo',
                                                decant_producto_id: ''
                                            });
                                        }
                                   }}>
                                       <strong>{cita.cliente}</strong><br/>
                                       <span style={{color: '#888'}}>{!barberoSeleccionado && cita.trabajador}</span>
                                   </div>
                               ))}
                            </div>
                         );
                      })}
                   </React.Fragment>
                ))}
             </div>
        );
      };

      const renderGridMes = () => {
         const d = new Date(fechaCalendario + 'T12:00:00');
         const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
         const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
         
         const offset = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1; // 0 is Monday
         const totalDays = endOfMonth.getDate();
         const daysArray = Array.from({length: 42}, (_, i) => {
             const diaNum = i - offset + 1;
             if (diaNum > 0 && diaNum <= totalDays) {
                 const dStr = new Date(d.getFullYear(), d.getMonth(), diaNum);
                 return { valid: true, date: dStr.toISOString().split('T')[0], num: diaNum };
             }
             return { valid: false };
         });

         const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

         return (
             <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, gap: '10px' }}>
                {nombresDias.map(d => <div key={d} style={{ fontWeight: 'bold', color: 'var(--gold-jewel)', textAlign: 'center', padding: '10px' }}>{d}</div>)}
                {daysArray.map((diaInfo, i) => {
                    if (!diaInfo.valid) return <div key={i} style={{ minHeight: '100px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}></div>;
                    const citasDia = getCitasParaFechaFiltered(diaInfo.date);
                    return (
                        <div key={i} style={{ minHeight: '100px', background: 'rgba(255,255,255,0.02)', border: '1px solid #333', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ alignSelf: 'flex-end', fontWeight: 'bold', color: diaInfo.date === fechaCalendario ? 'var(--gold-jewel)' : '#fff' }}>{diaInfo.num}</div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px', overflowY: 'auto', maxHeight: '70px' }}>
                                {citasDia.map((c, idx) => (
                                    <div key={idx} style={{ fontSize: '0.7rem', background: '#222', padding: '2px 5px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={(e) => {
                                        e.stopPropagation();
                                        if (c.estado === 'Pendiente' || c.estado === 'Terminado_Esperando_Pago') {
                                            setCobroActivo({
                                                ...c,
                                                barbero: c.trabajador,
                                                descuento: 0,
                                                metodo: 'Efectivo',
                                                decant_producto_id: ''
                                            });
                                        }
                                    }}>
                                        {c.hora.substring(0,5)} {c.cliente}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
             </div>
         );
      };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Calendario Interactivo</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#222', borderRadius: '8px', overflow: 'hidden' }}>
                    {['dia', 'semana', 'mes'].map(v => (
                        <button key={v} onClick={() => setVistaCalendario(v)} style={{ padding: '8px 15px', background: vistaCalendario === v ? 'var(--gold-jewel)' : 'transparent', color: vistaCalendario === v ? '#000' : '#fff', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {v}
                        </button>
                    ))}
                </div>
                <input 
                    type="date" 
                    className="input-field" 
                    style={{ margin: 0 }} 
                    value={fechaCalendario} 
                    onChange={e => setFechaCalendario(e.target.value)} 
                />
                <select 
                    className="input-field" 
                    style={{ margin: 0 }}
                    value={filtroBarberoCal}
                    onChange={e => setFiltroBarberoCal(e.target.value)}
                >
                    <option value="">Todos los Barberos</option>
                    {trabajadores.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                </select>
                <button className="btn-primary" onClick={() => setShowModalCita(true)}>+ Nueva Cita</button>
            </div>
        </div>
        
        {/* Modal Nueva Cita */}
        {showModalCita && (
            <div style={{ background: 'rgba(26, 26, 26, 0.9)', padding: '25px', borderRadius: '12px', border: '1px solid var(--gold-jewel)', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0, color: '#fff' }}>Agendar Nueva Cita</h3>
                <form onSubmit={handleAgendarCita} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <input className="input-field" style={{ margin: 0 }} placeholder="RUT Cliente (Ej: 11111111-1)" value={nuevaCitaForm.rut} onChange={e=>setNuevaCitaForm({...nuevaCitaForm, rut: e.target.value})} required />
                    <input className="input-field" style={{ margin: 0 }} placeholder="Nombre Cliente" value={nuevaCitaForm.nombre} onChange={e=>setNuevaCitaForm({...nuevaCitaForm, nombre: e.target.value})} required />
                    <select className="input-field" style={{ margin: 0 }} value={nuevaCitaForm.trabajador_id} onChange={e=>setNuevaCitaForm({...nuevaCitaForm, trabajador_id: e.target.value})} required>
                        <option value="">Selecciona Barbero...</option>
                        {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                    <select className="input-field" style={{ margin: 0 }} value={nuevaCitaForm.hora} onChange={e=>setNuevaCitaForm({...nuevaCitaForm, hora: e.target.value})} required>
                        {horas.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Agendar Cita</button>
                        <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setShowModalCita(false)}>Cancelar</button>
                    </div>
                </form>
            </div>
        )}

        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto', padding: '20px' }}>
           {vistaCalendario === 'dia' && renderGridDia()}
           {vistaCalendario === 'semana' && renderGridSemana()}
           {vistaCalendario === 'mes' && renderGridMes()}
        </div>
      </div>
    );
  };

  // --- RENDERERS ---
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.3s ease-in' }}>
      <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Vista General</h2>
      
      {/* Metrics Row Hoy */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(0,0,0,0.5))', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid var(--gold-jewel)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--gold-jewel)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ingresos Brutos (Hoy)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${Number(metrics.ingresos_totales).toLocaleString('es-CL')}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>Tienda + Cortes completados</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Citas Atendidas</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.citas_atendidas}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--green-emerald-light)', marginTop: '10px' }}>Hoy</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ventas Tienda</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${Number(metrics.ventas_tienda).toLocaleString('es-CL')}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>{metrics.total_pedidos} Pedidos procesados</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Decants Entregados</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold-jewel)' }}>{metrics.decants_mes}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>Premios VIP de este mes</div>
        </div>
      </div>

      {/* Monthly Metrics Row */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: 'var(--green-emerald-light)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ingresos del Mes</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${Number(metrics.ingresos_mes || 0).toLocaleString('es-CL')}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>Tienda + Cortes (Mes actual)</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: 'var(--gold-jewel)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Barbero del Mes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metrics.top_barbero || '-'}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>{metrics.top_barbero_cortes || 0} cortes completados</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px', background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', border: '1px solid #333', borderRadius: '12px' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Cliente del Mes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metrics.top_cliente || '-'}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>{metrics.top_cliente_citas || 0} visitas este mes</div>
        </div>
      </div>

      {/* CHART */}
      <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', padding: '20px', height: '350px' }}>
         <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Ingresos Diarios (Últimos 7 días)</h3>
         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 25 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#333" />
               <XAxis dataKey="fecha" stroke="#888" tick={{fill: '#888'}} />
               <YAxis stroke="#888" tick={{fill: '#888'}} tickFormatter={(value) => `$${value/1000}k`} />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid var(--gold-jewel)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--gold-jewel)' }}
                  formatter={(value) => [`$${Number(value).toLocaleString('es-CL')}`, 'Ingresos']}
               />
               <Line type="monotone" dataKey="total" stroke="var(--gold-jewel)" strokeWidth={3} dot={{ fill: 'var(--gold-jewel)', r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
         </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Agenda Table */}
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Agenda del Día</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="input-field" style={{ margin: 0, padding: '5px' }} value={filtroBarberoDashboard} onChange={e => setFiltroBarberoDashboard(e.target.value)} id="agenda-filter">
                <option value="">Todos los Barberos</option>
                {[...new Set(citasCalendario.map(c => c.trabajador))].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Hora</th>
                  <th style={tableHeaderStyle}>Cliente</th>
                  <th style={tableHeaderStyle}>Barbero</th>
                  <th style={tableHeaderStyle}>Estado</th>
                </tr>
              </thead>
              <tbody id="agenda-tbody">
                {citasCalendario.filter(c => filtroBarberoDashboard === '' || c.trabajador === filtroBarberoDashboard).length === 0 ? (
                  <tr><td colSpan="4" style={{...tableCellStyle, textAlign: 'center', color: '#666', padding: '30px'}}>No hay citas agendadas hoy que coincidan con la búsqueda.</td></tr>
                ) : (
                  citasCalendario.filter(c => filtroBarberoDashboard === '' || c.trabajador === filtroBarberoDashboard).map((cita, i) => (
                    <tr key={i} className="agenda-row" data-barbero={cita.trabajador} style={{ background: i % 2 === 0 ? '#161616' : 'transparent' }}>
                      <td style={{...tableCellStyle, fontWeight: 'bold', color: 'var(--gold-jewel)'}}>{cita.hora.slice(0,5)}</td>
                      <td style={{...tableCellStyle}}>{cita.cliente}</td>
                      <td style={{...tableCellStyle, color: '#aaa'}}>{cita.trabajador}</td>
                      <td style={tableCellStyle}>
                        <span style={{ 
                          background: cita.estado === 'Completada' ? 'rgba(39, 174, 96, 0.1)' : (cita.estado === 'Cancelada' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(212, 175, 55, 0.1)'),
                          color: cita.estado === 'Completada' ? 'var(--green-emerald-light)' : (cita.estado === 'Cancelada' ? '#e74c3c' : 'var(--gold-jewel)'),
                          padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>
                          {cita.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* CRM */}
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Alerta VIP (CRM)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {crmClientes.slice(0,6).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', borderLeft: c.riesgo ? '3px solid #e74c3c' : '3px solid transparent' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: c.riesgo ? '#e74c3c' : '#888', marginTop: '4px' }}>Visita: {c.tiempo_visita}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.9rem' }}>{c.cortes} cortes</div>
                  <a href={`https://wa.me/${c.telefono.replace('+','')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--green-emerald-light)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>Contactar ↗</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBodega = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Gestión de Inventario</h2>
        <button className="btn-primary" onClick={() => setEditingProd({ categoria_id: categorias[0]?.id, nombre: '', descripcion: '', precio: '', stock: 0, imagen_url: '' })}>+ Nuevo Producto</button>
      </div>

      {editingProd && (
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '12px', border: '1px solid var(--gold-jewel)' }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>{editingProd.id ? 'Editar Producto' : 'Crear Producto'}</h3>
          <form onSubmit={guardarProducto} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <input className="input-field" placeholder="Nombre" value={editingProd.nombre} onChange={e=>setEditingProd({...editingProd, nombre: e.target.value})} required style={{ margin: 0 }} />
            <select className="input-field" value={editingProd.categoria_id} onChange={e=>setEditingProd({...editingProd, categoria_id: e.target.value})} required style={{ margin: 0 }}>
              {categorias.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.nombre}</option>)}
            </select>
            <input type="number" className="input-field" placeholder="Precio ($)" value={editingProd.precio} onChange={e=>setEditingProd({...editingProd, precio: e.target.value})} required style={{ margin: 0 }} />
            <input type="number" className="input-field" placeholder="Stock" value={editingProd.stock} onChange={e=>setEditingProd({...editingProd, stock: e.target.value})} required style={{ margin: 0 }} />
            <div style={{ margin: 0, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="file" className="input-field" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, padding: '5px' }} />
              {editingProd.imagen_url && <img src={editingProd.imagen_url} alt="preview" style={{ height: '40px', borderRadius: '4px' }} />}
            </div>
            <div style={{ gridColumn: 'span 3', display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setEditingProd(null)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Prod.</th>
              <th style={tableHeaderStyle}>Nombre</th>
              <th style={tableHeaderStyle}>Categoría</th>
              <th style={tableHeaderStyle}>Precio</th>
              <th style={tableHeaderStyle}>Stock</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#161616' : 'transparent' }}>
                <td style={{...tableCellStyle, width: '60px'}}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#222', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {p.imagen_url ? <img src={p.imagen_url.split(',')[0].trim()} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : '🛍️'}
                  </div>
                </td>
                <td style={{...tableCellStyle, fontWeight: 'bold'}}>{p.nombre}</td>
                <td style={{...tableCellStyle, color: '#aaa'}}>{p.categoria_nombre}</td>
                <td style={{...tableCellStyle, color: 'var(--gold-jewel)'}}>${Number(p.precio).toLocaleString('es-CL')}</td>
                <td style={{...tableCellStyle}}>
                  <span style={{ 
                    background: p.stock < 5 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(39, 174, 96, 0.1)', 
                    color: p.stock < 5 ? '#e74c3c' : 'var(--green-emerald-light)',
                    padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold'
                  }}>{p.stock}</span>
                </td>
                <td style={tableCellStyle}>
                  <button onClick={() => setEditingProd(p)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                  <button onClick={() => borrarProducto(p.id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEquipo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Equipo y Barberos</h2>
        <button className="btn-primary" onClick={() => setEditingTrabajador({ nombre: '', email: '', foto_perfil: '' })}>+ Nuevo Barbero</button>
      </div>

      {editingTrabajador && (
         <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '12px', border: '1px solid var(--gold-jewel)' }}>
           <h3 style={{ marginTop: 0, color: '#fff' }}>{editingTrabajador.id ? 'Editar' : 'Registrar'} Barbero</h3>
           <form onSubmit={guardarTrabajador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             <input className="input-field" placeholder="Nombre completo" value={editingTrabajador.nombre} onChange={e=>setEditingTrabajador({...editingTrabajador, nombre: e.target.value})} required style={{ margin: 0 }} />
             <input type="email" className="input-field" placeholder="Correo electrónico" value={editingTrabajador.email} onChange={e=>setEditingTrabajador({...editingTrabajador, email: e.target.value})} required style={{ margin: 0 }} />
             <input type="text" className="input-field" placeholder={editingTrabajador.id ? "Nueva contraseña (dejar vacío si no cambia)" : "Contraseña (Ej: 123456)"} value={editingTrabajador.password || ''} onChange={e=>setEditingTrabajador({...editingTrabajador, password: e.target.value})} required={!editingTrabajador.id} style={{ margin: 0 }} />
             <input className="input-field" placeholder="URL Foto Perfil" value={editingTrabajador.foto_perfil} onChange={e=>setEditingTrabajador({...editingTrabajador, foto_perfil: e.target.value})} style={{ margin: 0 }} />
             <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '10px' }}>
               <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
               <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setEditingTrabajador(null)}>Cancelar</button>
             </div>
           </form>
         </div>
      )}

      <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Barbero</th>
              <th style={tableHeaderStyle}>Contacto</th>
              <th style={tableHeaderStyle}>Cortes Hoy</th>
              <th style={tableHeaderStyle}>Cortes Totales</th>
              <th style={tableHeaderStyle}>Estado</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? '#161616' : 'transparent', opacity: t.activo ? 1 : 0.6 }}>
                <td style={{...tableCellStyle, display: 'flex', alignItems: 'center', gap: '15px', borderBottom: 'none'}}>
                  <img src={t.foto_perfil || `https://i.pravatar.cc/100?u=${t.id}`} alt={t.nombre} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid var(--gold-jewel)' }} />
                  <span style={{ fontWeight: 'bold' }}>{t.nombre}</span>
                </td>
                <td style={{...tableCellStyle, color: '#aaa'}}>{t.email}</td>
                <td style={{...tableCellStyle}}>
                  <span style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '1.2rem' }}>{t.cortes_hoy || 0}</span>
                </td>
                <td style={{...tableCellStyle}}>
                  <span style={{ color: 'var(--green-emerald-light)', fontWeight: 'bold', fontSize: '1.2rem' }}>{t.cortes_totales || 0}</span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ background: t.activo ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: t.activo ? 'var(--green-emerald-light)' : '#e74c3c', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <button onClick={() => setEditingTrabajador(t)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                  <button onClick={() => toggleTrabajador(t.id)} style={{ background: 'transparent', border: '1px solid ' + (t.activo ? '#e74c3c' : 'var(--green-emerald-light)'), color: t.activo ? '#e74c3c' : 'var(--green-emerald-light)', cursor: 'pointer', padding: '5px 10px', borderRadius: '5px' }}>
                    {t.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServicios = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Gestión de Servicios</h2>
        <button className="btn-primary" onClick={() => setEditingServicio({ nombre: '', precio: '', es_corte: true, activo: true })}>+ Nuevo Servicio</button>
      </div>

      {editingServicio && (
         <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '12px', border: '1px solid var(--gold-jewel)' }}>
           <h3 style={{ marginTop: 0, color: '#fff' }}>{editingServicio.id ? 'Editar' : 'Registrar'} Servicio</h3>
           <form onSubmit={guardarServicio} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             <input className="input-field" placeholder="Nombre del servicio (Ej: Corte Clásico)" value={editingServicio.nombre} onChange={e=>setEditingServicio({...editingServicio, nombre: e.target.value})} required style={{ margin: 0 }} />
             <input type="number" className="input-field" placeholder="Precio ($)" value={editingServicio.precio} onChange={e=>setEditingServicio({...editingServicio, precio: e.target.value})} required style={{ margin: 0 }} />
             
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingServicio.es_corte} onChange={e=>setEditingServicio({...editingServicio, es_corte: e.target.checked})} />
                Es un servicio principal de Corte (Acumula para premios)
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingServicio.activo} onChange={e=>setEditingServicio({...editingServicio, activo: e.target.checked})} />
                Servicio Activo (Visible para clientes)
             </label>

             <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '10px' }}>
               <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
               <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setEditingServicio(null)}>Cancelar</button>
             </div>
           </form>
         </div>
      )}

      <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Servicio</th>
              <th style={tableHeaderStyle}>Precio</th>
              <th style={tableHeaderStyle}>Tipo</th>
              <th style={tableHeaderStyle}>Estado</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? '#161616' : 'transparent', opacity: s.activo ? 1 : 0.6 }}>
                <td style={{...tableCellStyle, fontWeight: 'bold'}}>{s.nombre}</td>
                <td style={{...tableCellStyle, color: 'var(--gold-jewel)'}}>${Number(s.precio).toLocaleString('es-CL')}</td>
                <td style={{...tableCellStyle}}>
                  <span style={{ background: s.es_corte ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.1)', color: s.es_corte ? 'var(--gold-jewel)' : '#ccc', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>
                    {s.es_corte ? '💇‍♂️ Corte Principal' : 'Adicional'}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ background: s.activo ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: s.activo ? 'var(--green-emerald-light)' : '#e74c3c', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <button onClick={() => setEditingServicio({
                    id: s.id, nombre: s.nombre, precio: s.precio, 
                    es_corte: Boolean(s.es_corte), activo: Boolean(s.activo)
                  })} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                  <button onClick={() => borrarServicio(s.id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const exportarExcelBarberos = async () => {
    const res = await fetch(`${API_URL}/admin_api.php?action=exportar_excel_barberos`);
    const data = await res.json();
    
    if (Object.keys(data).length === 0) return alert("No hay datos para exportar en este mes.");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Romana Back-Office';
    
    Object.keys(data).forEach(barbero => {
      const ws = workbook.addWorksheet(barbero.substring(0, 30));
      ws.columns = [
        { header: 'FECHA', key: 'fecha', width: 15 },
        { header: 'HORA', key: 'hora', width: 10 },
        { header: 'CLIENTE', key: 'cliente', width: 25 },
        { header: 'MÉTODO PAGO', key: 'metodo_pago', width: 15 },
        { header: 'DESCUENTO', key: 'descuento', width: 15, style: { numFmt: '"$"#,##0' } },
        { header: 'TOTAL INGRESADO', key: 'subtotal', width: 20, style: { numFmt: '"$"#,##0' } },
        { header: '% BARBERO', key: 'pct_barbero_show', width: 12 },
        { header: 'COM. BARBERO', key: 'comision_barbero', width: 15, style: { numFmt: '"$"#,##0' } },
        { header: '% TIENDA', key: 'pct_tienda_show', width: 12 },
        { header: 'COM. TIENDA', key: 'comision_tienda', width: 15, style: { numFmt: '"$"#,##0' } }
      ];
      ws.getRow(1).font = { bold: true };
      
      data[barbero].forEach(c => {
        const subtotalNumber = Number(c.subtotal);
        const descuentoNumber = Number(c.descuento);
        const totalReal = subtotalNumber - descuentoNumber;
        const pctBarbero = Number(c.porcentaje_barbero) / 100;
        const pctTienda = Number(c.porcentaje_tienda) / 100;

        ws.addRow({
          fecha: c.fecha,
          hora: c.hora,
          cliente: c.cliente,
          metodo_pago: c.metodo_pago,
          descuento: descuentoNumber,
          subtotal: totalReal,
          pct_barbero_show: `${c.porcentaje_barbero}%`,
          comision_barbero: totalReal * pctBarbero,
          pct_tienda_show: `${c.porcentaje_tienda}%`,
          comision_tienda: totalReal * pctTienda
        });
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Barberos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderAnalitica = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Business Intelligence</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline-gold" onClick={exportarExcelBarberos}>
            📊 Reporte Mensual por Barberos
          </button>
          <button className="btn-primary" onClick={exportarExcel} style={{ background: '#27ae60', borderColor: '#27ae60' }}>
            📊 Exportar Gráficos Generados
          </button>
        </div>
      </div>

      {/* Creador de Reportes */}
      <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '12px', border: '1px solid var(--gold-jewel)' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Creador de Gráficos</h3>
        <form onSubmit={generarGrafico} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Métrica</label>
            <select className="input-field" value={reportForm.metric} onChange={e=>setReportForm({...reportForm, metric: e.target.value})} style={{ margin: 0 }}>
              <option value="ingresos_cortes">Ingresos por Cortes ($)</option>
              <option value="ingresos_tienda">Ingresos por Tienda ($)</option>
              <option value="citas_atendidas">Cantidad de Citas</option>
              <option value="productos_vendidos">Cantidad de Productos</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Agrupar por</label>
            <select className="input-field" value={reportForm.groupBy} onChange={e=>setReportForm({...reportForm, groupBy: e.target.value})} style={{ margin: 0 }}>
              <option value="fecha">Fecha</option>
              <option value="barbero">Barbero</option>
              <option value="servicio">Servicio / Tratamiento</option>
              <option value="cliente">Cliente</option>
              <option value="producto">Producto</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Tipo de Gráfico</label>
            <select className="input-field" value={reportForm.chartType} onChange={e=>setReportForm({...reportForm, chartType: e.target.value})} style={{ margin: 0 }}>
              <option value="line">Líneas (Evolución)</option>
              <option value="bar">Barras (Comparación)</option>
              <option value="pie">Torta (Proporción)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Título del Gráfico</label>
            <input className="input-field" placeholder="Ej: Rendimiento de Barberos" value={reportForm.title} onChange={e=>setReportForm({...reportForm, title: e.target.value})} style={{ margin: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Desde</label>
               <input type="date" className="input-field" value={reportForm.startDate} onChange={e=>setReportForm({...reportForm, startDate: e.target.value})} style={{ margin: 0 }} />
            </div>
            <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Hasta</label>
               <input type="date" className="input-field" value={reportForm.endDate} onChange={e=>setReportForm({...reportForm, endDate: e.target.value})} style={{ margin: 0 }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: 'span 3' }}>+ Generar y Añadir Gráfico</button>
        </form>
      </div>

      {/* Grid de Gráficos Generados */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {customCharts.length === 0 && (
           <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333', borderRadius: '12px' }}>
             No has generado ningún reporte aún. Usa el creador de arriba.
           </div>
        )}
        
        {customCharts.map(chart => (
          <div key={chart.id} style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', padding: '20px', height: '350px', position: 'relative' }}>
             <button onClick={() => borrarGrafico(chart.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
             <h3 style={{ margin: '0 0 5px 0', color: 'var(--gold-jewel)', fontSize: '1rem', paddingRight: '30px' }}>{chart.config.title}</h3>
             <p style={{ margin: '0 0 15px 0', fontSize: '0.75rem', color: '#888' }}>{chart.config.startDate} a {chart.config.endDate}</p>
             
             <ResponsiveContainer width="100%" height="75%">
                {chart.config.chartType === 'line' ? (
                  <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                     <XAxis dataKey="label" stroke="#888" tick={{fontSize: 10}} />
                     <YAxis stroke="#888" tick={{fontSize: 10}} tickFormatter={v => chart.config.metric.includes('ingresos') ? `$${Number(v).toLocaleString('es-CL')}` : v} />
                     <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid var(--gold-jewel)' }} itemStyle={{ color: 'var(--gold-jewel)' }} formatter={v => chart.config.metric.includes('ingresos') ? [`$${Number(v).toLocaleString('es-CL')}`, 'Monto'] : [v, 'Cantidad']} />
                     <Line type="monotone" dataKey="valor" stroke="var(--gold-jewel)" strokeWidth={3} />
                  </LineChart>
                ) : chart.config.chartType === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                     <XAxis dataKey="label" stroke="#888" tick={{fontSize: 10}} />
                     <YAxis stroke="#888" tick={{fontSize: 10}} tickFormatter={v => chart.config.metric.includes('ingresos') ? `$${Number(v).toLocaleString('es-CL')}` : v} />
                     <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid var(--gold-jewel)' }} itemStyle={{ color: 'var(--gold-jewel)' }} cursor={{fill: '#222'}} formatter={v => chart.config.metric.includes('ingresos') ? [`$${Number(v).toLocaleString('es-CL')}`, 'Monto'] : [v, 'Cantidad']} />
                     <Bar dataKey="valor" fill="var(--gold-jewel)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                     <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid var(--gold-jewel)' }} itemStyle={{ color: '#fff' }} formatter={v => chart.config.metric.includes('ingresos') ? [`$${Number(v).toLocaleString('es-CL')}`, 'Monto'] : [v, 'Cantidad']} />
                     <Pie data={chart.data} dataKey="valor" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="var(--gold-jewel)" label={({value}) => chart.config.metric.includes('ingresos') ? `$${Number(value).toLocaleString('es-CL')}` : value}>
                       {chart.data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={['var(--gold-jewel)', '#d35400', '#2980b9', '#27ae60', '#8e44ad'][index % 5]} />
                       ))}
                     </Pie>
                  </PieChart>
                )}
             </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPedidos = () => {
    const filterText = (pedidosSearch || '').toLowerCase();
    const pedidosFiltrados = pedidosAdmin.filter(p => {
      const idFormatted = `LR-${String(p.id).padStart(4, '0')}`.toLowerCase();
      const dateFormatted = new Date(p.fecha_creacion).toLocaleDateString().toLowerCase();
      return idFormatted.includes(filterText) || dateFormatted.includes(filterText);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--gold-jewel)' }}>Gestión de Pedidos</h2>
          <input 
            type="text" 
            placeholder="Buscar por ID (Ej: LR-0001) o Fecha" 
            className="input-field" 
            style={{ width: '300px', margin: 0 }}
            value={pedidosSearch || ''}
            onChange={e => setPedidosSearch(e.target.value)}
          />
        </div>

        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID / Fecha</th>
                <th style={tableHeaderStyle}>Cliente</th>
                <th style={tableHeaderStyle}>Detalles (Boleta)</th>
                <th style={tableHeaderStyle}>Total ($)</th>
                <th style={tableHeaderStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? '#161616' : 'transparent' }}>
                  <td style={{...tableCellStyle, verticalAlign: 'top'}}>
                    <strong>LR-{String(p.id).padStart(4, '0')}</strong><br/>
                    <span style={{fontSize: '0.8rem', color: '#888'}}>{new Date(p.fecha_creacion).toLocaleDateString()}</span>
                  </td>
                  <td style={{...tableCellStyle, verticalAlign: 'top'}}>
                    <strong>{p.cliente}</strong><br/>
                    <a href={`https://wa.me/${p.cliente_telefono?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize: '0.8rem', color: 'var(--green-emerald-light)', textDecoration: 'none', display: 'inline-block', margin: '3px 0'}}>🟢 {p.cliente_telefono}</a><br/>
                    <span style={{fontSize: '0.8rem', color: '#888'}}>{p.cliente_email}</span>
                  </td>
                  <td style={{...tableCellStyle, verticalAlign: 'top', fontSize: '0.85rem'}}>
                    <ul style={{ margin: 0, paddingLeft: '15px', color: '#ccc' }}>
                      {p.detalles?.map((det, idx) => (
                        <li key={idx}>{det.cantidad}x {det.producto} - ${Number(det.precio_unitario).toLocaleString('es-CL')}</li>
                      ))}
                    </ul>
                  </td>
                  <td style={{...tableCellStyle, verticalAlign: 'top', color: 'var(--gold-jewel)', fontWeight: 'bold'}}>
                    ${Number(p.total).toLocaleString('es-CL')}
                  </td>
                  <td style={{...tableCellStyle, verticalAlign: 'top'}}>
                    <select 
                      value={p.estado}
                      onChange={(e) => cambiarEstadoPedido(p.id, e.target.value)}
                      style={{
                        background: p.estado === 'Pagado' || p.estado === 'Entregado' ? 'rgba(39, 174, 96, 0.2)' : 
                                    p.estado === 'Cancelado' ? 'rgba(231, 76, 60, 0.2)' : 
                                    'rgba(241, 196, 15, 0.2)',
                        color: p.estado === 'Pagado' || p.estado === 'Entregado' ? 'var(--green-emerald-light)' : 
                               p.estado === 'Cancelado' ? '#e74c3c' : 
                               '#f1c40f',
                        border: '1px solid transparent',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Pendiente" style={{color: '#000'}}>Pendiente</option>
                      <option value="Preparando" style={{color: '#000'}}>Preparando</option>
                      <option value="Pagado" style={{color: '#000'}}>Pagado</option>
                      <option value="Entregado" style={{color: '#000'}}>Entregado</option>
                      <option value="Cancelado" style={{color: '#000'}}>Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
              {pedidosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" style={{...tableCellStyle, textAlign: 'center', padding: '30px', color: '#666'}}>
                    No hay pedidos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', zIndex: 100, display: 'flex', color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
       <div className="barber-pole-bg" style={{ zIndex: -1 }}></div>
       
       {/* Sidebar Fijo */}
       <div style={{ width: '260px', background: 'rgba(26, 26, 26, 0.7)', backdropFilter: 'blur(10px)', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '25px 20px', borderBottom: '1px solid #333', textAlign: 'center' }}>
             <img src="/Logo_romana_dorado.png" alt="La Romana" style={{ maxWidth: '80%', height: 'auto', marginBottom: '10px' }} />
             <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '3px', display: 'block' }}>Back-Office</span>
          </div>
          <div style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             <button onClick={()=>setTab('dashboard')} style={sidebarBtnStyle(tab === 'dashboard')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>📊</span> Dashboard
             </button>
             <button onClick={()=>setTab('calendario')} style={sidebarBtnStyle(tab === 'calendario')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>📅</span> Calendario
             </button>
             <button onClick={()=>setTab('analitica')} style={sidebarBtnStyle(tab === 'analitica')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>📈</span> Analítica
             </button>
             <button onClick={()=>setTab('caja')} style={sidebarBtnStyle(tab === 'caja')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>💰</span> Caja
             </button>
             <button onClick={()=>setTab('crm')} style={sidebarBtnStyle(tab === 'crm')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>👥</span> CRM
             </button>
             <button onClick={()=>setTab('servicios')} style={sidebarBtnStyle(tab === 'servicios')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>✂️</span> Servicios
             </button>
             <button onClick={()=>setTab('pedidos')} style={sidebarBtnStyle(tab === 'pedidos')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>🛍️</span> Pedidos
             </button>
             <button onClick={()=>setTab('bodega')} style={sidebarBtnStyle(tab === 'bodega')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>📦</span> Inventario
             </button>
             <button onClick={()=>setTab('equipo')} style={sidebarBtnStyle(tab === 'equipo')}>
               <span style={{ marginRight: '10px', width: '20px', display: 'inline-block' }}>👥</span> Equipo
             </button>
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                 <img src={session?.usuario?.foto_perfil || 'https://i.pravatar.cc/100'} alt="Admin" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--gold-jewel)' }} />
                 <div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>{session?.usuario?.nombre || 'Administrador'}</div>
                   <div style={{ fontSize: '0.75rem', color: '#888' }}>{session?.usuario?.email}</div>
                 </div>
             </div>
             <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '5px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }} onMouseEnter={e => {e.target.style.background = '#e74c3c'; e.target.style.color = '#fff'}} onMouseLeave={e => {e.target.style.background = 'transparent'; e.target.style.color = '#e74c3c'}}>
               Cerrar Sesión
             </button>
          </div>
       </div>

       {/* Área de Contenido Principal */}
       <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', background: 'transparent' }}>
         {tab === 'dashboard' && renderDashboard()}
         {tab === 'calendario' && renderCalendario()}
         {tab === 'analitica' && renderAnalitica()}
         {tab === 'servicios' && renderServicios()}
         {tab === 'bodega' && renderBodega()}
         {tab === 'equipo' && renderEquipo()}
         {tab === 'pedidos' && renderPedidos()}
         {tab === 'caja' && renderCaja()}
         {tab === 'crm' && renderCRM()}
       </div>

       {/* Modal Cobro */}
       {cobroActivo && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '400px', border: '1px solid var(--gold-jewel)' }}>
             <h3 style={{ margin: '0 0 20px 0', color: 'var(--gold-jewel)' }}>Cobrar Cita</h3>
             <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>Cliente: {cobroActivo.cliente}</label>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>Barbero: {cobroActivo.barbero}</label>
             </div>
             
             <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Total Original</label>
               <input type="text" className="input-field" disabled value={`$${Number(cobroActivo.subtotal).toLocaleString('es-CL')}`} />
             </div>
             <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Descuento (Monto $)</label>
               <input type="number" className="input-field" value={cobroActivo.descuento || 0} onChange={e => setCobroActivo({...cobroActivo, descuento: Number(e.target.value)})} />
             </div>
             <div style={{ marginBottom: '15px', color: 'var(--green-emerald-light)', fontSize: '1.2rem', fontWeight: 'bold' }}>
               Total a Pagar: ${Number(cobroActivo.subtotal - (cobroActivo.descuento || 0)).toLocaleString('es-CL')}
             </div>
             <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Método de Pago</label>
               <select className="input-field" value={cobroActivo.metodo} onChange={e => setCobroActivo({...cobroActivo, metodo: e.target.value})}>
                 <option value="Efectivo" style={{color: '#000'}}>Efectivo</option>
                 <option value="Transferencia" style={{color: '#000'}}>Transferencia</option>
                 <option value="Tarjeta" style={{color: '#000'}}>Tarjeta</option>
               </select>
             </div>
             <div style={{ display: 'flex', gap: '15px' }}>
               <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleCobrarCaja(cobroActivo.id, cobroActivo.descuento, cobroActivo.metodo, cobroActivo.decant_producto_id)}>Confirmar Pago</button>
               <button className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setCobroActivo(null)}>Cancelar</button>
             </div>
           </div>
         </div>
       )}

       {/* Modal Historial CRM */}
       {historialCRMActivo && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '500px', border: '1px solid var(--gold-jewel)', maxHeight: '80vh', overflowY: 'auto' }}>
             <h3 style={{ margin: '0 0 20px 0', color: 'var(--gold-jewel)' }}>Historial: {historialCRMActivo.nombre}</h3>
             
             <div style={{ marginBottom: '20px' }}>
               <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Últimas Visitas</h4>
               {historialData.citas.length === 0 ? <p style={{color:'#888', fontSize:'0.9rem'}}>No hay visitas registradas.</p> : (
                 <ul style={{ padding: 0, listStyle: 'none', margin: 0, fontSize: '0.9rem' }}>
                   {historialData.citas.map((c, i) => (
                     <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #333', color: '#ccc' }}>
                       <span style={{ color: 'var(--gold-jewel)', display: 'inline-block', width: '100px' }}>{c.fecha}</span>
                       <span>{c.hora.substring(0,5)} con {c.barbero}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>

             <div style={{ marginBottom: '20px' }}>
               <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Premios / Regalos (VIP)</h4>
               {historialData.recompensas.length === 0 ? <p style={{color:'#888', fontSize:'0.9rem'}}>No ha recibido recompensas VIP aún.</p> : (
                 <ul style={{ padding: 0, listStyle: 'none', margin: 0, fontSize: '0.9rem' }}>
                   {historialData.recompensas.map((r, i) => (
                     <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #333', color: '#ccc' }}>
                       <span style={{ color: 'var(--gold-jewel)', display: 'inline-block', width: '100px' }}>{r.fecha_entrega}</span>
                       <span>Decant Entregado: {r.aroma_decant}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>

             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button className="btn-outline-gold" onClick={() => setHistorialCRMActivo(null)}>Cerrar</button>
             </div>
           </div>
         </div>
       )}

       {/* Modal Abrir Caja */}
       {showAbrirCaja && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '400px', border: '1px solid var(--gold-jewel)' }}>
             <h3 style={{ margin: '0 0 20px 0', color: 'var(--gold-jewel)' }}>Abrir Caja del Día</h3>
             <form onSubmit={handleAbrirCaja}>
               <div style={{ marginBottom: '20px' }}>
                 <label style={{ display: 'block', marginBottom: '5px' }}>Efectivo Inicial en Caja ($)</label>
                 <input type="number" className="input-field" autoFocus required min="0" value={efectivoInicialForm} onChange={e => setEfectivoInicialForm(e.target.value)} placeholder="Ej: 20000" />
               </div>
               <div style={{ display: 'flex', gap: '15px' }}>
                 <button type="submit" className="btn-primary" style={{ flex: 1 }}>Confirmar Apertura</button>
                 <button type="button" className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setShowAbrirCaja(false)}>Cancelar</button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Modal Cerrar Caja */}
       {showCerrarCaja && datosCaja && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '450px', border: '1px solid #e74c3c' }}>
             <h3 style={{ margin: '0 0 20px 0', color: '#e74c3c' }}>Cerrar Caja (Arqueo)</h3>
             <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Verifica los totales antes de cerrar definitivamente la jornada.</p>
             
             <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span>Efectivo Inicial (Fondo):</span>
                 <strong style={{ color: '#fff' }}>${Number(datosCaja.efectivo_inicial || 0).toLocaleString('es-CL')}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span>Ventas Efectivo:</span>
                 <strong style={{ color: '#fff' }}>${Number(datosCaja.ingresos?.Efectivo || 0).toLocaleString('es-CL')}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span>Ventas Transferencia:</span>
                 <strong style={{ color: '#fff' }}>${Number(datosCaja.ingresos?.Transferencia || 0).toLocaleString('es-CL')}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span>Ventas Tarjeta / Otro:</span>
                 <strong style={{ color: '#fff' }}>${Number((datosCaja.ingresos?.Tarjeta || 0) + (datosCaja.ingresos?.Otro || 0)).toLocaleString('es-CL')}</strong>
               </div>
               <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '15px 0' }} />
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginBottom: '10px' }}>
                 <span>Total Ventas Hoy:</span>
                 <strong style={{ color: 'var(--gold-jewel)' }}>${Number(datosCaja.ingresos?.Total || 0).toLocaleString('es-CL')}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                 <span>Efectivo Esperado en Caja:</span>
                 <strong style={{ color: 'var(--green-emerald-light)' }}>${Number(Number(datosCaja.efectivo_inicial || 0) + Number(datosCaja.ingresos?.Efectivo || 0)).toLocaleString('es-CL')}</strong>
               </div>
             </div>

             <div style={{ display: 'flex', gap: '15px' }}>
               <button className="btn-primary" style={{ flex: 1, background: '#e74c3c' }} onClick={handleCerrarCaja}>Confirmar Cierre</button>
               <button className="btn-outline-gold" style={{ flex: 1 }} onClick={() => setShowCerrarCaja(false)}>Volver</button>
             </div>
           </div>
         </div>
       )}

       {/* Toast Notification */}
       {toast && (
         <div style={{
           position: 'fixed',
           bottom: '30px',
           right: '30px',
           background: toast.type === 'success' ? '#2ecc71' : '#e74c3c',
           color: '#fff',
           padding: '15px 25px',
           borderRadius: '8px',
           boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
           zIndex: 2000,
           display: 'flex',
           alignItems: 'center',
           gap: '10px',
           fontWeight: 'bold',
           animation: 'fadeIn 0.3s ease-out'
         }}>
           {toast.type === 'success' ? '✅' : '❌'} {toast.message}
         </div>
       )}

       {/* Modal Entregar Premio VIP */}
       {showPremioModal && clientePremio && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid var(--gold-jewel)', textAlign: 'center' }}>
             <h2 style={{ color: 'var(--gold-jewel)', marginTop: 0 }}>Entregar Premio VIP</h2>
             <p style={{ color: '#ccc' }}>El cliente <strong>{clientePremio.nombre}</strong> ha completado <strong>{clientePremio.cortes_mes}</strong> cortes este mes y califica para su premio VIP.</p>
             <form onSubmit={handleEntregarPremio} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
               <select name="producto_id" className="input-field" required>
                 <option value="">-- Seleccionar Premio del Inventario --</option>
                 {productos.filter(p => Number(p.stock) > 0).map(p => (
                   <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>
                 ))}
               </select>
               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Entregar Regalo</button>
                 <button type="button" className="btn-outline-gold" style={{ flex: 1, padding: '12px' }} onClick={() => { setShowPremioModal(false); setClientePremio(null); }}>Cancelar</button>
               </div>
             </form>
           </div>
         </div>
       )}

    </div>
  );
}
