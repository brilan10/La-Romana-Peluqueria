import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  // Datos Pedidos / Tickets (Tienda y Salón)
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [pedidosSearch, setPedidosSearch] = useState('');
  const [pedidosSortOrder, setPedidosSortOrder] = useState('fecha_desc'); // 'fecha_desc', 'fecha_asc', 'monto_desc', 'monto_asc', 'id_desc'
  const [pedidosFiltroEstado, setPedidosFiltroEstado] = useState('todos'); // 'todos', 'Pendiente', 'Preparando', 'Pagado', 'Entregado', 'Cancelado'
  const [pedidosFiltroFecha, setPedidosFiltroFecha] = useState('todos'); // 'todos', 'hoy', 'ayer', '7dias', 'mes', 'custom'
  const [pedidosFechaDesde, setPedidosFechaDesde] = useState('');
  const [pedidosFechaHasta, setPedidosFechaHasta] = useState('');
  const [ticketDetalleModal, setTicketDetalleModal] = useState(null);

  // Datos de Liquidación y Comisiones de Barberos
  const [liqPeriodo, setLiqPeriodo] = useState('este_mes');
  const [liqFechaInicio, setLiqFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [liqFechaFin, setLiqFechaFin] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  const [liqBarberoId, setLiqBarberoId] = useState('todos');
  const [liquidacionData, setLiquidacionData] = useState(null);
  const [loadingLiquidacion, setLoadingLiquidacion] = useState(false);
  const [barberoDetalleModal, setBarberoDetalleModal] = useState(null);

  // Registro y Control de Pagos a Trabajadores
  const [pagoModalData, setPagoModalData] = useState(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [historialPagosModal, setHistorialPagosModal] = useState(false);
  const [historialPagosData, setHistorialPagosData] = useState([]);
  const [loadingHistorialPagos, setLoadingHistorialPagos] = useState(false);
  const [filtroHistorialBarbero, setFiltroHistorialBarbero] = useState('todos');

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
  const [premioModalTipo, setPremioModalTipo] = useState('producto'); // 'producto' o 'personalizado'
  const [premioPersonalizadoTexto, setPremioPersonalizadoTexto] = useState('');
  const [premioProductoId, setPremioProductoId] = useState('');
  const [metaCortesPremio, setMetaCortesPremio] = useState(3);
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [historialCRMTab, setHistorialCRMTab] = useState('visitas'); // 'visitas' o 'regalos'
  const [toast, setToast] = useState(null); // { message: '', type: 'success'|'error' }

  // Estados para Creación y Búsqueda Rápida de Clientes en CRM
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ rut: '', nombre: '', email: '', telefono: '', cortes_acumulados: 0, notas_crm: '', password: '123456' });
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');

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
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=get_custom_analytics`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(reportForm)
      });
      const data = await res.json();
      
      const rawList = data.aggregated || (Array.isArray(data) ? data : []);
      const formattedData = rawList.map(item => ({
        label: String(item.label ?? ''),
        valor: Number(item.valor || 0)
      })).filter(item => item.valor > 0 || rawList.length <= 3);

      if (formattedData.length === 0) {
        alert("No se encontraron registros en el período y filtros seleccionados.");
        return;
      }

      const newChart = {
        id: Date.now(),
        config: { ...reportForm, title: reportForm.title || `Reporte ${customCharts.length + 1}` },
        data: formattedData,
        details: data.details || []
      };
      
      setCustomCharts([newChart, ...customCharts]);
    } catch (err) {
      alert("Error generando gráfico: " + err.message);
    }
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
      if (tab === 'analitica') {
        cargarLiquidaciones();
        cargarEquipo();
      }
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

  const aplicarPeriodoLiquidacion = (tipo) => {
    setLiqPeriodo(tipo);
    const hoy = new Date();
    let inicio = '';
    let fin = hoy.toISOString().split('T')[0];

    if (tipo === 'esta_semana') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      inicio = startOfWeek.toISOString().split('T')[0];
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      fin = endOfWeek.toISOString().split('T')[0];
    } else if (tipo === 'semana_anterior') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const startOfPrevWeek = new Date(d.setDate(diff));
      inicio = startOfPrevWeek.toISOString().split('T')[0];
      const endOfPrevWeek = new Date(startOfPrevWeek);
      endOfPrevWeek.setDate(startOfPrevWeek.getDate() + 6);
      fin = endOfPrevWeek.toISOString().split('T')[0];
    } else if (tipo === 'este_mes') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (tipo === 'mes_anterior') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0];
    } else if (tipo === 'ultimos_30') {
      const hace30 = new Date();
      hace30.setDate(hoy.getDate() - 30);
      inicio = hace30.toISOString().split('T')[0];
      fin = new Date().toISOString().split('T')[0];
    }

    if (inicio) {
      setLiqFechaInicio(inicio);
      setLiqFechaFin(fin);
      cargarLiquidaciones(inicio, fin, liqBarberoId);
    }
  };

  const cargarLiquidaciones = async (inicio = liqFechaInicio, fin = liqFechaFin, barbero = liqBarberoId) => {
    setLoadingLiquidacion(true);
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=get_liquidacion_barberos&inicio=${inicio}&fin=${fin}&barbero_id=${barbero}`);
      const data = await res.json();
      setLiquidacionData(data);
    } catch (err) {
      console.error("Error cargando liquidaciones:", err);
    } finally {
      setLoadingLiquidacion(false);
    }
  };

  const abrirModalPago = (barbero) => {
    const periodoIni = liquidacionData?.rango?.inicio || liqFechaInicio;
    const periodoFin = liquidacionData?.rango?.fin || liqFechaFin;
    const yaPagado = !!barbero.pago_info;
    
    setPagoModalData({
      trabajador_id: barbero.barbero_id,
      barbero_nombre: barbero.barbero_nombre,
      periodo_inicio: periodoIni,
      periodo_fin: periodoFin,
      monto: yaPagado ? Number(barbero.pago_info.monto) : Number(barbero.total_comision_barbero),
      comision_calculada: Number(barbero.total_comision_barbero),
      total_cortes: barbero.total_cortes,
      dias_trabajados: barbero.dias_trabajados,
      fecha_pago: yaPagado ? barbero.pago_info.fecha_pago : new Date().toISOString().split('T')[0],
      metodo_pago: yaPagado ? barbero.pago_info.metodo_pago : 'Transferencia',
      numero_comprobante: yaPagado ? (barbero.pago_info.numero_comprobante || '') : '',
      notas: yaPagado ? (barbero.pago_info.notas || '') : '',
      pago_id: yaPagado ? barbero.pago_info.id : null,
      es_edicion: yaPagado
    });
  };

  const handleGuardarPago = async (e) => {
    e.preventDefault();
    if (!pagoModalData) return;
    setGuardandoPago(true);
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=registrar_pago_trabajador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoModalData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message || 'Pago registrado exitosamente', 'success');
        setPagoModalData(null);
        cargarLiquidaciones(liqFechaInicio, liqFechaFin, liqBarberoId);
        if (historialPagosModal) {
          cargarHistorialPagos(filtroHistorialBarbero);
        }
      } else {
        showToast(data.message || 'Error al registrar pago', 'error');
      }
    } catch (err) {
      showToast('Error de conexión al registrar pago', 'error');
    } finally {
      setGuardandoPago(false);
    }
  };

  const handleEliminarPago = async (pago_id) => {
    if (!window.confirm("¿Estás seguro de anular y eliminar este registro de pago? La comisión volverá a figurar como Pendiente de Pago.")) return;
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=eliminar_pago_trabajador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago_id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Registro de pago eliminado con éxito', 'success');
        setPagoModalData(null);
        cargarLiquidaciones(liqFechaInicio, liqFechaFin, liqBarberoId);
        if (historialPagosModal) {
          cargarHistorialPagos(filtroHistorialBarbero);
        }
      } else {
        showToast(data.message || 'Error al eliminar pago', 'error');
      }
    } catch (err) {
      showToast('Error de conexión al eliminar pago', 'error');
    }
  };

  const abrirHistorialPagos = (barbero_id = 'todos') => {
    setFiltroHistorialBarbero(barbero_id);
    setHistorialPagosModal(true);
    cargarHistorialPagos(barbero_id);
  };

  const cargarHistorialPagos = async (barbero_id = filtroHistorialBarbero) => {
    setLoadingHistorialPagos(true);
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=get_historial_pagos_trabajadores&trabajador_id=${barbero_id}`);
      const data = await res.json();
      setHistorialPagosData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando historial de pagos:", err);
    } finally {
      setLoadingHistorialPagos(false);
    }
  };

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
    if (dataEstado.porcentaje_barbero !== undefined && dataEstado.porcentaje_tienda !== undefined) {
      setComisionesConfig({
        porcentaje_barbero: Number(dataEstado.porcentaje_barbero),
        porcentaje_tienda: Number(dataEstado.porcentaje_tienda)
      });
    }
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
    if (!clientePremio?.id) return;

    if (premioModalTipo === 'producto' && !premioProductoId) {
      showToast('Por favor selecciona un producto del inventario', 'error');
      return;
    }
    if (premioModalTipo === 'personalizado' && !premioPersonalizadoTexto.trim()) {
      showToast('Por favor escribe el detalle del regalo', 'error');
      return;
    }

    const payload = {
      cliente_id: clientePremio.id,
      producto_id: premioModalTipo === 'producto' ? premioProductoId : null,
      premio_personalizado: premioModalTipo === 'personalizado' ? premioPersonalizadoTexto.trim() : null
    };

    const res = await fetch(`${API_URL}/admin_api.php?action=entregar_premio_crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      showToast(data.message || 'Regalo entregado y registrado exitosamente', 'success');
      setShowPremioModal(false);
      setClientePremio(null);
      setPremioProductoId('');
      setPremioPersonalizadoTexto('');
      cargarCRM();
      cargarBodega();
    } else {
      showToast(data.message || 'Error al entregar premio', 'error');
    }
  };

  const cargarCRM = async () => {
    try {
      const [resCRM, resConf] = await Promise.all([
        fetch(`${API_URL}/admin_api.php?action=get_crm_clientes`),
        fetch(`${API_URL}/admin_api.php?action=get_crm_config`)
      ]);
      const data = await resCRM.json();
      const conf = await resConf.json();
      setCrmClientes(Array.isArray(data) ? data : []);
      if (conf?.meta_cortes_premio) {
        setMetaCortesPremio(Number(conf.meta_cortes_premio));
      }
    } catch (err) {
      console.error("Error cargando CRM:", err);
    }
  };

  const handleGuardarMetaCortes = async (nuevaMeta) => {
    const num = Math.max(1, parseInt(nuevaMeta) || 3);
    setGuardandoMeta(true);
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=set_crm_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_cortes_premio: num })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMetaCortesPremio(num);
        showToast(`Meta de fidelización actualizada: Regalo cada ${num} cortes`, 'success');
        cargarCRM();
      } else {
        showToast('Error al actualizar meta de fidelización', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    } finally {
      setGuardandoMeta(false);
    }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!nuevoClienteForm.rut || !nuevoClienteForm.nombre) {
      showToast('El RUT y Nombre son obligatorios', 'error');
      return;
    }
    setGuardandoCliente(true);
    try {
      const res = await fetch(`${API_URL}/admin_api.php?action=crear_cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoClienteForm)
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message || 'Cliente creado con éxito', 'success');
        setShowNuevoClienteModal(false);
        setNuevoClienteForm({ rut: '', nombre: '', email: '', telefono: '', cortes_acumulados: 0, notas_crm: '', password: '123456' });
        cargarCRM();
      } else {
        showToast(data.message || 'Error al crear cliente', 'error');
      }
    } catch (err) {
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardandoCliente(false);
    }
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

  const modificarComisionDia = async (fecha, pctActual) => {
    const nuevoPct = window.prompt(`Ajustar comisión del barbero para la fecha ${fecha} (%):`, pctActual);
    if (nuevoPct === null) return;
    const pctNum = parseFloat(nuevoPct);
    if (isNaN(pctNum) || pctNum < 0 || pctNum > 100) {
      return alert("Por favor ingresa un porcentaje numérico válido entre 0 y 100.");
    }
    const pctTienda = Math.round((100 - pctNum) * 100) / 100;
    await fetch(`${API_URL}/admin_api.php?action=configurar_comisiones_dia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, porcentaje_barbero: pctNum, porcentaje_tienda: pctTienda })
    });
    
    // Recargar liquidaciones completas
    const resLiq = await fetch(`${API_URL}/admin_api.php?action=get_liquidacion_barberos&inicio=${liqFechaInicio}&fin=${liqFechaFin}&barbero_id=${liqBarberoId}`);
    const dataLiq = await resLiq.json();
    setLiquidacionData(dataLiq);
    
    if (barberoDetalleModal) {
      const bActualizado = (dataLiq.barberos || []).find(b => b.barbero_id === barberoDetalleModal.barbero_id);
      if (bActualizado) setBarberoDetalleModal(bActualizado);
    }
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
    const term = crmSearch.trim().toLowerCase();
    const clientesFiltrados = crmClientes.filter(c => {
      if (!term) return true;
      return (
        (c.nombre && c.nombre.toLowerCase().includes(term)) ||
        (c.rut && c.rut.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.telefono && c.telefono.toLowerCase().includes(term)) ||
        (c.notas_crm && c.notas_crm.toLowerCase().includes(term))
      );
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        
        {/* Cabecera y Barra de Acciones Rápidas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👥 Cartera de Clientes (CRM)
              <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 'normal', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '12px' }}>
                {crmClientes.length} registrados
              </span>
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
              Gestión de clientes, fidelización, historial y entregas de regalos
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input 
                type="text"
                className="input-field"
                placeholder="🔍 Buscar por nombre, RUT, teléfono..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                style={{ margin: 0, paddingRight: '30px', fontSize: '0.85rem' }}
              />
              {crmSearch && (
                <button 
                  onClick={() => setCrmSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            <button 
              className="btn-primary" 
              onClick={() => setShowNuevoClienteModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
            >
              ➕ Crear Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Panel de Configuración de Fidelización / Cuándo Regalar */}
        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <strong style={{ color: 'var(--gold-jewel)', fontSize: '0.95rem' }}>
                Regla de Fidelización: ¿Cada cuántos cortes se entrega un premio?
              </strong>
            </div>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>
              Los clientes calificarán automáticamente para un premio/decant al alcanzar esta cantidad de cortes en el mes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 'bold' }}>Regalar cada:</span>
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleGuardarMetaCortes(num)}
                disabled={guardandoMeta}
                style={{
                  background: metaCortesPremio === num ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.06)',
                  color: metaCortesPremio === num ? '#000' : '#ccc',
                  border: '1px solid ' + (metaCortesPremio === num ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.15)'),
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {num} Cortes
              </button>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '5px' }}>
              <input 
                type="number" 
                min="1" 
                max="20"
                value={metaCortesPremio}
                onChange={e => handleGuardarMetaCortes(e.target.value)}
                style={{ width: '55px', padding: '5px', borderRadius: '6px', background: '#111', color: 'var(--gold-jewel)', border: '1px solid var(--gold-jewel)', textAlign: 'center', fontWeight: 'bold' }}
                title="Personalizar número de cortes"
              />
              <span style={{ fontSize: '0.78rem', color: '#888' }}>cortes</span>
            </div>
          </div>
        </div>

        {/* Tabla CRM de Clientes */}
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={tableHeaderStyle}>Cliente / RUT</th>
                <th style={tableHeaderStyle}>Contacto</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Cortes & Meta ({metaCortesPremio})</th>
                <th style={tableHeaderStyle}>Notas CRM</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones y Regalo</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c, i) => {
                const cortesMes = Number(c.cortes_mes || 0);
                const premiosEntregados = Number(c.premios_mes || 0);
                const metaActual = (premiosEntregados + 1) * metaCortesPremio;
                const calificaPremio = cortesMes >= metaActual;

                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(20, 20, 20, 0.7)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                        <div>
                          <div style={{ color: '#fff' }}>{c.nombre}</div>
                          <small style={{ color: 'var(--gold-jewel)', fontSize: '0.78rem' }}>{c.rut}</small>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ color: '#ccc' }}>{c.email || 'Sin correo'}</div>
                      <small style={{ color: '#aaa' }}>{c.telefono || 'Sin teléfono'}</small>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {calificaPremio ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: '0.9rem' }}>
                            🟢 {cortesMes}/{metaActual}
                          </span>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--gold-jewel)', color: '#000', fontWeight: 'bold', borderRadius: '15px' }} 
                            onClick={() => { setClientePremio(c); setPremioModalTipo('producto'); setShowPremioModal(true); }}
                            title="El cliente cumplió la meta del mes. Entregar premio ganado."
                          >
                            🎁 Entregar Premio
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--gold-jewel)' }}>
                            💈 {cortesMes}/{metaActual}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#888' }}>
                            Faltan {Math.max(0, metaActual - cortesMes)} para regalo
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <textarea 
                        className="input-field" 
                        style={{ height: '38px', width: '220px', margin: 0, fontSize: '0.78rem', resize: 'vertical' }} 
                        defaultValue={c.notas_crm} 
                        placeholder="Escribir preferencias o notas..."
                        onBlur={e => { if(e.target.value !== c.notas_crm) guardarNotasCRM(c.id, e.target.value); }} 
                      />
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                        <button 
                          onClick={() => { setClientePremio(c); setPremioModalTipo('producto'); setShowPremioModal(true); }}
                          style={{
                            background: 'rgba(155, 89, 182, 0.2)',
                            color: '#bb86fc',
                            border: '1px solid #bb86fc',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Dar un regalo rápido o atención VIP a este cliente"
                        >
                          🎁 Regalo Rápido
                        </button>
                        <button 
                          className="btn-outline-gold" 
                          style={{ fontSize: '0.75rem', padding: '5px 10px', whiteSpace: 'nowrap' }} 
                          onClick={() => abrirHistorialCRM(c)}
                          title="Ver historial de visitas y premios recibidos"
                        >
                          👁️ Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...tableCellStyle, textAlign: 'center', padding: '30px', color: '#888' }}>
                    {crmSearch ? `No se encontraron clientes que coincidan con "${crmSearch}".` : 'No hay clientes registrados en el CRM.'}
                  </td>
                </tr>
              )}
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

  const exportarExcelLiquidacion = async () => {
    if (!liquidacionData || !liquidacionData.barberos || liquidacionData.barberos.length === 0) {
      return alert("No hay datos de liquidación para el período seleccionado. Primero selecciona un rango con citas completadas.");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Romana Back-Office';

    // 1. HOJA DE RESUMEN GENERAL
    const wsResumen = workbook.addWorksheet('Resumen General');
    
    // Encabezado
    wsResumen.mergeCells('A1:J1');
    const titleCell = wsResumen.getCell('A1');
    titleCell.value = 'LA ROMANA BARBER SHOP - LIQUIDACIÓN Y COMISIONES';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(1).height = 35;

    wsResumen.mergeCells('A2:J2');
    const periodCell = wsResumen.getCell('A2');
    periodCell.value = `Período: ${liquidacionData.rango.inicio} al ${liquidacionData.rango.fin}`;
    periodCell.font = { italic: true, size: 10, color: { argb: 'FFD4AF37' } };
    periodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A2A2A' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(2).height = 22;

    // Columnas
    wsResumen.getRow(4).values = [
      'BARBERO',
      'ESTADO DE PAGO',
      'FECHA DE PAGO',
      'MÉTODO DE PAGO',
      'N° COMPROBANTE',
      'DÍAS TRABAJADOS',
      'TOTAL CORTES',
      'TOTAL BRUTO ($)',
      'DESCUENTOS ($)',
      'TOTAL NETO ($)',
      'COMISIÓN BARBERO ($)',
      'GANANCIA TIENDA ($)',
      'PROMEDIO BRUTO / DÍA',
      'TICKET PROMEDIO'
    ];
    wsResumen.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsResumen.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    wsResumen.getRow(4).border = { bottom: { style: 'thick', color: { argb: 'FFD4AF37' } } };

    wsResumen.columns = [
      { key: 'barbero', width: 22 },
      { key: 'estado_pago', width: 16, style: { alignment: { horizontal: 'center' } } },
      { key: 'fecha_pago', width: 16, style: { alignment: { horizontal: 'center' } } },
      { key: 'metodo_pago', width: 16, style: { alignment: { horizontal: 'center' } } },
      { key: 'comprobante', width: 18 },
      { key: 'dias', width: 16, style: { numFmt: '#,##0', alignment: { horizontal: 'center' } } },
      { key: 'cortes', width: 15, style: { numFmt: '#,##0', alignment: { horizontal: 'center' } } },
      { key: 'bruto', width: 18, style: { numFmt: '"$"#,##0' } },
      { key: 'descuentos', width: 16, style: { numFmt: '"$"#,##0' } },
      { key: 'neto', width: 18, style: { numFmt: '"$"#,##0' } },
      { key: 'com_barbero', width: 22, style: { numFmt: '"$"#,##0' } },
      { key: 'com_tienda', width: 22, style: { numFmt: '"$"#,##0' } },
      { key: 'prom_dia', width: 22, style: { numFmt: '"$"#,##0' } },
      { key: 'ticket_prom', width: 18, style: { numFmt: '"$"#,##0' } }
    ];

    liquidacionData.barberos.forEach(b => {
      wsResumen.addRow({
        barbero: b.barbero_nombre,
        estado_pago: b.estado_pago || (b.pago_info ? 'Pagado' : 'Pendiente'),
        fecha_pago: b.pago_info?.fecha_pago || '-',
        metodo_pago: b.pago_info?.metodo_pago || '-',
        comprobante: b.pago_info?.numero_comprobante || '-',
        dias: b.dias_trabajados,
        cortes: b.total_cortes,
        bruto: b.total_bruto,
        descuentos: b.total_descuentos,
        neto: b.total_neto,
        com_barbero: b.total_comision_barbero,
        com_tienda: b.total_ganancia_tienda,
        prom_dia: b.promedio_diario_bruto,
        ticket_prom: b.ticket_promedio
      });
    });

    // Fila de Totales
    const tot = liquidacionData.totales_generales;
    const totalRow = wsResumen.addRow({
      barbero: 'TOTALES GENERALES',
      estado_pago: `${tot.barberos_pagados_count || 0} Pagados / ${tot.barberos_pendientes_count || 0} Pend.`,
      fecha_pago: '-',
      metodo_pago: '-',
      comprobante: '-',
      dias: tot.dias_trabajados_total,
      cortes: tot.total_cortes,
      bruto: tot.total_bruto,
      descuentos: tot.total_descuentos,
      neto: tot.total_neto,
      com_barbero: tot.total_comision_barberos,
      com_tienda: tot.total_ganancia_tienda,
      prom_dia: tot.promedio_diario_bruto_global,
      ticket_prom: tot.ticket_promedio_global
    });
    totalRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    totalRow.border = { top: { style: 'thick', color: { argb: 'FFD4AF37' } } };

    // 2. HOJAS INDIVIDUALES POR BARBERO
    liquidacionData.barberos.forEach(b => {
      const sheetName = b.barbero_nombre.substring(0, 25).replace(/[\\/*?:[\]]/g, '');
      const wsB = workbook.addWorksheet(sheetName);

      // Título
      wsB.mergeCells('A1:H1');
      const bTitle = wsB.getCell('A1');
      bTitle.value = `LIQUIDACIÓN DETALLADA: ${b.barbero_nombre.toUpperCase()}`;
      bTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      bTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
      bTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      wsB.getRow(1).height = 30;

      // KPIs
      wsB.mergeCells('A2:H2');
      const bSub = wsB.getCell('A2');
      bSub.value = `Cortes: ${b.total_cortes} | Días: ${b.dias_trabajados} | Bruto: $${b.total_bruto.toLocaleString('es-CL')} | Pago Barbero: $${b.total_comision_barbero.toLocaleString('es-CL')} | Local: $${b.total_ganancia_tienda.toLocaleString('es-CL')} | Prom/Día: $${b.promedio_diario_bruto.toLocaleString('es-CL')}`;
      bSub.font = { bold: true, size: 9, color: { argb: 'FFD4AF37' } };
      bSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A2A2A' } };
      bSub.alignment = { horizontal: 'center', vertical: 'middle' };
      wsB.getRow(2).height = 24;

      // Sección 1: Desglose Día por Día
      wsB.getCell('A4').value = '1. DESGLOSE DÍA POR DÍA (CON % DE COMISIÓN DIARIO APLICADO)';
      wsB.getCell('A4').font = { bold: true, color: { argb: 'FFD4AF37' } };

      wsB.getRow(5).values = [
        'FECHA',
        'DÍA',
        'CORTES DÍA',
        'TOTAL BRUTO ($)',
        '% BARBERO',
        'PAGO BARBERO ($)',
        '% TIENDA',
        'GANANCIA TIENDA ($)'
      ];
      wsB.getRow(5).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsB.getRow(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
      wsB.getRow(5).border = { bottom: { style: 'thin', color: { argb: 'FFD4AF37' } } };

      wsB.columns = [
        { key: 'fecha', width: 14 },
        { key: 'dia', width: 14 },
        { key: 'cortes', width: 14, style: { numFmt: '#,##0', alignment: { horizontal: 'center' } } },
        { key: 'bruto', width: 18, style: { numFmt: '"$"#,##0' } },
        { key: 'pct_b', width: 14, style: { alignment: { horizontal: 'center' } } },
        { key: 'com_b', width: 18, style: { numFmt: '"$"#,##0' } },
        { key: 'pct_t', width: 14, style: { alignment: { horizontal: 'center' } } },
        { key: 'com_t', width: 18, style: { numFmt: '"$"#,##0' } }
      ];

      (b.detalle_dias || []).forEach(d => {
        wsB.addRow({
          fecha: d.fecha,
          dia: d.dia_nombre,
          cortes: d.cortes_dia,
          bruto: d.total_bruto_dia,
          pct_b: `${d.porcentaje_barbero}%`,
          com_b: d.comision_barbero_dia,
          pct_t: `${d.porcentaje_tienda}%`,
          com_t: d.ganancia_tienda_dia
        });
      });

      // Sección 2: Desglose de Citas
      const startCitasRow = (b.detalle_dias || []).length + 8;
      wsB.getCell(`A${startCitasRow}`).value = '2. DETALLE INDIVIDUAL DE CITAS ATENDIDAS';
      wsB.getCell(`A${startCitasRow}`).font = { bold: true, color: { argb: 'FFD4AF37' } };

      const headerCitasRow = startCitasRow + 1;
      wsB.getRow(headerCitasRow).values = [
        'FECHA',
        'HORA',
        'CLIENTE',
        'RUT',
        'SERVICIOS REALIZADOS',
        'MÉTODO PAGO',
        'TOTAL COBRADO ($)',
        'COMISIÓN BARBERO ($)'
      ];
      wsB.getRow(headerCitasRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsB.getRow(headerCitasRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };

      (b.citas || []).forEach(c => {
        wsB.addRow([
          c.fecha,
          c.hora.substring(0, 5),
          c.cliente_nombre,
          c.cliente_rut || '-',
          c.servicios_nombres,
          c.metodo_pago || 'Efectivo',
          Number(c.subtotal),
          Number(c.comision_barbero)
        ]);
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Liquidacion_La_Romana_${liquidacionData.rango.inicio}_al_${liquidacionData.rango.fin}.xlsx`);
  };

  const renderAnalitica = () => {
    const tot = liquidacionData?.totales_generales;
    const barberosList = liquidacionData?.barberos || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', animation: 'fadeIn 0.3s ease-in' }}>
        
        {/* Cabecera Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 Liquidación de Barberos & Business Intelligence
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
              Cálculo de comisiones con porcentajes diarios específicos, promedios y desglose por período.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-outline-gold" 
              onClick={() => abrirHistorialPagos('todos')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
            >
              📜 Historial de Pagos
            </button>
            <button 
              className="btn-primary" 
              onClick={exportarExcelLiquidacion}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
            >
              📥 Exportar Liquidación (.xlsx)
            </button>
            <button 
              className="btn-outline-gold" 
              onClick={() => cargarLiquidaciones(liqFechaInicio, liqFechaFin, liqBarberoId)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Panel de Filtro de Período */}
        <div style={{ background: 'rgba(26, 26, 26, 0.7)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '12px', border: '1px solid var(--gold-jewel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-jewel)', fontSize: '0.95rem' }}>
              🗓️ Seleccionar Período de Liquidación:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'esta_semana', label: '📅 Esta Semana' },
                { id: 'semana_anterior', label: '📅 Semana Anterior' },
                { id: 'este_mes', label: '🗓️ Este Mes' },
                { id: 'mes_anterior', label: '🗓️ Mes Anterior' },
                { id: 'ultimos_30', label: '⏱️ Últimos 30 Días' },
                { id: 'custom', label: '⚙️ Personalizado' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => aplicarPeriodoLiquidacion(p.id)}
                  style={{
                    background: liqPeriodo === p.id ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.06)',
                    color: liqPeriodo === p.id ? '#000' : '#ccc',
                    border: '1px solid ' + (liqPeriodo === p.id ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.1)'),
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Fecha Desde:</label>
              <input 
                type="date" 
                className="input-field" 
                value={liqFechaInicio} 
                onChange={e => { setLiqFechaInicio(e.target.value); setLiqPeriodo('custom'); }} 
                style={{ margin: 0 }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Fecha Hasta:</label>
              <input 
                type="date" 
                className="input-field" 
                value={liqFechaFin} 
                onChange={e => { setLiqFechaFin(e.target.value); setLiqPeriodo('custom'); }} 
                style={{ margin: 0 }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Filtrar Barbero:</label>
              <select 
                className="input-field" 
                value={liqBarberoId} 
                onChange={e => {
                  setLiqBarberoId(e.target.value);
                  cargarLiquidaciones(liqFechaInicio, liqFechaFin, e.target.value);
                }} 
                style={{ margin: 0 }}
              >
                <option value="todos">👥 Todos los Barberos</option>
                {(trabajadores || []).map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <button 
                className="btn-primary" 
                onClick={() => cargarLiquidaciones(liqFechaInicio, liqFechaFin, liqBarberoId)}
                style={{ width: '100%', padding: '10px' }}
              >
                Filtrar Resultados
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen del Período */}
        {tot && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div className="stat-card-badge">
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>💈 Cortes Realizados</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff' }}>{tot.total_cortes} citas</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-jewel)' }}>{tot.dias_trabajados_total} días con actividad</span>
            </div>

            <div className="stat-card-badge">
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>💰 Total Bruto Facturado</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--gold-jewel)' }}>
                ${Number(tot.total_bruto).toLocaleString('es-CL')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#aaa' }}>En servicios de barbería</span>
            </div>

            <div className="stat-card-badge" style={{ borderLeft: '4px solid #3498db' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>💵 Comisiones Devengadas</span>
              <strong style={{ fontSize: '1.4rem', color: '#3498db' }}>
                ${Number(tot.total_comision_barberos).toLocaleString('es-CL')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Total a pagar barberos</span>
            </div>

            <div className="stat-card-badge" style={{ borderLeft: '4px solid #2ecc71' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>🟢 Comisiones Pagadas</span>
              <strong style={{ fontSize: '1.4rem', color: '#2ecc71' }}>
                ${Number(tot.total_comision_pagada || 0).toLocaleString('es-CL')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#2ecc71' }}>
                {tot.barberos_pagados_count || 0} barberos liquidados
              </span>
            </div>

            <div className="stat-card-badge" style={{ borderLeft: '4px solid #f1c40f' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>🟡 Pendiente de Pago</span>
              <strong style={{ fontSize: '1.4rem', color: '#f1c40f' }}>
                ${Number(tot.total_comision_pendiente || 0).toLocaleString('es-CL')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#f1c40f' }}>
                {tot.barberos_pendientes_count || 0} barberos por pagar
              </span>
            </div>

            <div className="stat-card-badge" style={{ borderLeft: '4px solid var(--gold-jewel)' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>🏬 Ganancia Local (Tienda)</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--gold-jewel)' }}>
                ${Number(tot.total_ganancia_tienda).toLocaleString('es-CL')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Margen neto retenido</span>
            </div>
          </div>
        )}

        {/* Banner Informativo de Dinámica de Comisiones y Registro de Pagos */}
        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>💳</span>
            <span style={{ fontSize: '0.84rem', color: '#ddd' }}>
              <strong>Control y Registro de Pagos:</strong> Puedes marcar como pagada la liquidación de cada barbero con el botón <strong>"💰 Registrar Pago"</strong>. Quedará guardado el monto, método y número de transferencia.
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--gold-jewel)', fontStyle: 'italic' }}>
            ✨ Consulta el historial completo haciendo clic en "📜 Historial de Pagos"
          </span>
        </div>

        {/* Tabla de Liquidación por Barbero */}
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.1rem' }}>
              📋 Liquidación Consolidada por Barbero ({liquidacionData?.rango?.inicio} a {liquidacionData?.rango?.fin})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Haz clic en Registrar Pago para liquidar o en Desglose para ver el día a día</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={tableHeaderStyle}>Barbero</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Días Trab.</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Cortes</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Total Bruto</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right', color: '#3498db' }}>Comisión ($)</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado de Pago</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right', color: 'var(--gold-jewel)' }}>Ganancia Local ($)</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Prom. Diario</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {barberosList.map((b, i) => {
                const estaPagado = b.estado_pago === 'Pagado' || !!b.pago_info;

                return (
                  <tr 
                    key={b.barbero_id} 
                    style={{ background: i % 2 === 0 ? 'rgba(20, 20, 20, 0.7)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {/* Barbero */}
                    <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>💈</span>
                        <div>
                          <div>{b.barbero_nombre}</div>
                          {estaPagado && b.pago_info?.numero_comprobante && (
                            <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 'normal' }}>
                              Comprobante: {b.pago_info.numero_comprobante}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Días y Cortes */}
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{b.dias_trabajados}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold' }}>{b.total_cortes}</td>

                    {/* Total Bruto */}
                    <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold' }}>
                      ${Number(b.total_bruto).toLocaleString('es-CL')}
                    </td>

                    {/* Comisión Barbero */}
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: '#3498db', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      ${Number(b.total_comision_barbero).toLocaleString('es-CL')}
                    </td>

                    {/* Estado de Pago Badge */}
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {estaPagado ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{
                            background: 'rgba(46, 204, 113, 0.15)',
                            color: '#2ecc71',
                            border: '1px solid #2ecc71',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ✅ Pagado
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
                            {b.pago_info?.fecha_pago} ({b.pago_info?.metodo_pago || 'Transferencia'})
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          background: 'rgba(241, 196, 15, 0.15)',
                          color: '#f1c40f',
                          border: '1px solid #f1c40f',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          🟡 Pendiente
                        </span>
                      )}
                    </td>

                    {/* Ganancia Tienda */}
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                      ${Number(b.total_ganancia_tienda).toLocaleString('es-CL')}
                    </td>

                    {/* Promedio Diario */}
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: '#ccc' }}>
                      ${Number(b.promedio_diario_bruto).toLocaleString('es-CL')}
                    </td>

                    {/* Acciones */}
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                        {estaPagado ? (
                          <button 
                            className="btn-primary" 
                            onClick={() => abrirModalPago(b)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap', background: '#27ae60', borderColor: '#27ae60' }}
                            title="Ver detalles del comprobante o modificar registro de pago"
                          >
                            ✏️ Editar Pago
                          </button>
                        ) : (
                          <button 
                            className="btn-primary" 
                            onClick={() => abrirModalPago(b)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                            title="Marcar como pagado y registrar transferencia o efectivo"
                          >
                            💰 Registrar Pago
                          </button>
                        )}
                        
                        <button 
                          className="btn-outline-gold" 
                          onClick={() => setBarberoDetalleModal(b)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          title="Ver desglose de cortes y porcentajes día por día"
                        >
                          👁️ Desglose
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {barberosList.length === 0 && !loadingLiquidacion && (
                <tr>
                  <td colSpan="9" style={{ ...tableCellStyle, textAlign: 'center', padding: '30px', color: '#888' }}>
                    No hay citas completadas en el rango de fechas seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sección de Creador de Gráficos e Inteligencia de Negocios */}
        <div style={{ marginTop: '15px' }}>
          <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '12px', border: '1px solid #333', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'var(--gold-jewel)' }}>📈 Creador de Gráficos BI Personalizados</h3>
              <button className="btn-outline-gold" onClick={exportarExcel} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                📊 Exportar Gráficos Generados (.xlsx)
              </button>
            </div>

            <form onSubmit={generarGrafico} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'end' }}>
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Desde</label>
                  <input type="date" className="input-field" value={reportForm.startDate} onChange={e=>setReportForm({...reportForm, startDate: e.target.value})} style={{ margin: 0 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Hasta</label>
                  <input type="date" className="input-field" value={reportForm.endDate} onChange={e=>setReportForm({...reportForm, endDate: e.target.value})} style={{ margin: 0 }} />
                </div>
              </div>

              <div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }}>
                  + Generar Gráfico
                </button>
              </div>
            </form>
          </div>

          {/* Grid de Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
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
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #D4AF37', borderRadius: '8px' }} 
                        itemStyle={{ color: '#D4AF37' }} 
                        formatter={(v, name, item) => chart.config.metric.includes('ingresos') ? [`$${Number(v).toLocaleString('es-CL')}`, item?.payload?.label || name || 'Monto'] : [v, item?.payload?.label || name || 'Cantidad']} 
                      />
                      <Pie 
                        data={chart.data} 
                        dataKey="valor" 
                        nameKey="label" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40} 
                        outerRadius={75} 
                        paddingAngle={2}
                        label={({ label, percent }) => {
                          const pct = (percent * 100).toFixed(0);
                          if (pct < 3) return '';
                          const cleanName = label ? (label.length > 12 ? label.substring(5) : label) : '';
                          return `${cleanName} (${pct}%)`;
                        }}
                      >
                        {chart.data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              '#D4AF37', '#E67E22', '#3498DB', '#2ECC71', 
                              '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', 
                              '#34495E', '#16A085', '#E84393', '#00CEC9'
                            ][index % 12]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  const renderPedidos = () => {
    const filterText = (pedidosSearch || '').trim().toLowerCase();

    // 1. Cálculos de fechas para filtros
    const now = new Date();
    const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const ayerObj = new Date();
    ayerObj.setDate(now.getDate() - 1);
    const ayerStr = `${ayerObj.getFullYear()}-${String(ayerObj.getMonth() + 1).padStart(2, '0')}-${String(ayerObj.getDate()).padStart(2, '0')}`;
    
    const hace7diasObj = new Date();
    hace7diasObj.setDate(now.getDate() - 7);
    hace7diasObj.setHours(0, 0, 0, 0);

    const primerDiaMesObj = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Filtrar
    const pedidosFiltrados = pedidosAdmin.filter(p => {
      // Filtro por Estado
      if (pedidosFiltroEstado !== 'todos' && p.estado !== pedidosFiltroEstado) {
        return false;
      }

      // Filtro por Período de Fecha
      const fechaP = new Date(p.fecha_creacion);
      const fechaPStr = p.fecha_creacion ? p.fecha_creacion.split(' ')[0].split('T')[0] : '';

      if (pedidosFiltroFecha === 'hoy' && fechaPStr !== hoyStr) {
        return false;
      }
      if (pedidosFiltroFecha === 'ayer' && fechaPStr !== ayerStr) {
        return false;
      }
      if (pedidosFiltroFecha === '7dias' && fechaP < hace7diasObj) {
        return false;
      }
      if (pedidosFiltroFecha === 'mes' && fechaP < primerDiaMesObj) {
        return false;
      }
      if (pedidosFiltroFecha === 'custom') {
        if (pedidosFechaDesde && fechaPStr < pedidosFechaDesde) return false;
        if (pedidosFechaHasta && fechaPStr > pedidosFechaHasta) return false;
      }

      // Filtro por Búsqueda Multi-campo (ID, Cliente, RUT, Teléfono, Email, Productos)
      if (filterText) {
        const idFormatted = `lr-${String(p.id).padStart(4, '0')}`.toLowerCase();
        const idRaw = String(p.id);
        const clienteNom = (p.cliente || '').toLowerCase();
        const clienteRut = (p.cliente_rut || '').toLowerCase();
        const clienteTel = (p.cliente_telefono || '').toLowerCase();
        const clienteMail = (p.cliente_email || '').toLowerCase();
        const dateFormatted = new Date(p.fecha_creacion).toLocaleDateString().toLowerCase();
        const prodsMatch = (p.detalles || []).some(d => (d.producto || '').toLowerCase().includes(filterText));

        const matchesSearch = 
          idFormatted.includes(filterText) ||
          idRaw.includes(filterText) ||
          clienteNom.includes(filterText) ||
          clienteRut.includes(filterText) ||
          clienteTel.includes(filterText) ||
          clienteMail.includes(filterText) ||
          dateFormatted.includes(filterText) ||
          prodsMatch;

        if (!matchesSearch) return false;
      }

      return true;
    });

    // 3. Ordenar
    const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
      if (pedidosSortOrder === 'fecha_desc') {
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      }
      if (pedidosSortOrder === 'fecha_asc') {
        return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
      }
      if (pedidosSortOrder === 'monto_desc') {
        return Number(b.total) - Number(a.total);
      }
      if (pedidosSortOrder === 'monto_asc') {
        return Number(a.total) - Number(b.total);
      }
      if (pedidosSortOrder === 'id_desc') {
        return b.id - a.id;
      }
      return 0;
    });

    // 4. Estadísticas del filtro
    const totalRecaudado = pedidosOrdenados.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const totalPendientes = pedidosOrdenados.filter(p => p.estado === 'Pendiente' || p.estado === 'Preparando').length;
    const totalEntregados = pedidosOrdenados.filter(p => p.estado === 'Entregado' || p.estado === 'Pagado').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-in' }}>
        {/* Cabecera Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--gold-jewel)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🧾 Gestión y Control de Tickets / Pedidos
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Visualiza, filtra, ordena y administra los tickets emitidos en la tienda y barbería.
            </p>
          </div>
          <button 
            onClick={cargarPedidosAdmin} 
            className="btn-outline-gold" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Actualizar Tickets
          </button>
        </div>

        {/* Tarjetas de Resumen KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          <div className="stat-card-badge">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Tickets Visibles</span>
            <strong style={{ fontSize: '1.4rem', color: '#fff' }}>{pedidosOrdenados.length} <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'normal' }}>/ {pedidosAdmin.length}</span></strong>
          </div>
          <div className="stat-card-badge">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Total Recaudado</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--gold-jewel)' }}>${totalRecaudado.toLocaleString('es-CL')}</strong>
          </div>
          <div className="stat-card-badge">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏳ Pendientes / Preparando</span>
            <strong style={{ fontSize: '1.4rem', color: '#f1c40f' }}>{totalPendientes}</strong>
          </div>
          <div className="stat-card-badge">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Entregados / Pagados</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--green-emerald-light)' }}>{totalEntregados}</strong>
          </div>
        </div>

        {/* Barra de Filtros, Búsqueda y Ordenamiento */}
        <div style={{ background: 'rgba(26, 26, 26, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid #333', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
            
            {/* Buscador Multi-campo */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                🔍 Buscar Ticket / Cliente / RUT / Ítems
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Ej: LR-0001, Juan, 19123456, Cera..." 
                  className="input-field" 
                  style={{ width: '100%', margin: 0, paddingRight: pedidosSearch ? '30px' : '10px' }}
                  value={pedidosSearch}
                  onChange={e => setPedidosSearch(e.target.value)}
                />
                {pedidosSearch && (
                  <button 
                    onClick={() => setPedidosSearch('')} 
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Ordenamiento por Fecha / Monto */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                ⏱️ Ordenar Por
              </label>
              <select 
                className="input-field" 
                style={{ width: '100%', margin: 0 }}
                value={pedidosSortOrder}
                onChange={e => setPedidosSortOrder(e.target.value)}
              >
                <option value="fecha_desc">📅 Fecha: Más Recientes Primero</option>
                <option value="fecha_asc">📅 Fecha: Más Antiguos Primero</option>
                <option value="monto_desc">💰 Monto: Mayor a Menor</option>
                <option value="monto_asc">🏷️ Monto: Menor a Mayor</option>
                <option value="id_desc">🔢 N° Ticket: Mayor a Menor</option>
              </select>
            </div>

            {/* Filtro por Fecha / Período */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                🗓️ Período de Fecha
              </label>
              <select 
                className="input-field" 
                style={{ width: '100%', margin: 0 }}
                value={pedidosFiltroFecha}
                onChange={e => setPedidosFiltroFecha(e.target.value)}
              >
                <option value="todos">Todos los Tiempos</option>
                <option value="hoy">Hoy ({hoyStr})</option>
                <option value="ayer">Ayer</option>
                <option value="7dias">Últimos 7 Días</option>
                <option value="mes">Este Mes</option>
                <option value="custom">📅 Rango Personalizado...</option>
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                🏷️ Estado del Ticket
              </label>
              <select 
                className="input-field" 
                style={{ width: '100%', margin: 0 }}
                value={pedidosFiltroEstado}
                onChange={e => setPedidosFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los Estados</option>
                <option value="Pendiente">🟡 Pendiente</option>
                <option value="Preparando">🔵 Preparando</option>
                <option value="Pagado">🟢 Pagado</option>
                <option value="Entregado">✨ Entregado</option>
                <option value="Cancelado">🔴 Cancelado</option>
              </select>
            </div>
          </div>

          {/* Rango de Fechas Personalizado */}
          {pedidosFiltroFecha === 'custom' && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>Desde:</label>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ margin: 0 }}
                  value={pedidosFechaDesde}
                  onChange={e => setPedidosFechaDesde(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>Hasta:</label>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ margin: 0 }}
                  value={pedidosFechaHasta}
                  onChange={e => setPedidosFechaHasta(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Botón para Limpiar Filtros si hay alguno activo */}
          {(pedidosSearch || pedidosFiltroEstado !== 'todos' || pedidosFiltroFecha !== 'todos' || pedidosSortOrder !== 'fecha_desc') && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setPedidosSearch('');
                  setPedidosFiltroEstado('todos');
                  setPedidosFiltroFecha('todos');
                  setPedidosSortOrder('fecha_desc');
                  setPedidosFechaDesde('');
                  setPedidosFechaHasta('');
                }}
                style={{ background: 'transparent', border: '1px dashed #666', color: '#aaa', padding: '4px 12px', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                🧹 Restablecer todos los filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla de Tickets */}
        <div style={{ background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid #333', overflowX: 'auto', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>N° Ticket / Fecha</th>
                <th style={tableHeaderStyle}>Cliente</th>
                <th style={tableHeaderStyle}>Detalles (Artículos / Boleta)</th>
                <th style={tableHeaderStyle}>Total ($)</th>
                <th style={tableHeaderStyle}>Estado</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosOrdenados.map((p, i) => {
                const idFormatted = `LR-${String(p.id).padStart(4, '0')}`;
                const fechaObj = new Date(p.fecha_creacion);
                const fechaStr = fechaObj.toLocaleDateString('es-CL');
                const horaStr = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(20, 20, 20, 0.7)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Ticket & Fecha */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top' }}>
                      <div style={{ display: 'inline-block', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--gold-jewel)', padding: '2px 8px', borderRadius: '6px', color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>
                        {idFormatted}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📅 {fechaStr}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        ⏰ {horaStr} hrs
                      </div>
                    </td>

                    {/* Cliente */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>👤 {p.cliente}</strong>
                      {p.cliente_rut && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gold-jewel)', marginTop: '2px' }}>
                          🪪 RUT: {p.cliente_rut}
                        </div>
                      )}
                      {p.cliente_telefono && (
                        <a 
                          href={`https://wa.me/${p.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${p.cliente}, te escribimos de La Romana respecto a tu ticket ${idFormatted}.`)}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ fontSize: '0.8rem', color: 'var(--green-emerald-light)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                        >
                          🟢 {p.cliente_telefono}
                        </a>
                      )}
                      {p.cliente_email && (
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                          ✉️ {p.cliente_email}
                        </div>
                      )}
                    </td>

                    {/* Detalles / Productos */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top', fontSize: '0.85rem' }}>
                      {(!p.detalles || p.detalles.length === 0) ? (
                        <span style={{ color: '#888', fontStyle: 'italic' }}>Sin desglose de ítems</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#ddd' }}>
                          {p.detalles.map((det, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>
                              <strong>{det.cantidad}x</strong> {det.producto} - <span style={{ color: 'var(--gold-jewel)' }}>${Number(det.precio_unitario).toLocaleString('es-CL')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Total */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top', color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                      ${Number(p.total).toLocaleString('es-CL')}
                    </td>

                    {/* Estado */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top' }}>
                      <select 
                        value={p.estado}
                        onChange={(e) => cambiarEstadoPedido(p.id, e.target.value)}
                        style={{
                          background: p.estado === 'Pagado' || p.estado === 'Entregado' ? 'rgba(39, 174, 96, 0.2)' : 
                                      p.estado === 'Cancelado' ? 'rgba(231, 76, 60, 0.2)' : 
                                      p.estado === 'Preparando' ? 'rgba(41, 128, 185, 0.2)' : 
                                      'rgba(241, 196, 15, 0.2)',
                          color: p.estado === 'Pagado' || p.estado === 'Entregado' ? 'var(--green-emerald-light)' : 
                                 p.estado === 'Cancelado' ? '#e74c3c' : 
                                 p.estado === 'Preparando' ? '#3498db' : 
                                 '#f1c40f',
                          border: `1px solid ${
                            p.estado === 'Pagado' || p.estado === 'Entregado' ? 'var(--green-emerald-light)' : 
                            p.estado === 'Cancelado' ? '#e74c3c' : 
                            p.estado === 'Preparando' ? '#3498db' : 
                            '#f1c40f'
                          }`,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Pendiente" style={{color: '#000'}}>🟡 Pendiente</option>
                        <option value="Preparando" style={{color: '#000'}}>🔵 Preparando</option>
                        <option value="Pagado" style={{color: '#000'}}>🟢 Pagado</option>
                        <option value="Entregado" style={{color: '#000'}}>✨ Entregado</option>
                        <option value="Cancelado" style={{color: '#000'}}>🔴 Cancelado</option>
                      </select>
                    </td>

                    {/* Acciones */}
                    <td style={{ ...tableCellStyle, verticalAlign: 'top', textAlign: 'center' }}>
                      <button 
                        onClick={() => setTicketDetalleModal(p)}
                        className="btn-outline-gold"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        title="Ver comprobante y detalle completo"
                      >
                        👁️ Ver Boleta
                      </button>
                    </td>
                  </tr>
                );
              })}

              {pedidosOrdenados.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ ...tableCellStyle, textAlign: 'center', padding: '40px', color: '#888' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                    <div style={{ fontSize: '1rem', color: '#fff', marginBottom: '5px' }}>No se encontraron tickets con los filtros actuales.</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Intenta cambiar los términos de búsqueda o ampliar el rango de fechas.</div>
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

        {/* Modal Historial CRM Mejorado */}
        {historialCRMActivo && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div style={{ 
              background: '#181818', 
              borderRadius: '16px', 
              width: '100%', 
              maxWidth: '680px', 
              maxHeight: '90vh', 
              border: '2px solid var(--gold-jewel)', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.95)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              
              {/* Header Fijo con Boton de Cierre */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>👤</span>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.25rem' }}>
                        Historial: {historialCRMActivo.nombre}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>🪪 RUT: <strong style={{ color: '#fff' }}>{historialCRMActivo.rut}</strong></span>
                        {historialCRMActivo.telefono && <span>📱 {historialCRMActivo.telefono}</span>}
                        {historialCRMActivo.email && <span>✉️ {historialCRMActivo.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setHistorialCRMActivo(null)} 
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1, padding: '0 5px' }}
                  title="Cerrar ventana"
                >
                  ×
                </button>
              </div>

              {/* Barra de Resumen / KPIs */}
              <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Visitas Totales</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{historialData.citas?.length || 0}</div>
                </div>
                <div style={{ background: 'rgba(212,175,55,0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-jewel)' }}>Cortes este Mes</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-jewel)' }}>{historialData.cortes_mes || 0}</div>
                </div>
                <div style={{ background: 'rgba(155, 89, 182, 0.1)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(155, 89, 182, 0.25)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#bb86fc' }}>Regalos Recibidos</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#bb86fc' }}>{historialData.recompensas?.length || 0}</div>
                </div>
              </div>

              {/* Selector de Pestanas */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#141414' }}>
                <button
                  type="button"
                  onClick={() => setHistorialCRMTab('visitas')}
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    background: historialCRMTab === 'visitas' ? 'rgba(212,175,55,0.15)' : 'transparent',
                    color: historialCRMTab === 'visitas' ? 'var(--gold-jewel)' : '#888',
                    border: 'none',
                    borderBottom: historialCRMTab === 'visitas' ? '3px solid var(--gold-jewel)' : '3px solid transparent',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  📅 Visitas y Citas ({historialData.citas?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setHistorialCRMTab('regalos')}
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    background: historialCRMTab === 'regalos' ? 'rgba(155, 89, 182, 0.18)' : 'transparent',
                    color: historialCRMTab === 'regalos' ? '#bb86fc' : '#888',
                    border: 'none',
                    borderBottom: historialCRMTab === 'regalos' ? '3px solid #bb86fc' : '3px solid transparent',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🎁 Premios y Regalos VIP ({historialData.recompensas?.length || 0})
                </button>
              </div>

              {/* Contenido Scrolleable de las Pestanas */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxHeight: '50vh' }}>
                
                {/* Pestana: Visitas */}
                {historialCRMTab === 'visitas' && (
                  <div>
                    {(!historialData.citas || historialData.citas.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                        No hay visitas registradas para este cliente.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {historialData.citas.map((c, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              background: 'rgba(255,255,255,0.03)', 
                              border: '1px solid rgba(255,255,255,0.07)', 
                              borderRadius: '10px', 
                              padding: '12px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--gold-jewel)', fontSize: '0.95rem' }}>📅 {c.fecha}</strong>
                                <span style={{ color: '#aaa', fontSize: '0.82rem' }}>🕒 {c.hora?.substring(0,5)} hrs</span>
                                <span style={{ 
                                  fontSize: '0.72rem', 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  background: c.estado === 'Completada' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                                  color: c.estado === 'Completada' ? '#2ecc71' : '#e74c3c',
                                  fontWeight: 'bold'
                                }}>
                                  {c.estado}
                                </span>
                              </div>
                              <div style={{ color: '#ddd', fontSize: '0.84rem' }}>
                                💈 Barbero: <strong style={{ color: '#fff' }}>{c.barbero}</strong>
                              </div>
                              {c.servicios && (
                                <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '2px' }}>
                                  ✂️ {c.servicios}
                                </div>
                              )}
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              {c.total_pagado && (
                                <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                  $${Number(c.total_pagado).toLocaleString('es-CL')}
                                </div>
                              )}
                              {c.decant_entregado && (
                                <div style={{ marginTop: '4px', fontSize: '0.75rem', background: 'rgba(155, 89, 182, 0.2)', color: '#bb86fc', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(155, 89, 182, 0.4)' }}>
                                  🎁 Decant: {c.decant_entregado}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pestana: Premios y Regalos VIP */}
                {historialCRMTab === 'regalos' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                        Registro de regalos, decants y premios VIP entregados a este cliente:
                      </span>
                      <button
                        onClick={() => {
                          setClientePremio(historialCRMActivo);
                          setPremioModalTipo('producto');
                          setShowPremioModal(true);
                        }}
                        style={{
                          background: 'var(--gold-jewel)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        🎁 Dar Regalo Ahora
                      </button>
                    </div>

                    {(!historialData.recompensas || historialData.recompensas.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '35px', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎁</div>
                        <div style={{ color: '#fff', marginBottom: '4px' }}>No hay registros de regalos entregados aún.</div>
                        <span style={{ fontSize: '0.8rem' }}>Puedes entregarle un regalo ahora usando el botón superior.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {historialData.recompensas.map((r, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              background: 'rgba(155, 89, 182, 0.08)', 
                              border: '1px solid rgba(155, 89, 182, 0.3)', 
                              borderRadius: '10px', 
                              padding: '14px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🎁</span>
                                <strong style={{ color: '#fff', fontSize: '0.98rem' }}>
                                  {r.aroma_decant}
                                </strong>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#aaa' }}>
                                🏷️ Modalidad: <span style={{ color: '#bb86fc' }}>{r.tipo || 'Recompensa VIP'}</span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--gold-jewel)', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                📅 {r.fecha_entrega}
                              </div>
                              <span style={{ fontSize: '0.72rem', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block', marginTop: '3px' }}>
                                ✅ Entregado
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Footer Fijo con Boton de Cierre */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-outline-gold" 
                  onClick={() => setHistorialCRMActivo(null)}
                  style={{ padding: '8px 24px', fontWeight: 'bold' }}
                >
                  Cerrar Historial
                </button>
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
             gap: '10px',
           fontWeight: 'bold',
           animation: 'fadeIn 0.3s ease-out'
         }}>
           {toast.type === 'success' ? '✅' : '❌'} {toast.message}
         </div>
       )}

       {/* Modal Entregar Premio VIP / Regalo Rápido */}
       {showPremioModal && clientePremio && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1400, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
           <div style={{ background: '#181818', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '480px', border: '2px solid var(--gold-jewel)', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ fontSize: '1.8rem' }}>🎁</span>
                 <div>
                   <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.2rem' }}>Entregar Regalo / Premio</h3>
                   <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Fidelización y Atención VIP</span>
                 </div>
               </div>
               <button 
                 onClick={() => { setShowPremioModal(false); setClientePremio(null); }} 
                 style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
               >
                 ×
               </button>
             </div>

             {/* Ficha Cliente */}
             <div style={{ background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', padding: '12px 16px', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '18px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                 <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Cliente:</span>
                 <strong style={{ color: '#fff' }}>👤 {clientePremio.nombre}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Cortes este mes:</span>
                 <span style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                   {clientePremio.cortes_mes || 0} cortes (Meta: cada {metaCortesPremio})
                 </span>
               </div>
             </div>

             <form onSubmit={handleEntregarPremio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               
               {/* Selector de Tipo de Regalo */}
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button
                   type="button"
                   onClick={() => setPremioModalTipo('producto')}
                   style={{
                     flex: 1,
                     padding: '8px 12px',
                     borderRadius: '8px',
                     fontSize: '0.82rem',
                     fontWeight: 'bold',
                     cursor: 'pointer',
                     background: premioModalTipo === 'producto' ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.06)',
                     color: premioModalTipo === 'producto' ? '#000' : '#ccc',
                     border: '1px solid ' + (premioModalTipo === 'producto' ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.15)')
                   }}
                 >
                   📦 Del Inventario
                 </button>
                 <button
                   type="button"
                   onClick={() => setPremioModalTipo('personalizado')}
                   style={{
                     flex: 1,
                     padding: '8px 12px',
                     borderRadius: '8px',
                     fontSize: '0.82rem',
                     fontWeight: 'bold',
                     cursor: 'pointer',
                     background: premioModalTipo === 'personalizado' ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.06)',
                     color: premioModalTipo === 'personalizado' ? '#000' : '#ccc',
                     border: '1px solid ' + (premioModalTipo === 'personalizado' ? 'var(--gold-jewel)' : 'rgba(255,255,255,0.15)')
                   }}
                 >
                   ✨ Detalle / Personalizado
                 </button>
               </div>

               {premioModalTipo === 'producto' ? (
                 <div>
                   <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '5px' }}>
                     Seleccionar Producto de Regalo (Decants, Pomadas, Gorras...):
                   </label>
                   <select 
                     className="input-field" 
                     style={{ margin: 0 }}
                     value={premioProductoId}
                     onChange={e => setPremioProductoId(e.target.value)}
                   >
                     <option value="">-- Seleccionar Producto del Inventario --</option>
                     {productos.filter(p => Number(p.stock) > 0).map(p => (
                       <option key={p.id} value={p.id}>
                         {p.nombre} (Stock: {p.stock} unid. | ${Number(p.precio).toLocaleString('es-CL')})
                       </option>
                     ))}
                   </select>
                   <span style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px', display: 'block' }}>
                     Se descontará automáticamente 1 unidad del stock de la bodega.
                   </span>
                 </div>
               ) : (
                 <div>
                   <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '5px' }}>
                     Nombre o Detalle del Regalo:
                   </label>
                   <input 
                     type="text"
                     className="input-field"
                     style={{ margin: 0 }}
                     placeholder="Ej: Decant Tom Ford 10ml, Limpieza Facial de Cortesía..."
                     value={premioPersonalizadoTexto}
                     onChange={e => setPremioPersonalizadoTexto(e.target.value)}
                   />
                   <span style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px', display: 'block' }}>
                     Quedará registrado permanentemente en el historial VIP del cliente.
                   </span>
                 </div>
               )}

               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button 
                   type="submit" 
                   className="btn-primary" 
                   style={{ flex: 2, padding: '12px', fontWeight: 'bold' }}
                 >
                   🎁 Confirmar y Entregar Regalo
                 </button>
                 <button 
                   type="button" 
                   className="btn-outline-gold" 
                   style={{ flex: 1, padding: '12px' }} 
                   onClick={() => { setShowPremioModal(false); setClientePremio(null); }}
                 >
                   Cancelar
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Modal Detalle de Ticket / Boleta */}
       {ticketDetalleModal && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
           <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <img src="/Logo_romana_dorado.png" alt="La Romana" style={{ height: '36px', objectFit: 'contain' }} />
                 <div>
                   <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.15rem' }}>
                     Comprobante Ticket LR-{String(ticketDetalleModal.id).padStart(4, '0')}
                   </h3>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>La Romana Barber Shop y Accesorios / Perfumería</span>
                 </div>
               </div>
               <button 
                 onClick={() => setTicketDetalleModal(null)} 
                 style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
               >
                 ×
               </button>
             </div>

             {/* Info General */}
             <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '0.85rem', lineHeight: '1.6' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Fecha y Hora:</span>
                 <strong>{new Date(ticketDetalleModal.fecha_creacion).toLocaleString('es-CL')}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Estado:</span>
                 <span style={{
                   padding: '2px 8px',
                   borderRadius: '10px',
                   fontSize: '0.75rem',
                   fontWeight: 'bold',
                   background: ticketDetalleModal.estado === 'Pagado' || ticketDetalleModal.estado === 'Entregado' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                   color: ticketDetalleModal.estado === 'Pagado' || ticketDetalleModal.estado === 'Entregado' ? 'var(--green-emerald-light)' : 'var(--gold-jewel)',
                   border: '1px solid currentColor'
                 }}>
                   {ticketDetalleModal.estado}
                 </span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                 <strong style={{ color: '#fff' }}>{ticketDetalleModal.cliente}</strong>
               </div>
               {ticketDetalleModal.cliente_rut && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>RUT:</span>
                   <strong style={{ color: 'var(--gold-jewel)' }}>{ticketDetalleModal.cliente_rut}</strong>
                 </div>
               )}
               {ticketDetalleModal.cliente_telefono && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Teléfono:</span>
                   <span>{ticketDetalleModal.cliente_telefono}</span>
                 </div>
               )}
               {ticketDetalleModal.cliente_email && (
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                   <span>{ticketDetalleModal.cliente_email}</span>
                 </div>
               )}
             </div>

             {/* Detalle de Productos */}
             <div style={{ marginBottom: '16px' }}>
               <h4 style={{ color: 'var(--gold-jewel)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                 📦 Artículos de la Orden
               </h4>
               <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                 <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                   <thead>
                     <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                       <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Producto</th>
                       <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cant.</th>
                       <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>P. Unit</th>
                       <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Subtotal</th>
                     </tr>
                   </thead>
                   <tbody>
                     {(ticketDetalleModal.detalles || []).map((det, idx) => (
                       <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                         <td style={{ padding: '8px 10px', fontWeight: '500' }}>{det.producto}</td>
                         <td style={{ padding: '8px 10px', textAlign: 'center' }}>{det.cantidad}</td>
                         <td style={{ padding: '8px 10px', textAlign: 'right' }}>${Number(det.precio_unitario).toLocaleString('es-CL')}</td>
                         <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                           ${(Number(det.precio_unitario) * Number(det.cantidad)).toLocaleString('es-CL')}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>

             {/* Total */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid var(--gold-jewel)', borderRadius: '10px', marginBottom: '18px' }}>
               <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>TOTAL A PAGAR:</span>
               <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-jewel)' }}>
                 ${Number(ticketDetalleModal.total).toLocaleString('es-CL')}
               </span>
             </div>

             {/* Acciones */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {ticketDetalleModal.cliente_telefono && (
                 <a 
                   href={`https://wa.me/${ticketDetalleModal.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                     `Hola ${ticketDetalleModal.cliente}! Te contactamos de La Romana Barber Shop por tu ticket LR-${String(ticketDetalleModal.id).padStart(4, '0')} con un total de $${Number(ticketDetalleModal.total).toLocaleString('es-CL')}. Tu pedido se encuentra en estado: ${ticketDetalleModal.estado}.`
                   )}`}
                   target="_blank"
                   rel="noreferrer"
                   className="btn-primary"
                   style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                 >
                   💬 Contactar por WhatsApp
                 </a>
               )}
               
               <button 
                 onClick={() => setTicketDetalleModal(null)} 
                 className="btn-outline-gold" 
                 style={{ width: '100%', padding: '10px' }}
               >
                 Cerrar Comprobante
               </button>
             </div>
           </div>
         </div>
       )}

        {/* Modal Detalle Día a Día de Barbero */}
        {barberoDetalleModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '25px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
              
              {/* Header Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>💈</span>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.25rem' }}>
                      Liquidación Detallada: {barberoDetalleModal.barbero_nombre}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      Período del {liquidacionData?.rango?.inicio} al {liquidacionData?.rango?.fin}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setBarberoDetalleModal(null)} 
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.6rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Resumen KPIs del Barbero */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div className="stat-card-badge">
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Cortes Totales</span>
                  <strong style={{ fontSize: '1.15rem', color: '#fff' }}>{barberoDetalleModal.total_cortes}</strong>
                </div>
                <div className="stat-card-badge">
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Días Trabajados</span>
                  <strong style={{ fontSize: '1.15rem', color: '#fff' }}>{barberoDetalleModal.dias_trabajados}</strong>
                </div>
                <div className="stat-card-badge">
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Total Bruto</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--gold-jewel)' }}>${Number(barberoDetalleModal.total_bruto).toLocaleString('es-CL')}</strong>
                </div>
                <div className="stat-card-badge" style={{ borderLeft: '3px solid #2ecc71' }}>
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Pago Barbero</span>
                  <strong style={{ fontSize: '1.15rem', color: '#2ecc71' }}>${Number(barberoDetalleModal.total_comision_barbero).toLocaleString('es-CL')}</strong>
                </div>
                <div className="stat-card-badge" style={{ borderLeft: '3px solid var(--gold-jewel)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Ganancia Tienda</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--gold-jewel)' }}>${Number(barberoDetalleModal.total_ganancia_tienda).toLocaleString('es-CL')}</strong>
                </div>
                <div className="stat-card-badge">
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Promedio Diario</span>
                  <strong style={{ fontSize: '1.15rem', color: '#3498db' }}>${Number(barberoDetalleModal.promedio_diario_bruto).toLocaleString('es-CL')}</strong>
                </div>
              </div>

              {/* 1. Tabla de Desglose Día por Día */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: 'var(--gold-jewel)', margin: '0 0 10px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📅 1. Desglose Día a Día (con % de Comisión Diario Aplicado)
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Fecha</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Día</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cortes</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Total Bruto ($)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#2ecc71' }}>% Barbero</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#2ecc71' }}>Pago Barbero ($)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--gold-jewel)' }}>% Tienda</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold-jewel)' }}>Ganancia Local ($)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Ajustar %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(barberoDetalleModal.detalle_dias || []).map((d, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{d.fecha}</td>
                          <td style={{ padding: '8px 10px', color: '#ccc' }}>{d.dia_nombre}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold' }}>{d.cortes_dia}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>${Number(d.total_bruto_dia).toLocaleString('es-CL')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                              {d.porcentaje_barbero}%
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#2ecc71', fontWeight: 'bold' }}>
                            ${Number(d.comision_barbero_dia).toLocaleString('es-CL')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-jewel)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                              {d.porcentaje_tienda}%
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold-jewel)', fontWeight: 'bold' }}>
                            ${Number(d.ganancia_tienda_dia).toLocaleString('es-CL')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              onClick={() => modificarComisionDia(d.fecha, d.porcentaje_barbero)}
                              style={{
                                background: 'rgba(212, 175, 55, 0.1)',
                                border: '1px solid var(--gold-jewel)',
                                color: 'var(--gold-jewel)',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                              title="Editar el porcentaje aplicado a este día específico"
                            >
                              ✏️ %
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Tabla de Citas Individuales */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--gold-jewel)', margin: '0 0 10px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✂️ 2. Detalle Individual de Citas Atendidas
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '250px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#222', zIndex: 5 }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Fecha / Hora</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Cliente</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Servicios Realizados</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Método</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Monto Cobrado</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#2ecc71' }}>Comisión ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(barberoDetalleModal.citas || []).map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '7px 10px' }}>{c.fecha} {c.hora.substring(0, 5)}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 'bold' }}>{c.cliente_nombre}</td>
                          <td style={{ padding: '7px 10px', color: '#ccc' }}>{c.servicios_nombres}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'center' }}>{c.metodo_pago || 'Efectivo'}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 'bold' }}>${Number(c.subtotal).toLocaleString('es-CL')}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#2ecc71', fontWeight: 'bold' }}>
                            ${Number(c.comision_barbero).toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botón de Cierre */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button 
                  className="btn-outline-gold" 
                  onClick={() => setBarberoDetalleModal(null)}
                  style={{ padding: '8px 24px', fontWeight: 'bold' }}
                >
                  Cerrar Desglose
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal Registrar / Gestionar Pago de Liquidación */}
        {pagoModalData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '28px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>💰</span>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.2rem' }}>
                      {pagoModalData.es_edicion ? 'Editar Registro de Pago' : 'Registrar Pago a Trabajador'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      Liquidación de comisiones de barbería
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setPagoModalData(null)} 
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Tarjeta Resumen de Liquidación */}
              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Barbero:</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>💈 {pagoModalData.barbero_nombre}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Período que cubre:</span>
                  <span style={{ color: 'var(--gold-jewel)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {pagoModalData.periodo_inicio} al {pagoModalData.periodo_fin}
                  </span>
                </div>
                {pagoModalData.total_cortes !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Cortes Realizados:</span>
                    <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{pagoModalData.total_cortes} citas</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}>
                  <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>Comisión Calculada:</span>
                  <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>
                    ${Number(pagoModalData.comision_calculada || pagoModalData.monto).toLocaleString('es-CL')}
                  </strong>
                </div>
              </div>

              {/* Formulario de Pago */}
              <form onSubmit={handleGuardarPago} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                    💵 Monto a Registrar / Pagado ($) *
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    className="input-field" 
                    style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#2ecc71' }}
                    value={pagoModalData.monto} 
                    onChange={e => setPagoModalData({...pagoModalData, monto: e.target.value})} 
                  />
                  <span style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px', display: 'block' }}>
                    Puedes ajustar el monto final en caso de anticipos, propinas o retenciones.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                      📅 Fecha de Pago *
                    </label>
                    <input 
                      type="date" 
                      required 
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={pagoModalData.fecha_pago} 
                      onChange={e => setPagoModalData({...pagoModalData, fecha_pago: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                      💳 Método de Pago *
                    </label>
                    <select 
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={pagoModalData.metodo_pago} 
                      onChange={e => setPagoModalData({...pagoModalData, metodo_pago: e.target.value})}
                    >
                      <option value="Transferencia">🏦 Transferencia Bancaria</option>
                      <option value="Efectivo">💵 Efectivo</option>
                      <option value="Tarjeta">💳 Tarjeta / Débito</option>
                      <option value="Cheque">📄 Cheque</option>
                      <option value="Otro">🔹 Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                    🔢 N° de Operación / Comprobante de Transferencia (Opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: TRX-98234123, Transf. Banco Estado" 
                    className="input-field" 
                    style={{ margin: 0 }}
                    value={pagoModalData.numero_comprobante} 
                    onChange={e => setPagoModalData({...pagoModalData, numero_comprobante: e.target.value})} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '5px', fontWeight: 'bold' }}>
                    📝 Notas / Observaciones (Opcional)
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="Ej: Pago quincenal completo, incluye bono por puntualidad..."
                    className="input-field" 
                    style={{ margin: 0, resize: 'vertical' }}
                    value={pagoModalData.notas} 
                    onChange={e => setPagoModalData({...pagoModalData, notas: e.target.value})} 
                  />
                </div>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="submit" 
                    disabled={guardandoPago}
                    className="btn-primary" 
                    style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', background: '#27ae60', borderColor: '#27ae60' }}
                  >
                    {guardandoPago ? '💾 Guardando...' : (pagoModalData.es_edicion ? '💾 Actualizar Pago' : '✅ Confirmar y Marcar Pagado')}
                  </button>

                  {pagoModalData.es_edicion && pagoModalData.pago_id && (
                    <button 
                      type="button" 
                      onClick={() => handleEliminarPago(pagoModalData.pago_id)}
                      style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🗑️ Anular Pago
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="btn-outline-gold" 
                    onClick={() => setPagoModalData(null)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Modal Historial Completo de Pagos a Trabajadores */}
        {historialPagosModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1250, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '26px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>📜</span>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.25rem' }}>
                      Historial de Pagos y Liquidaciones a Trabajadores
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      Registro histórico de todas las comisiones liquidadas y transferidas
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setHistorialPagosModal(false)} 
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.6rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Filtro por Barbero */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 'bold' }}>Filtrar Barbero:</label>
                  <select 
                    className="input-field" 
                    style={{ margin: 0, minWidth: '180px' }}
                    value={filtroHistorialBarbero}
                    onChange={e => {
                      setFiltroHistorialBarbero(e.target.value);
                      cargarHistorialPagos(e.target.value);
                    }}
                  >
                    <option value="todos">👥 Todos los Trabajadores</option>
                    {(trabajadores || []).map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                  Total Pagado Histórico: <strong style={{ color: 'var(--gold-jewel)', fontSize: '1.1rem' }}>
                    ${historialPagosData.reduce((sum, p) => sum + Number(p.monto || 0), 0).toLocaleString('es-CL')}
                  </strong> ({historialPagosData.length} pagos)
                </div>
              </div>

              {/* Tabla de Pagos */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={tableHeaderStyle}>Fecha Pago</th>
                      <th style={tableHeaderStyle}>Barbero</th>
                      <th style={tableHeaderStyle}>Período Cubierto</th>
                      <th style={{ ...tableHeaderStyle, textAlign: 'right', color: '#2ecc71' }}>Monto Pagado ($)</th>
                      <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Método</th>
                      <th style={tableHeaderStyle}>N° Comprobante</th>
                      <th style={tableHeaderStyle}>Notas</th>
                      <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagosData.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>
                          📅 {p.fecha_pago}
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#fff' }}>
                          💈 {p.barbero_nombre}
                        </td>
                        <td style={{ ...tableCellStyle, color: 'var(--gold-jewel)', fontSize: '0.78rem' }}>
                          {p.periodo_inicio} al {p.periodo_fin}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right', color: '#2ecc71', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          ${Number(p.monto).toLocaleString('es-CL')}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                            {p.metodo_pago}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, color: '#ccc', fontStyle: p.numero_comprobante ? 'normal' : 'italic' }}>
                          {p.numero_comprobante || '-'}
                        </td>
                        <td style={{ ...tableCellStyle, color: '#aaa', fontSize: '0.75rem', maxWidth: '180px' }}>
                          {p.notas || '-'}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          <button 
                            onClick={() => handleEliminarPago(p.id)}
                            style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                            title="Eliminar este registro de pago"
                          >
                            🗑️ Anular
                          </button>
                        </td>
                      </tr>
                    ))}

                    {historialPagosData.length === 0 && !loadingHistorialPagos && (
                      <tr>
                        <td colSpan="8" style={{ ...tableCellStyle, textAlign: 'center', padding: '30px', color: '#888' }}>
                          No hay registros de pagos para el filtro seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botón de Cierre */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  className="btn-outline-gold" 
                  onClick={() => setHistorialPagosModal(false)}
                  style={{ padding: '8px 24px', fontWeight: 'bold' }}
                >
                  Cerrar Historial
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal Crear Nuevo Cliente en CRM */}
        {showNuevoClienteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1350, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div style={{ background: '#181818', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--gold-jewel)', padding: '28px', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>👤</span>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--gold-jewel)', fontSize: '1.2rem' }}>Registrar Nuevo Cliente</h3>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Ficha de cliente para CRM y Fidelización</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNuevoClienteModal(false)} 
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCrearCliente} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                      RUT (Sin puntos ni guión) *
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="12345678-9" 
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={nuevoClienteForm.rut} 
                      onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, rut: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                      Teléfono / WhatsApp
                    </label>
                    <input 
                      type="text" 
                      placeholder="+56912345678" 
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={nuevoClienteForm.telefono} 
                      onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, telefono: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                    Nombre Completo *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: Juan Pérez" 
                    className="input-field" 
                    style={{ margin: 0 }}
                    value={nuevoClienteForm.nombre} 
                    onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input 
                    type="email" 
                    placeholder="cliente@email.com" 
                    className="input-field" 
                    style={{ margin: 0 }}
                    value={nuevoClienteForm.email} 
                    onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, email: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                      Cortes Acumulados
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={nuevoClienteForm.cortes_acumulados} 
                      onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, cortes_acumulados: parseInt(e.target.value) || 0 })} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                      Clave de Acceso Portal
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ margin: 0 }}
                      value={nuevoClienteForm.password} 
                      onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, password: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-jewel)', marginBottom: '4px', fontWeight: 'bold' }}>
                    Notas Iniciales CRM (Preferencias, estilo de corte...)
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="Ej: Prefiere corte degradado bajo a navaja, toma café..."
                    className="input-field" 
                    style={{ margin: 0, resize: 'vertical' }}
                    value={nuevoClienteForm.notas_crm} 
                    onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, notas_crm: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="submit" 
                    disabled={guardandoCliente}
                    className="btn-primary" 
                    style={{ flex: 2, padding: '12px', fontWeight: 'bold' }}
                  >
                    {guardandoCliente ? '💾 Guardando...' : '💾 Crear Cliente'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-outline-gold" 
                    onClick={() => setShowNuevoClienteModal(false)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

    </div>
  );
}
