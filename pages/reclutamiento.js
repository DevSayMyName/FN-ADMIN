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

// Obtener el usuario actual con sesión activa (CEO, Analista, Coach)
function getCurrentUser() {
  try {
    const sessionData = JSON.parse(localStorage.getItem('fn_admin_session'));
    if (sessionData && sessionData.user) {
      const roleNames = { "ceo": "CEO", "analista": "Analista", "coach": "Coach" };
      return roleNames[sessionData.user] || sessionData.user.toUpperCase();
    }
  } catch(e) {
    console.error("Error al obtener la sesión activa:", e);
  }
  return "ADMIN";
}

// Inicializar Firebase Compat
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database().ref('reclutamiento_fn');
}

// Sincronización en Tiempo Real con Firebase
function initRealtimeSync() {
  if (db) {
    db.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        allCandidates = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      } else {
        allCandidates = [];
      }
      filterCandidates();
    });
  } else {
    // Respaldo local si no hay conexión
    const saved = localStorage.getItem('fn_sport_candidates');
    allCandidates = saved ? JSON.parse(saved) : [];
    filterCandidates();
  }
}

// Alternar entre Vistas (Ver Formulario / Lista de Aspirantes)
function switchView(viewId) {
  const formView = document.getElementById('formView');
  const candidatesView = document.getElementById('candidatesView');
  const btnForm = document.getElementById('btnViewForm');
  const btnCandidates = document.getElementById('btnViewCandidates');

  if (formView) formView.style.display = viewId === 'formView' ? 'block' : 'none';
  if (candidatesView) candidatesView.style.display = viewId === 'candidatesView' ? 'block' : 'none';

  if (btnForm) btnForm.classList.toggle('active', viewId === 'formView');
  if (btnCandidates) btnCandidates.classList.toggle('active', viewId === 'candidatesView');
}

// Filtrar Candidatos por Búsqueda y Estado
function filterCandidates() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const status = statusFilter ? statusFilter.value : 'TODOS';

  const filtered = allCandidates.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search) ||
                        (c.email || '').toLowerCase().includes(search) ||
                        (c.phone || '').toLowerCase().includes(search) ||
                        (c.nick || '').toLowerCase().includes(search) ||
                        (c.discord || '').toLowerCase().includes(search);
    
    const matchStatus = status === 'TODOS' || c.status === status;
    return matchSearch && matchStatus;
  });

  const countEl = document.getElementById('totalCount');
  if (countEl) countEl.textContent = filtered.length;

  renderCandidates(filtered);
}

// Renderizar Tarjetas de Candidatos
function renderCandidates(candidates) {
  const grid = document.getElementById('candidatesGrid');
  if (!grid) return;

  if (!candidates || candidates.length === 0) {
    grid.innerHTML = `
      <div class="cal-empty">
        <p>No hay respuestas o aspirantes registrados.</p>
        <span>Las respuestas enviadas desde el Google Form aparecerán aquí automáticamente.</span>
      </div>
    `;
    return;
  }

  const sorted = [...candidates].reverse();

  grid.innerHTML = sorted.map(c => {
    const statusClass = (c.status || 'PENDIENTE').toLowerCase().replace(/\s+/g, '-');
    const contacto = (c.phone && c.phone !== 'Sin teléfono') ? `📞 ${c.phone}` : (c.email || c.discord || 'Sin contacto');

    return `
      <div class="rec-card border-${statusClass}">
        <div class="rec-card-header">
          <span class="rec-role-badge">${escapeHtml(c.role || 'Postulante')}</span>
          <span class="rec-status-badge status-${statusClass}">${escapeHtml(c.status || 'PENDIENTE')}</span>
        </div>

        <h3 class="rec-card-title">${escapeHtml(c.name || 'Aspirante')}</h3>
        <p class="rec-card-fullname">✉️ ${escapeHtml(c.email || 'Sin correo')}</p>

        <div class="rec-card-info">
          <div class="cal-info-item">
            <strong>CONTACTO / TELÉFONO:</strong>
            <span class="rec-discord-text">${escapeHtml(contacto)}</span>
          </div>

          <div class="cal-info-item">
            <strong>FECHA DE REGISTRO:</strong>
            <span>${escapeHtml(c.fechaEnvio || 'Reciente')}</span>
          </div>

          <div class="cal-info-item">
            <strong>ORIGEN / EVALUADO POR:</strong>
            <span class="cal-author">👤 ${escapeHtml(c.createdBy || 'GOOGLE FORM')}</span>
          </div>
        </div>

        <div class="rec-card-actions-custom">
          <button class="rec-btn-view-resp" onclick="openDetailsModal('${c.id}')">
            📋 VER RESPUESTAS COMPLETAS
          </button>
          
          <div class="cal-crud-buttons">
            <button class="cal-btn-icon" onclick="updateStatus('${c.id}', 'ACEPTADO')" title="Aceptar">ACEPTAR</button>
            <button class="cal-btn-icon danger" onclick="updateStatus('${c.id}', 'DESCARTADO')" title="Descartar">DESCARTAR</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal: Ver Respuestas Detalladas del Google Form
function openDetailsModal(candidateId) {
  const c = allCandidates.find(item => item.id === candidateId);
  if (!c) return;

  const content = document.getElementById('detailsContent');
  const actions = document.getElementById('detailsActions');

  let htmlResp = `
    <div class="rec-detail-header-info">
      <h3>${escapeHtml(c.name)}</h3>
      <p>Estado actual: <strong>${escapeHtml(c.status || 'PENDIENTE')}</strong></p>
    </div>
    <div class="rec-detail-qa-list">
  `;

  if (c.respuestasCompletas && Object.keys(c.respuestasCompletas).length > 0) {
    for (let pregunta in c.respuestasCompletas) {
      htmlResp += `
        <div class="rec-qa-item">
          <strong>${escapeHtml(pregunta)}</strong>
          <p>${escapeHtml(c.respuestasCompletas[pregunta] || 'Sin respuesta')}</p>
        </div>
      `;
    }
  } else {
    // Si es un registro manual sin objeto de formulario extenso
    htmlResp += `
      <div class="rec-qa-item">
        <strong>Nombre:</strong> <p>${escapeHtml(c.name)}</p>
      </div>
      <div class="rec-qa-item">
        <strong>Correo:</strong> <p>${escapeHtml(c.email || 'Sin correo')}</p>
      </div>
      <div class="rec-qa-item">
        <strong>Teléfono:</strong> <p>${escapeHtml(c.phone || 'Sin teléfono')}</p>
      </div>
      <div class="rec-qa-item">
        <strong>Dirección:</strong> <p>${escapeHtml(c.address || 'Sin dirección')}</p>
      </div>
      <div class="rec-qa-item">
        <strong>Comentarios / Observaciones:</strong> <p>${escapeHtml(c.notes || 'Ninguno')}</p>
      </div>
    `;
  }

  htmlResp += `</div>`;
  if (content) content.innerHTML = htmlResp;

  if (actions) {
    actions.innerHTML = `
      <button class="rec-btn-action accept" onclick="updateStatus('${c.id}', 'ACEPTADO'); closeDetailsModal();">
        ✓ MARCAR ACEPTADO
      </button>
      <button class="rec-btn-action discard" onclick="updateStatus('${c.id}', 'DESCARTADO'); closeDetailsModal();">
        ✕ DESCARTAR CANDIDATO
      </button>
      <button class="rec-btn-action delete" onclick="deleteCandidate('${c.id}'); closeDetailsModal();">
        🗑 ELIMINAR REGISTRO
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

// Actualizar Estado (Aceptar / Descartar / En Revisión)
function updateStatus(candidateId, newStatus) {
  if (db) {
    db.child(candidateId).update({ status: newStatus });
  } else {
    allCandidates = allCandidates.map(c => c.id === candidateId ? { ...c, status: newStatus } : c);
    localStorage.setItem('fn_sport_candidates', JSON.stringify(allCandidates));
    filterCandidates();
  }
}

// Eliminar Registro
function deleteCandidate(candidateId) {
  if (confirm('¿Estás seguro de que deseas eliminar permanentemente a este candidato?')) {
    if (db) {
      db.child(candidateId).remove();
    } else {
      allCandidates = allCandidates.filter(c => c.id !== candidateId);
      localStorage.setItem('fn_sport_candidates', JSON.stringify(allCandidates));
      filterCandidates();
    }
  }
}

// Modal: Crear / Editar Registro Manual
function openCandidateModal(candidateId = null) {
  const modal = document.getElementById('candidateModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('candidateForm');

  if (form) form.reset();
  const idInput = document.getElementById('candidateId');
  if (idInput) idInput.value = '';

  if (candidateId) {
    const c = allCandidates.find(item => item.id === candidateId);
    if (c) {
      if (title) title.innerHTML = 'EDITAR <span>ASPIRANTE</span>';
      if (idInput) idInput.value = c.id;
      document.getElementById('candidateName').value = c.name || '';
      document.getElementById('candidateNick').value = c.nick || '';
      document.getElementById('candidateRole').value = c.role || 'Postulante';
      document.getElementById('candidateDiscord').value = c.discord || c.email || '';
      document.getElementById('candidateStatus').value = c.status || 'PENDIENTE';
      document.getElementById('candidateNotes').value = c.notes || '';
    }
  } else {
    if (title) title.innerHTML = 'REGISTRAR <span>ASPIRANTE</span>';
  }

  if (modal) modal.classList.add('active');
}

function closeCandidateModal() {
  const modal = document.getElementById('candidateModal');
  if (modal) modal.classList.remove('active');
}

// Guardar Registro Manual
function handleSaveCandidate(e) {
  e.preventDefault();

  const id = document.getElementById('candidateId').value;
  const name = document.getElementById('candidateName').value.trim();
  const nick = document.getElementById('candidateNick').value.trim();
  const role = document.getElementById('candidateRole').value.trim();
  const discord = document.getElementById('candidateDiscord').value.trim();
  const status = document.getElementById('candidateStatus').value;
  const notes = document.getElementById('candidateNotes').value.trim();

  const activeUser = getCurrentUser();
  const existingCandidate = allCandidates.find(c => c.id === id);

  const payload = {
    name,
    nick,
    role,
    discord,
    email: discord.includes('@') ? discord : 'Manual',
    phone: 'Manual',
    status,
    notes,
    createdBy: existingCandidate ? (existingCandidate.createdBy || activeUser) : activeUser,
    fechaEnvio: new Date().toLocaleString("es-ES")
  };

  if (db) {
    if (id) {
      db.child(id).update(payload);
    } else {
      db.push(payload);
    }
  } else {
    if (id) {
      allCandidates = allCandidates.map(c => c.id === id ? { id, ...payload } : c);
    } else {
      const newCandidate = { id: 'cand-' + Date.now(), ...payload };
      allCandidates.push(newCandidate);
    }
    localStorage.setItem('fn_sport_candidates', JSON.stringify(allCandidates));
    filterCandidates();
  }

  closeCandidateModal();
}

// Escapar caracteres para prevenir ataques XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Inicializar al cargar el documento
document.addEventListener('DOMContentLoaded', initRealtimeSync);