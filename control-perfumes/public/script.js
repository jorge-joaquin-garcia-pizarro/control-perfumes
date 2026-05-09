const API_URL = '/api/perfumes';

async function cargarPerfumes() {
  try {
    const res = await fetch(API_URL);
    const perfumes = await res.json();
    const tbody = document.getElementById('tbodyPerfumes');
    tbody.innerHTML = '';
    perfumes.forEach(p => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.nombre)}</td>
        <td>${escapeHtml(p.marca)}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio_venta.toFixed(2)}</td>
        <td>
          <button class="vender" data-id="${p.id}" data-stock="${p.cantidad}">Vender</button>
          <button class="eliminar" data-id="${p.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    document.querySelectorAll('.vender').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const stockActual = parseInt(btn.dataset.stock);
        let cantidadVender = prompt(`Stock actual: ${stockActual}\n¿Cuántas unidades vender?`);
        if (cantidadVender && !isNaN(cantidadVender) && cantidadVender > 0) {
          cantidadVender = parseInt(cantidadVender);
          if (cantidadVender > stockActual) {
            alert('Stock insuficiente');
            return;
          }
          const res = await fetch(`${API_URL}/vender/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantidadVender })
          });
          if (res.ok) cargarPerfumes();
          else alert('Error al vender');
        }
      });
    });

    document.querySelectorAll('.eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar este perfume?')) {
          const id = btn.dataset.id;
          await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
          cargarPerfumes();
        }
      });
    });
  } catch (error) {
    console.error('Error cargando perfumes:', error);
    alert('Error al conectar con el servidor');
  }
}

document.getElementById('btnAgregar').addEventListener('click', async () => {
  const nombre = document.getElementById('nombre').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value);
  const precio_venta = parseFloat(document.getElementById('precio').value);

  if (!nombre || !marca || isNaN(cantidad) || isNaN(precio_venta)) {
    alert('Completá todos los campos correctamente');
    return;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, marca, cantidad, precio_venta })
  });
  if (res.ok) {
    document.getElementById('nombre').value = '';
    document.getElementById('marca').value = '';
    document.getElementById('cantidad').value = '';
    document.getElementById('precio').value = '';
    cargarPerfumes();
  } else {
    alert('Error al agregar');
  }
});

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

cargarPerfumes();