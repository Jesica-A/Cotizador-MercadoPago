// Factores exactos de recargo (Córdoba, acreditación inmediata)
const FACTORES = {
  1: 1.082368,   
  3: 1.254750,   
  6: 1.433176,   
  9: 1.657355,   
  12: 1.875500   
};

// Tasas base (sin IVA)
const TASAS_BASE = {
  cobro: 0.0629,
  cuotas: { 3: 0.1049, 6: 0.1869, 9: 0.2649, 12: 0.3229 }
};
const IVA = 1.21;

const fmt = (n) =>
  n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtLimpio = (n) =>
  n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const redondearParaPosnet = (monto) => {
  return Math.ceil(monto / 500) * 500;
};

function calcular(efectivo) {
  const cuotasArray = [1, 3, 6, 9, 12];
  
  return cuotasArray.map(n => {
    const totalExacto = efectivo * FACTORES[n];
    const totalRedondeado = redondearParaPosnet(totalExacto); 
    const cuotaRedondeada = totalRedondeado / n; 
    
    return { n, total: totalRedondeado, cuota: cuotaRedondeada, totalExacto: totalExacto };
  });
}

const input = document.getElementById('efectivo');
const resultado = document.getElementById('resultado');
const feedback = document.getElementById('feedback');
const contenidoCostos = document.getElementById('contenido-costos');
let ultimoCalculo = null;

input.addEventListener('input', () => {
  const efectivo = parseFloat(input.value);

  if (!efectivo || efectivo <= 0) {
    resultado.classList.add('hidden');
    ultimoCalculo = null;
    return;
  }

  resultado.classList.remove('hidden');
  feedback.classList.add('hidden');

  const filas = calcular(efectivo);
  ultimoCalculo = { efectivo, filas };

  document.getElementById('r-efectivo').textContent = fmt(efectivo);
  document.getElementById('r-precio-lista').textContent = fmtLimpio(filas[0].total);

  const ul = document.getElementById('lista-cuotas');
  ul.innerHTML = '';

  // 1. AGREGAMOS LA OPCIÓN DE DÉBITO PRIMERO
  const liDebito = document.createElement('li');
  liDebito.innerHTML = `
    <span class="cuota-detalle">Débito</span>
    <div class="fila-posnet">
      <span class="etiqueta-posnet">INGRESAR EN POSNET:</span>
      <span class="monto-posnet">${fmtLimpio(filas[0].total)}</span>
    </div>
  `;
  ul.appendChild(liDebito);

  // 2. AGREGAMOS LAS CUOTAS DE CRÉDITO
  filas.forEach(({ n, total, cuota }) => {
    const li = document.createElement('li');
    const textoCuota = `<span class="cuota-detalle">${n} cuota${n > 1 ? 's' : ''} de ${fmtLimpio(cuota)}</span>`;
    const divPosnet = `
      <div class="fila-posnet">
        <span class="etiqueta-posnet">INGRESAR EN POSNET:</span>
        <span class="monto-posnet">${fmtLimpio(total)}</span>
      </div>
    `;
    li.innerHTML = textoCuota + divPosnet;
    ul.appendChild(li);
  });

  // Armar el desplegable de costos
  let costosHTML = '';
  
  filas.forEach(({ n, totalExacto }) => {
    if (n === 1) return;
    
    const costoPorCobro = totalExacto * (TASAS_BASE.cobro * IVA);
    const costoPorCuotas = totalExacto * (TASAS_BASE.cuotas[n] * IVA);

    costosHTML += `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 700; margin-bottom: 6px; color: #2D3277;">Si ofreces ${n} cuotas:</div>
        <div class="costo-fila">
          <span>Costo por cobro (6,29%)</span>
          <span>${fmt(costoPorCobro)}</span>
        </div>
        <div class="costo-fila">
          <span>Costo por ofrecer cuotas (${(n === 3 ? '10,49' : n === 6 ? '18,69' : n === 9 ? '26,49' : '32,29')}%)</span>
          <span>${fmt(costoPorCuotas)}</span>
        </div>
      </div>
    `;
  });

  contenidoCostos.innerHTML = costosHTML + `<p class="nota">Los valores incluyen IVA.</p>`;
});

// Botón WhatsApp
document.getElementById('btn-whatsapp').addEventListener('click', async () => {
  if (!ultimoCalculo) return;

  const { efectivo, filas } = ultimoCalculo;

  let mensaje = `*FORMA DE PAGO*\n\n`;
  mensaje += `💵 *EFECTIVO / TRANSF:* ${fmtLimpio(efectivo)}\n`;
  mensaje += `💳 *PRECIO LISTA:* ${fmtLimpio(filas[0].total)}\n`;
  mensaje += `━━━━━━━━━━━━━━━\n\n`;
  mensaje += `*PLANES CON TARJETA*\n\n`;
  
  // Agregamos débito al mensaje de WhatsApp
  mensaje += `• *Débito* *(TOTAL ${fmtLimpio(filas[0].total)})*\n`;

  filas.forEach(({ n, total, cuota }) => {
    const cuotaEntera = Math.round(cuota);
    mensaje += `• *${n} cuota${n > 1 ? 's' : ''}* de ${fmtLimpio(cuotaEntera)} *(TOTAL ${fmtLimpio(total)})*\n`;
  });

  try {
    await navigator.clipboard.writeText(mensaje);
    feedback.textContent = '¡Mensaje copiado!';
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 2000);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = mensaje;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    feedback.textContent = '¡Mensaje copiado!';
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 2000);
  }
});