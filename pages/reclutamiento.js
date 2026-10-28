// Configuración Realtime Database de FN Admin
const firebaseConfig = {
  apiKey: "AIzaSyD7ARVXUxeB5CGdkDgrPHKJVBNRY25KNak",
  authDomain: "fnadmin-62b1b.firebaseapp.com",
  databaseURL: "https://fnadmin-62b1b-default-rtdb.firebaseio.com",
  projectId: "fnadmin-62b1b",
  storageBucket: "fnadmin-62b1b.firebasestorage.app",
  messagingSenderId: "890386673581",
  appId: "1:890386673581:web:5201d812e685974a8efb24",
  measurementId: "G-9PS1NTD99K"
};

let db = null;
let allCandidates = [];
let currentActiveTab = 'PENDIENTE'; // PENDIENTE | ACEPTADO | DESCARTADO | formView

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database().ref('reclutamiento_fn');
}

// Escuchar base de datos en tiempo real
function initRealtimeSync() {
  if (db) {
    db.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        allCandidates = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      } else {
        allCandidates = [];
      }
      updateCounters();
      filterCandidates();
    });
  }
}

// Actualizar contadores de las pestañas
function updateCounters() {
  const pending = allCandidates.filter(c => (c.status || 'PENDIENTE') === 'PENDIENTE').length;
  const accepted = allCandidates.filter(c => c.status === 'ACEPTADO').length;
  const discarded = allCandidates.filter(c => c.status === 'DESCARTADO').length;

  if (document.getElementById('pendingCount')) document.getElementById('pendingCount').textContent = pending;
  if (document.getElementById('acceptedCount')) document.getElementById('acceptedCount').textContent = accepted;
  if (document.getElementById('discardedCount')) document.getElementById('discardedCount').textContent = discarded;
}

// Cambiar de Pestaña (Formulario / Pendientes / Aceptados / Descartados)
function switchTab(tabName) {
  currentActiveTab = tabName;

  const formView = document.getElementById('formView');
  const candidatesView = document.getElementById('candidatesView');

  // Activar estilo visual en botones
  document.querySelectorAll('.rec-tab-btn').forEach(btn => btn.classList.remove('active'));

  if (tabName === 'formView') {
    if (formView) formView.style.display = 'block';
    if (candidatesView) candidatesView.style.display = 'none';
    if (document.getElementById('btnViewForm')) document.getElementById('btnViewForm').classList.add('active');
  } else {
    if (formView) formView.style.display = 'none';
    if (candidatesView) candidatesView.style.display = 'block';

    if (tabName === 'PENDIENTE' && document.getElementById('btnViewPending')) document.getElementById('btnViewPending').classList.add('active');
    if (tabName === 'ACEPTADO' && document.getElementById('btnViewAccepted')) document.getElementById('btnViewAccepted').classList.add('active');
    if (tabName === 'DESCARTADO' && document.getElementById('btnViewDiscarded')) document.getElementById('btnViewDiscarded').classList.add('active');

    filterCandidates();
  }
}

// Filtrar candidatos según la pestaña y el buscador
function filterCandidates() {
  if (currentActiveTab === 'formView') return;

  const searchInput = document.getElementById('searchInput');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = allCandidates.filter(c => {
    const cStatus = c.status || 'PENDIENTE';
    const matchStatus = cStatus === currentActiveTab;
    const matchSearch = (c.name || '').toLowerCase().includes(search) ||
                        (c.phone || '').toLowerCase().includes(search) ||
                        (c.role || '').toLowerCase().includes(search) ||
                        (c.nationality || '').toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  renderCandidates(filtered);
}

// Renderizar Tarjetas
function renderCandidates(candidates) {
  const grid = document.getElementById('candidatesGrid');
  if (!grid) return;

  if (!candidates || candidates.length === 0) {
    grid.innerHTML = `
      <div class="cal-empty" style="grid-column: 1/-1; text-align:center; padding: 40px; color: #888;">
        <p>No hay aspirantes en el apartado de <strong>${currentActiveTab}</strong>.</p>
      </div>
    `;
    return;
  }

  const sorted = [...candidates].reverse();

  grid.innerHTML = sorted.map(c => {
    const statusClass = (c.status || 'PENDIENTE').toLowerCase();
    const whatsappClean = (c.phone || '').replace(/[^0-9+]/g, '');

    return `
      <div class="rec-card border-${statusClass}">
        <div class="rec-card-header">
          <span class="rec-role-badge">🎮 ${escapeHtml(c.role || 'Aspirante')}</span>
          <span class="rec-status-badge status-${statusClass}">${escapeHtml(c.status || 'PENDIENTE')}</span>
        </div>

        <h3 class="rec-card-title">${escapeHtml(c.name || 'Aspirante')}</h3>
        <p class="rec-card-fullname">📍 ${escapeHtml(c.nationality || 'N/A')} • ${escapeHtml(c.age || 'N/A')} años</p>

        <div class="rec-card-info">
          <div class="cal-info-item">
            <strong>WHATSAPP:</strong>
            <span class="rec-discord-text">
              📱 ${escapeHtml(c.phone || 'Sin número')} 
              ${whatsappClean ? `<a href="https://wa.me/${whatsappClean}" target="_blank" style="color:var(--accent-neon); margin-left: 6px; text-decoration:none;">[CONTACTAR ↗]</a>` : ''}
            </span>
          </div>

          <div class="cal-info-item">
            <strong>REGISTRADO:</strong>
            <span>${escapeHtml(c.fechaEnvio || 'Reciente')}</span>
          </div>
        </div>

        <div class="rec-card-actions-custom">
          <button class="rec-btn-view-resp" onclick="openDetailsModal('${c.id}')">
            📋 VER RESPUESTAS COMPLETAS
          </button>
          
          <div class="cal-crud-buttons" style="margin-top:8px;">
            ${c.status !== 'ACEPTADO' ? `<button class="cal-btn-icon" onclick="updateStatus('${c.id}', 'ACEPTADO')">ACEPTAR</button>` : ''}
            ${c.status !== 'DESCARTADO' ? `<button class="cal-btn-icon danger" onclick="updateStatus('${c.id}', 'DESCARTADO')">DESCARTAR</button>` : ''}
            <button class="cal-btn-icon danger" onclick="deleteCandidate('${c.id}')" title="Borrar de la base de datos">🗑 BORRAR</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal para ver respuestas detalladas
function openDetailsModal(candidateId) {
  const c = allCandidates.find(item => item.id === candidateId);
  if (!c) return;

  const content = document.getElementById('detailsContent');
  const actions = document.getElementById('detailsActions');

  let htmlResp = `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h3 style="color:var(--accent-neon); margin:0;">${escapeHtml(c.name)}</h3>
      <p style="margin:5px 0 0 0; color:#aaa;">Estado: <strong>${escapeHtml(c.status || 'PENDIENTE')}</strong></p>
    </div>
    <div class="rec-detail-qa-list">
  `;

  if (c.respuestasCompletas && Object.keys(c.respuestasCompletas).length > 0) {
    for (let pregunta in c.respuestasCompletas) {
      htmlResp += `
        <div class="rec-qa-item" style="margin-bottom: 12px;">
          <strong style="color:#fff; display:block;">${escapeHtml(pregunta)}:</strong>
          <span style="color:#ccc;">${escapeHtml(c.respuestasCompletas[pregunta] || 'Sin respuesta')}</span>
        </div>
      `;
    }
  } else {
    htmlResp += `
      <p><strong>Nombre:</strong> ${escapeHtml(c.name)}</p>
      <p><strong>Edad:</strong> ${escapeHtml(c.age)}</p>
      <p><strong>Nacionalidad:</strong> ${escapeHtml(c.nationality)}</p>
      <p><strong>Rol:</strong> ${escapeHtml(c.role)}</p>
      <p><strong>Disponibilidad:</strong> ${escapeHtml(c.availability)}</p>
      <p><strong>Motivación:</strong> ${escapeHtml(c.motivation)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(c.phone)}</p>
    `;
  }

  htmlResp += `</div>`;
  if (content) content.innerHTML = htmlResp;

  if (actions) {
    actions.innerHTML = `
      <button class="rec-btn-action accept" onclick="updateStatus('${c.id}', 'ACEPTADO'); closeDetailsModal();">
        ✓ MOVER A ACEPTADOS
      </button>
      <button class="rec-btn-action discard" onclick="updateStatus('${c.id}', 'DESCARTADO'); closeDetailsModal();">
        ✕ DESCARTAR
      </button>
      <button class="rec-btn-action delete" style="background:#dc3545;" onclick="deleteCandidate('${c.id}'); closeDetailsModal();">
        🗑 ELIMINAR DE LA BASE DE DATOS
      </button>
    `;
  }

  const modal = document.getElementById('detailsModal');
  if (modal) modal.classList.add('active');
}

function closeDetailsModal() {
  const modal = document.getElementById('detailsModal');
  if (modal) modal.classList.remove('active');
}

// Cambiar estado (ACEPTADO / DESCARTADO)
function updateStatus(candidateId, newStatus) {
  if (db) {
    db.child(candidateId).update({ status: newStatus });
  }
}

// Eliminar candidato completamente
function deleteCandidate(candidateId) {
  if (confirm('¿Deseas eliminar permanentemente este registro del panel?')) {
    if (db) {
      db.child(candidateId).remove();
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  initRealtimeSync();
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterCandidates);
  }
});