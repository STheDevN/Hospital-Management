// ...existing code...
// Replaced localStorage DB with server-backed DB that keeps an in-memory cache.
// Base API URL:
const API_BASE = 'http://localhost:3000/api';

const DB = {
  _doctors: [],
  _patients: [],
  _appointments: [],
  _currentUser: { name: 'John Doe', email: 'johndoe@example.com' },

  async init() {
    try {
      const [doctorsRes, patientsRes, apptsRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/doctors`),
        fetch(`${API_BASE}/patients`),
        fetch(`${API_BASE}/appointments`),
        fetch(`${API_BASE}/currentUser`)
      ]);

      // Check if responses are ok
      if (doctorsRes.ok) this._doctors = await doctorsRes.json();
      if (patientsRes.ok) this._patients = await patientsRes.json();
      if (apptsRes.ok) this._appointments = await apptsRes.json();
      if (userRes.ok) {
        const user = await userRes.json();
        if (user && user.name) this._currentUser = user;
      }
      
      console.log('✅ Database initialized successfully');
    } catch (err) {
      console.error('Failed to initialize DB from server', err);
      // Keep empty/in-memory fallback
    }
  },

  // Getters (synchronous access to the in-memory cache)
  getDoctors() {
    return this._doctors.slice();
  },

  getPatients() {
    return this._patients.slice();
  },

  getAppointments() {
    return this._appointments.slice();
  },

  getCurrentUser() {
    return Object.assign({}, this._currentUser);
  },

  // Persistence helpers (async)
  async saveDoctors(doctors) {
    // naive: replace all doctors on server is not implemented; we keep individual ops
    this._doctors = doctors.slice();
  },

  async savePatients(patients) {
    this._patients = patients.slice();
  },

  async saveAppointments(appointments) {
    this._appointments = appointments.slice();
  },

  // Add new items
  async addDoctor(doctor) {
    try {
      const res = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor)
      });
      const created = await res.json();
      this._doctors.push(created);
      return created;
    } catch (err) {
      console.error('Failed to add doctor', err);
      return null;
    }
  },

  async addAppointment(appointment) {
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
      });
      const created = await res.json();
      this._appointments.push(created);
      return created;
    } catch (err) {
      console.error('Failed to add appointment', err);
      return null;
    }
  },

  // Delete items
  async deleteDoctor(id) {
    try {
      await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
      this._doctors = this._doctors.filter(d => d.id !== id);
    } catch (err) {
      console.error('Failed to delete doctor', err);
    }
  },

  async deleteAppointment(id) {
    try {
      await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
      this._appointments = this._appointments.filter(a => a.id !== id);
    } catch (err) {
      console.error('Failed to delete appointment', err);
    }
  },

  // Update appointment status
  async updateAppointmentStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updated = await res.json();
      const idx = this._appointments.findIndex(a => a.id === id);
      if (idx >= 0) this._appointments[idx] = updated;
    } catch (err) {
      console.error('Failed to update appointment status', err);
    }
  }
};

// Initialize DB from server, then start parts of the UI that depend on data
DB.init().then(() => {
  // Set minimum date for appointment booking to today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = getTodayDate();
  }

  // Load time slots when data ready
  loadTimeSlots();

  // If hospital dashboard is open, refresh tables (some pages may be visible on load)
  if (document.getElementById('hospitalDashboard')?.classList.contains('active')) {
    loadOverviewStats();
    loadDoctorsTable();
    loadPatientsTable();
    loadAppointmentsTable();
  }
}).catch(err => {
  console.error('DB init error', err);
});

// ...existing code...
// Note: many UI functions call DB.* synchronously; because DB.init populates an in-memory cache
// before UI interactions, the rest of your original code can remain largely unchanged.
// When mutating data (add/delete/update) the DB methods above perform server requests and update
// the in-memory cache so subsequent reads reflect server state.
// ==================== DATA STORAGE ====================
// Simulated database using localStorage

// ==================== UTILITY FUNCTIONS ====================
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function showNotification(message, type = 'success') {
  const alert = document.getElementById('bookingResult');
  if (alert) {
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    alert.style.display = 'flex';
    
    setTimeout(() => {
      alert.style.display = 'none';
    }, 5000);
  }
}

// ==================== NAVIGATION FUNCTIONS ====================
function backToMain() {
  document.getElementById('patientLoginDiv').style.display = 'none';
  document.getElementById('hospitalLoginDiv').style.display = 'none';
}

function showPatientSection(id) {
  document.querySelectorAll('#patientDashboard .section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#patientDashboard .nav-item').forEach(item => item.classList.remove('active'));
  
  document.getElementById('patient' + capitalizeFirstLetter(id)).classList.add('active');
  
  // Update active nav item
  const navItems = document.querySelectorAll('#patientDashboard .nav-item');
  navItems.forEach(item => {
    if (item.textContent.toLowerCase().includes(id.toLowerCase())) {
      item.classList.add('active');
    }
  });
  
  // Load data for specific sections
  if (id === 'myAppointments') {
    loadPatientAppointments();
  } else if (id === 'slots') {
    loadAvailableSlots();
  }
}

function showHospitalSection(id) {
  document.querySelectorAll('#hospitalDashboard .section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#hospitalDashboard .nav-item').forEach(item => item.classList.remove('active'));
  
  document.getElementById('hospital' + capitalizeFirstLetter(id)).classList.add('active');
  
  // Update active nav item
  const navItems = document.querySelectorAll('#hospitalDashboard .nav-item');
  navItems.forEach(item => {
    if (item.textContent.toLowerCase().includes(id.toLowerCase())) {
      item.classList.add('active');
    }
  });
  
  // Load data for specific sections
  if (id === 'overview') {
    loadOverviewStats();
  } else if (id === 'doctors') {
    loadDoctorsTable();
  } else if (id === 'patients') {
    loadPatientsTable();
  } else if (id === 'appointments') {
    loadAppointmentsTable();
  }
}

function logout() {
  document.getElementById('mainLogin').style.display = 'block';
  document.querySelectorAll('.dashboard').forEach(d => d.classList.remove('active'));
  document.getElementById('patientLoginDiv').style.display = 'none';
  document.getElementById('hospitalLoginDiv').style.display = 'none';
  
  // Reset forms
  document.getElementById('patientLoginForm').reset();
  document.getElementById('hospitalLoginForm').reset();
}

// ==================== LOGIN HANDLERS ====================
document.getElementById('showPatientLogin').onclick = () => {
  document.getElementById('patientLoginDiv').style.display = 'block';
  document.getElementById('hospitalLoginDiv').style.display = 'none';
};

document.getElementById('showHospitalLogin').onclick = () => {
  document.getElementById('patientLoginDiv').style.display = 'none';
  document.getElementById('hospitalLoginDiv').style.display = 'block';
};

document.getElementById('patientLoginForm').onsubmit = (e) => {
  e.preventDefault();
  const username = document.getElementById('patientUsername').value;
  
  // Update user display
  document.getElementById('patientNameDisplay').textContent = username || 'John Doe';
  
  document.getElementById('mainLogin').style.display = 'none';
  document.getElementById('patientDashboard').classList.add('active');
  
  // Load initial data
  loadDoctorOptions();
  loadPatientAccount();
};

document.getElementById('hospitalLoginForm').onsubmit = (e) => {
  e.preventDefault();
  
  document.getElementById('mainLogin').style.display = 'none';
  document.getElementById('hospitalDashboard').classList.add('active');
  
  // Load initial data
  loadOverviewStats();
  loadDoctorsTable();
};

// ==================== PATIENT DASHBOARD FUNCTIONS ====================
function loadDoctorOptions() {
  const doctors = DB.getDoctors();
  const doctorSelect = document.getElementById('doctorSelect');
  
  doctorSelect.innerHTML = '<option value="">--Select Doctor--</option>';
  doctors.forEach(doctor => {
    const option = document.createElement('option');
    option.value = doctor.name;
    option.textContent = `${doctor.name} - ${doctor.specialization}`;
    option.dataset.id = doctor.id;
    doctorSelect.appendChild(option);
  });
}

function loadTimeSlots() {
  const timeSlot = document.getElementById('timeSlot');
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];
  
  timeSlot.innerHTML = '<option value="">--Select Slot--</option>';
  timeSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = slot;
    timeSlot.appendChild(option);
  });
}

function loadPatientAccount() {
  const user = DB.getCurrentUser();
  document.getElementById('accountName').textContent = user.name || 'John Doe';
  document.getElementById('accountEmail').textContent = user.email || 'johndoe@example.com';
}

function loadAvailableSlots() {
  const doctors = DB.getDoctors();
  const container = document.getElementById('slotsContainer');
  
  if (doctors.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><h4>No doctors available</h4></div>';
    return;
  }
  
  container.innerHTML = '';
  doctors.forEach(doctor => {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'doctor-slot';
    
    const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
    const slotsHTML = timeSlots.map(slot => `<span class="time-slot">${slot}</span>`).join('');
    
    slotDiv.innerHTML = `
      <h4>${doctor.name}</h4>
      <div class="specialization">${doctor.specialization}</div>
      <div class="time-slots">${slotsHTML}</div>
    `;
    
    container.appendChild(slotDiv);
  });
}

function loadPatientAppointments() {
  const appointments = DB.getAppointments();
  const currentUser = DB.getCurrentUser();
  const userAppointments = appointments.filter(apt => apt.patientName === currentUser.name);
  const container = document.getElementById('patientAppointmentsList');
  
  if (userAppointments.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><h4>No appointments scheduled</h4><p>Book your first appointment to get started</p></div>';
    return;
  }
  
  container.innerHTML = '';
  userAppointments.forEach(apt => {
    const aptDiv = document.createElement('div');
    aptDiv.className = 'appointment-item';
    
    aptDiv.innerHTML = `
      <div class="appointment-info">
        <h4>${apt.doctor}</h4>
        <div class="appointment-details">
          <span><i class="fas fa-calendar"></i> ${formatDate(apt.date)}</span>
          <span><i class="fas fa-clock"></i> ${apt.time}</span>
          <span><i class="fas fa-notes-medical"></i> ${apt.reason}</span>
        </div>
      </div>
      <div class="appointment-actions">
        <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
        <button class="action-btn btn-delete" onclick="cancelAppointment(${apt.id})">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    `;
    
    container.appendChild(aptDiv);
  });
}

function cancelAppointment(id) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    DB.deleteAppointment(id);
    loadPatientAppointments();
    showNotification('Appointment cancelled successfully', 'success');
  }
}

// ==================== APPOINTMENT BOOKING ====================
document.getElementById('appointmentForm').onsubmit = (e) => {
  e.preventDefault();
  
  const doctor = document.getElementById('doctorSelect').value;
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('timeSlot').value;
  const reason = document.getElementById('visitReason').value;
  const currentUser = DB.getCurrentUser();
  
  if (!doctor || !date || !time || !reason) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  // Check if date is in the past
  if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
    showNotification('Cannot book appointments for past dates', 'error');
    return;
  }
  
  const appointment = {
    patientName: currentUser.name,
    doctor: doctor,
    date: date,
    time: time,
    reason: reason
  };
  
  DB.addAppointment(appointment);
  
  showNotification(`Appointment booked successfully with ${doctor} on ${formatDate(date)} at ${time}`, 'success');
  document.getElementById('appointmentForm').reset();
  
  // Update hospital dashboard if open
  loadAppointmentsTable();
  loadOverviewStats();
};

// Time slots are loaded in the DB.init() promise chain

// ==================== HOSPITAL DASHBOARD FUNCTIONS ====================
function loadOverviewStats() {
  const doctors = DB.getDoctors();
  const patients = DB.getPatients();
  const appointments = DB.getAppointments();
  const today = getTodayDate();
  const todayAppointments = appointments.filter(apt => apt.date === today);
  
  document.getElementById('totalDoctors').textContent = doctors.length;
  document.getElementById('totalPatients').textContent = patients.length;
  document.getElementById('totalAppointments').textContent = appointments.length;
  document.getElementById('todayAppointments').textContent = todayAppointments.length;
  
  // Load today's schedule
  const scheduleContainer = document.getElementById('todaySchedule');
  
  if (todayAppointments.length === 0) {
    scheduleContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><h4>No appointments scheduled for today</h4></div>';
    return;
  }
  
  scheduleContainer.innerHTML = '';
  todayAppointments.forEach(apt => {
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';
    
    scheduleItem.innerHTML = `
      <div class="schedule-time">${apt.time}</div>
      <div class="schedule-details">
        <h5>${apt.patientName}</h5>
        <p><i class="fas fa-user-md"></i> ${apt.doctor} | <i class="fas fa-notes-medical"></i> ${apt.reason}</p>
      </div>
      <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
    `;
    
    scheduleContainer.appendChild(scheduleItem);
  });
}

function loadDoctorsTable() {
  const doctors = DB.getDoctors();
  const tbody = document.getElementById('doctorsTableBody');
  
  if (doctors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No doctors found</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  doctors.forEach(doctor => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${doctor.id}</td>
      <td>${doctor.name}</td>
      <td>${doctor.specialization}</td>
      <td>${doctor.contact}</td>
      <td>${doctor.email}</td>
      <td>
        <button class="action-btn btn-edit" onclick="editDoctor(${doctor.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="action-btn btn-delete" onclick="deleteDoctor(${doctor.id})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Update doctor filter in appointments
  updateDoctorFilter();
}

function loadPatientsTable() {
  const patients = DB.getPatients();
  const tbody = document.getElementById('patientsTableBody');
  
  if (patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No patients found</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  patients.forEach(patient => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${patient.id}</td>
      <td>${patient.name}</td>
      <td>${patient.age}</td>
      <td>${patient.contact}</td>
      <td>${patient.email}</td>
      <td>${formatDate(patient.lastVisit)}</td>
      <td>
        <button class="action-btn btn-view" onclick="viewPatient(${patient.id})">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function loadAppointmentsTable() {
  const appointments = DB.getAppointments();
  const tbody = document.getElementById('appointmentsTableBody');
  
  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No appointments found</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  appointments.forEach(apt => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${apt.id}</td>
      <td>${apt.patientName}</td>
      <td>${apt.doctor}</td>
      <td>${formatDate(apt.date)}</td>
      <td>${apt.time}</td>
      <td>${apt.reason}</td>
      <td><span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="updateStatus(${apt.id}, 'Confirmed')">
          <i class="fas fa-check"></i> Confirm
        </button>
        <button class="action-btn btn-delete" onclick="updateStatus(${apt.id}, 'Cancelled')">
          <i class="fas fa-times"></i> Cancel
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function updateStatus(id, status) {
  DB.updateAppointmentStatus(id, status);
  loadAppointmentsTable();
  loadOverviewStats();
  showNotification(`Appointment ${status.toLowerCase()} successfully`, 'success');
}

// ==================== DOCTOR MANAGEMENT ====================
function showAddDoctorForm() {
  document.getElementById('addDoctorForm').style.display = 'block';
}

function hideAddDoctorForm() {
  document.getElementById('addDoctorForm').style.display = 'none';
  document.getElementById('doctorForm').reset();
}

document.getElementById('doctorForm').onsubmit = (e) => {
  e.preventDefault();
  
  const doctor = {
    name: document.getElementById('doctorName').value,
    specialization: document.getElementById('doctorSpec').value,
    contact: document.getElementById('doctorContact').value,
    email: document.getElementById('doctorEmail').value
  };
  
  DB.addDoctor(doctor);
  loadDoctorsTable();
  loadDoctorOptions();
  loadAvailableSlots();
  loadOverviewStats();
  hideAddDoctorForm();
  
  alert('Doctor added successfully!');
};

function editDoctor(id) {
  alert('Edit functionality would open a modal to edit doctor details');
}

function deleteDoctor(id) {
  if (confirm('Are you sure you want to delete this doctor?')) {
    DB.deleteDoctor(id);
    loadDoctorsTable();
    loadDoctorOptions();
    loadAvailableSlots();
    loadOverviewStats();
    alert('Doctor deleted successfully!');
  }
}

function viewPatient(id) {
  const patients = DB.getPatients();
  const patient = patients.find(p => p.id === id);
  if (patient) {
    alert(`Patient Details:

Name: ${patient.name}
Age: ${patient.age}
Contact: ${patient.contact}
Email: ${patient.email}
Last Visit: ${formatDate(patient.lastVisit)}`);
  }
}

// ==================== SEARCH AND FILTER ====================
function searchPatients() {
  const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
  const patients = DB.getPatients();
  const filtered = patients.filter(p => p.name.toLowerCase().includes(searchTerm));
  
  const tbody = document.getElementById('patientsTableBody');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No patients found</td></tr>';
    return;
  }
  
  filtered.forEach(patient => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${patient.id}</td>
      <td>${patient.name}</td>
      <td>${patient.age}</td>
      <td>${patient.contact}</td>
      <td>${patient.email}</td>
      <td>${formatDate(patient.lastVisit)}</td>
      <td>
        <button class="action-btn btn-view" onclick="viewPatient(${patient.id})">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function updateDoctorFilter() {
  const doctors = DB.getDoctors();
  const filter = document.getElementById('doctorFilter');
  
  filter.innerHTML = '<option value="">All Doctors</option>';
  doctors.forEach(doctor => {
    const option = document.createElement('option');
    option.value = doctor.name;
    option.textContent = doctor.name;
    filter.appendChild(option);
  });
}

function filterAppointments() {
  const dateFilter = document.getElementById('appointmentFilter').value;
  const doctorFilter = document.getElementById('doctorFilter').value;
  
  let appointments = DB.getAppointments();
  
  if (dateFilter) {
    appointments = appointments.filter(apt => apt.date === dateFilter);
  }
  
  if (doctorFilter) {
    appointments = appointments.filter(apt => apt.doctor === doctorFilter);
  }
  
  const tbody = document.getElementById('appointmentsTableBody');
  tbody.innerHTML = '';
  
  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No appointments found</td></tr>';
    return;
  }
  
  appointments.forEach(apt => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${apt.id}</td>
      <td>${apt.patientName}</td>
      <td>${apt.doctor}</td>
      <td>${formatDate(apt.date)}</td>
      <td>${apt.time}</td>
      <td>${apt.reason}</td>
      <td><span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="updateStatus(${apt.id}, 'Confirmed')">
          <i class="fas fa-check"></i> Confirm
        </button>
        <button class="action-btn btn-delete" onclick="updateStatus(${apt.id}, 'Cancelled')">
          <i class="fas fa-times"></i> Cancel
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function clearFilters() {
  document.getElementById('appointmentFilter').value = '';
  document.getElementById('doctorFilter').value = '';
  loadAppointmentsTable();
}

// ==================== INITIALIZATION ====================
// Set minimum date for appointment booking to today
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = getTodayDate();
  }
});