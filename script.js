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

      this._doctors = await doctorsRes.json();
      this._patients = await patientsRes.json();
      this._appointments = await apptsRes.json();
      const user = await userRes.json();
      if (user && user.name) this._currentUser = user;
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