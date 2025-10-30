require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
const DB_NAME = process.env.DB_NAME || 'hms';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

let db;

async function getNextId(collectionName) {
  const col = db.collection(collectionName);
  const doc = await col.find().sort({ id: -1 }).limit(1).toArray();
  return doc.length ? doc[0].id + 1 : 1;
}

async function seedIfEmpty() {
  const doctorsCol = db.collection('doctors');
  const patientsCol = db.collection('patients');
  const appointmentsCol = db.collection('appointments');
  const userCol = db.collection('currentUser');

  const doctorsCount = await doctorsCol.countDocuments();
  if (doctorsCount === 0) {
    await doctorsCol.insertMany([
      { id: 1, name: 'Dr. Sarah Smith', specialization: 'Cardiologist', contact: '+1 (123) 456-7890', email: 'sarah.smith@hospital.com' },
      { id: 2, name: 'Dr. Michael Johnson', specialization: 'Neurologist', contact: '+1 (987) 654-3210', email: 'michael.johnson@hospital.com' },
      { id: 3, name: 'Dr. Emily Williams', specialization: 'Pediatrician', contact: '+1 (555) 123-4567', email: 'emily.williams@hospital.com' },
      { id: 4, name: 'Dr. James Brown', specialization: 'Orthopedic', contact: '+1 (555) 987-6543', email: 'james.brown@hospital.com' },
      { id: 5, name: 'Dr. Lisa Davis', specialization: 'Dermatologist', contact: '+1 (555) 246-8135', email: 'lisa.davis@hospital.com' }
    ]);
  }

  const patientsCount = await patientsCol.countDocuments();
  if (patientsCount === 0) {
    await patientsCol.insertMany([
      { id: 1, name: 'John Doe', age: 30, contact: '+1 (123) 456-7890', email: 'johndoe@example.com', lastVisit: '2024-10-10' },
      { id: 2, name: 'Jane Smith', age: 25, contact: '+1 (555) 555-5555', email: 'janesmith@example.com', lastVisit: '2024-10-12' },
      { id: 3, name: 'Robert Wilson', age: 45, contact: '+1 (555) 111-2222', email: 'robert.wilson@example.com', lastVisit: '2024-10-08' },
      { id: 4, name: 'Maria Garcia', age: 35, contact: '+1 (555) 333-4444', email: 'maria.garcia@example.com', lastVisit: '2024-10-14' }
    ]);
  }

  const userCount = await userCol.countDocuments();
  if (userCount === 0) {
    await userCol.insertOne({ id: 1, name: 'John Doe', email: 'johndoe@example.com' });
  }

  // appointments col seeded empty on purpose
}

async function start() {
  try {
    console.log('🔌 Connecting to MongoDB at:', MONGO_URL);
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    db = client.db(DB_NAME);
    console.log('📊 Using database:', DB_NAME);

    await seedIfEmpty();
    console.log('🌱 Database seeding completed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // Doctors
  app.get('/api/doctors', async (req, res) => {
    try {
      const doctors = await db.collection('doctors').find().toArray();
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ error: 'Failed to fetch doctors' });
    }
  });

  app.post('/api/doctors', async (req, res) => {
    const doc = req.body;
    doc.id = await getNextId('doctors');
    await db.collection('doctors').insertOne(doc);
    res.json(doc);
  });

  app.delete('/api/doctors/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await db.collection('doctors').deleteOne({ id });
    res.json({ success: true });
  });

  // Patients
  app.get('/api/patients', async (req, res) => {
    const patients = await db.collection('patients').find().toArray();
    res.json(patients);
  });

  app.get('/api/patients/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const patient = await db.collection('patients').findOne({ id });
    res.json(patient || {});
  });

  // Appointments
  app.get('/api/appointments', async (req, res) => {
    const appointments = await db.collection('appointments').find().toArray();
    res.json(appointments);
  });

  app.post('/api/appointments', async (req, res) => {
    const apt = req.body;
    apt.id = await getNextId('appointments');
    apt.status = apt.status || 'Confirmed';
    await db.collection('appointments').insertOne(apt);
    res.json(apt);
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await db.collection('appointments').deleteOne({ id });
    res.json({ success: true });
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    await db.collection('appointments').updateOne({ id }, { $set: { status } });
    const updated = await db.collection('appointments').findOne({ id });
    res.json(updated);
  });

  // Current user
  app.get('/api/currentUser', async (req, res) => {
    const user = await db.collection('currentUser').findOne({}, { projection: { _id: 0 } });
    res.json(user || {});
  });

  app.put('/api/currentUser', async (req, res) => {
    const user = req.body;
    await db.collection('currentUser').updateOne({}, { $set: user }, { upsert: true });
    res.json(user);
  });

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});