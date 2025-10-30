require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
const DB_NAME = process.env.DB_NAME || 'hms';

async function initializeDatabase() {
  console.log('🏥 Initializing Hospital Management Database...');
  
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create collections with validation
    await createCollections(db);
    
    // Seed initial data
    await seedDatabase(db);
    
    await client.close();
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createCollections(db) {
  const collections = ['doctors', 'patients', 'appointments', 'currentUser'];
  
  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName);
      console.log(`📋 Created collection: ${collectionName}`);
    } catch (error) {
      if (error.code === 48) {
        console.log(`📋 Collection ${collectionName} already exists`);
      } else {
        throw error;
      }
    }
  }
}

async function seedDatabase(db) {
  console.log('🌱 Seeding database with initial data...');
  
  // Seed doctors
  const doctorsCol = db.collection('doctors');
  const doctorsCount = await doctorsCol.countDocuments();
  if (doctorsCount === 0) {
    await doctorsCol.insertMany([
      { id: 1, name: 'Dr. Sarah Smith', specialization: 'Cardiologist', contact: '+1 (123) 456-7890', email: 'sarah.smith@hospital.com' },
      { id: 2, name: 'Dr. Michael Johnson', specialization: 'Neurologist', contact: '+1 (987) 654-3210', email: 'michael.johnson@hospital.com' },
      { id: 3, name: 'Dr. Emily Williams', specialization: 'Pediatrician', contact: '+1 (555) 123-4567', email: 'emily.williams@hospital.com' },
      { id: 4, name: 'Dr. James Brown', specialization: 'Orthopedic', contact: '+1 (555) 987-6543', email: 'james.brown@hospital.com' },
      { id: 5, name: 'Dr. Lisa Davis', specialization: 'Dermatologist', contact: '+1 (555) 246-8135', email: 'lisa.davis@hospital.com' }
    ]);
    console.log('👨‍⚕️ Seeded doctors collection');
  }
  
  // Seed patients
  const patientsCol = db.collection('patients');
  const patientsCount = await patientsCol.countDocuments();
  if (patientsCount === 0) {
    await patientsCol.insertMany([
      { id: 1, name: 'John Doe', age: 30, contact: '+1 (123) 456-7890', email: 'johndoe@example.com', lastVisit: '2024-10-10' },
      { id: 2, name: 'Jane Smith', age: 25, contact: '+1 (555) 555-5555', email: 'janesmith@example.com', lastVisit: '2024-10-12' },
      { id: 3, name: 'Robert Wilson', age: 45, contact: '+1 (555) 111-2222', email: 'robert.wilson@example.com', lastVisit: '2024-10-08' },
      { id: 4, name: 'Maria Garcia', age: 35, contact: '+1 (555) 333-4444', email: 'maria.garcia@example.com', lastVisit: '2024-10-14' }
    ]);
    console.log('🏥 Seeded patients collection');
  }
  
  // Seed current user
  const userCol = db.collection('currentUser');
  const userCount = await userCol.countDocuments();
  if (userCount === 0) {
    await userCol.insertOne({ id: 1, name: 'Admin User', email: 'admin@hospital.com' });
    console.log('👤 Seeded current user');
  }
  
  console.log('✅ Database seeding completed');
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
