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
let localEvents = [];

// Obtener el usuario actual con sesión iniciada
function getCurrentUser() {
  try {
    const sessionData = JSON.parse(localStorage.getItem('fn_admin_session'));
    if (sessionData && sessionData.user) {
      // Claves en minúsculas para coincidir con la sesión activa
      const roleNames = {
        "ceo": "CEO",
        "analista": "Analista",
        "coach": "Coach",
        "decanofn1": "Decano FN1",
        "decanofn2": "Decano FN2",
        "manager": "Manager"
      };
      return roleNames[sessionData.user] || sessionData.user.toUpperCase();
    }
  } catch(e) {
    console.error("Error al obtener la sesión:", e);
  }
  return "ADMIN";
}

// Inicializar Firebase Compat
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database().ref('eventos_fn');
}

// Escuchar cambios en tiempo real entre todos los dispositivos
function initRealtimeSync() {
  if (db) {
    db.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        localEvents = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      } else {
        localEvents = [];
      }
      renderEvents(localEvents);
    });
  } else {
    const saved = localStorage.getItem('fn_sport_events');
    localEvents = saved ? JSON.parse(saved) : [];
    renderEvents(localEvents);
  }
}

// Formatear Fecha y Hora
function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return isoString;
  
  const options = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleDateString('es-ES', options).toUpperCase();
}

// Renderizar Tarjetas
function renderEvents(events) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  if (!events || events.length === 0) {
    grid.innerHTML = `
      <div class="cal-empty">
        <p>No hay eventos registrados.</p>
        <span>Haz clic en "+ CREAR EVENTO" para agregar uno nuevo.</span>
      </div>
    `;
    return;
  }

  const sorted = [...events].reverse();

  grid.innerHTML = sorted.map(evt => `
    <div class="cal-card">
      <div class="cal-card-badge">PROGRAMADO</div>
      <h3 class="cal-card-title">${escapeHtml(evt.name)}</h3>
      
      <div class="cal-card-info">
        <div class="cal-info-item">
          <strong>FECHA / HORA:</strong>
          <span>${formatDateTime(evt.datetime)}</span>
        </div>

        <div class="cal-info-item">
          <strong>REGISTRADO POR:</strong>
          <span class="cal-author">👤 ${escapeHtml(evt.createdBy || 'ADMIN')}</span>
        </div>
        
        <div class="cal-info-item">
          <strong>DESCRIPCIÓN:</strong>
          <p>${escapeHtml(evt.description)}</p>
        </div>
      </div>

      <div class="cal-card-links">
        <a href="${escapeHtml(evt.discord)}" target="_blank" class="cal-btn-discord">
          UNIRSE A DISCORD
        </a>
      </div>

      <div class="cal-card-actions">
        <div class="cal-crud-buttons">
          <button class="cal-btn-icon" onclick="openEventModal('${evt.id}')" title="Editar">EDITAR</button>
          <button class="cal-btn-icon danger" onclick="deleteEvent('${evt.id}')" title="Eliminar">ELIMINAR</button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/* Modal y Operaciones CRUD */
function openEventModal(eventId = null) {
  const modal = document.getElementById('eventModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('eventForm');

  form.reset();
  document.getElementById('eventId').value = '';

  if (eventId) {
    const evt = localEvents.find(e => e.id === eventId);
    if (evt) {
      title.innerHTML = 'EDITAR <span>EVENTO</span>';
      document.getElementById('eventId').value = evt.id;
      document.getElementById('eventName').value = evt.name;
      document.getElementById('eventDateTime').value = evt.datetime;
      document.getElementById('eventDiscord').value = evt.discord;
      document.getElementById('eventDescription').value = evt.description;
    }
  } else {
    title.innerHTML = 'NUEVO <span>EVENTO</span>';
  }

  modal.classList.add('active');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.remove('active');
}

function handleSaveEvent(e) {
  e.preventDefault();

  const id = document.getElementById('eventId').value;
  const name = document.getElementById('eventName').value.trim();
  const datetime = document.getElementById('eventDateTime').value;
  const discord = document.getElementById('eventDiscord').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  
  // Obtener nombre de quien crea/edita el evento
  const activeUser = getCurrentUser();
  const existingEvt = localEvents.find(evt => evt.id === id);

  const eventPayload = { 
    name, 
    datetime, 
    discord, 
    description,
    createdBy: existingEvt ? (existingEvt.createdBy || activeUser) : activeUser
  };

  if (db) {
    if (id) {
      db.child(id).update(eventPayload);
    } else {
      db.push(eventPayload);
    }
  } else {
    if (id) {
      localEvents = localEvents.map(evt => evt.id === id ? { id, ...eventPayload } : evt);
    } else {
      const newEvent = { id: 'evt-' + Date.now(), ...eventPayload };
      localEvents.push(newEvent);
    }
    localStorage.setItem('fn_sport_events', JSON.stringify(localEvents));
    renderEvents(localEvents);
  }

  closeEventModal();
}

function deleteEvent(eventId) {
  if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
    if (db) {
      db.child(eventId).remove();
    } else {
      localEvents = localEvents.filter(e => e.id !== eventId);
      localStorage.setItem('fn_sport_events', JSON.stringify(localEvents));
      renderEvents(localEvents);
    }
  }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initRealtimeSync);