// Utilidades para formateo y validación de RUT chileno

export function formatRut(rutRaw) {
  if (!rutRaw) return '';
  // Limpiar caracteres inválidos
  let clean = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;
  
  let cuerpo = clean.slice(0, -1);
  let dv = clean.slice(-1);
  
  // Retornar en formato estandar: 12345678-9
  return `${cuerpo}-${dv}`;
}

export function formatRutWithDots(rutRaw) {
  if (!rutRaw) return '';
  let clean = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  
  let cuerpo = clean.slice(0, -1);
  let dv = clean.slice(-1);
  
  // Agregar puntos cada 3 dígitos
  let formattedCuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedCuerpo}-${dv}`;
}

export function validateRut(rut) {
  if (!rut) return false;
  let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;
  
  let cuerpo = clean.slice(0, -1);
  let dv = clean.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  let expectedDv = 11 - (suma % 11);
  let expectedDvStr = expectedDv === 11 ? '0' : (expectedDv === 10 ? 'K' : expectedDv.toString());
  
  return dv === expectedDvStr;
}
