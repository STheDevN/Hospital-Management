# Hospital Management System - MongoDB Setup

## Prerequisites

### 1. Install MongoDB
- **Windows**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- **macOS**: `brew install mongodb-community`
- **Linux**: Follow [official installation guide](https://docs.mongodb.com/manual/installation/)

### 2. Install Node.js Dependencies
```bash
npm install
```

## Database Configuration

### Environment Variables
The project uses a `.env` file for configuration:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/
DB_NAME=hms
PORT=3000

# Environment
NODE_ENV=development
```

### Custom MongoDB URL
To use a different MongoDB instance (e.g., MongoDB Atlas):
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

## Running the Application

### 1. Start MongoDB Service
```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
mongod
```

### 2. Start the Application
```bash
npm start
```

The server will:
- Connect to MongoDB
- Create the `hms` database
- Auto-seed with sample data
- Start API server on http://localhost:3000

## Database Collections

The system automatically creates and manages these collections:
- **doctors** - Medical staff information
- **patients** - Patient records
- **appointments** - Appointment scheduling
- **currentUser** - Current logged-in user

## API Testing

Test the MongoDB integration:
```bash
# Get all doctors
curl http://localhost:3000/api/doctors

# Get all patients  
curl http://localhost:3000/api/patients

# Get appointments
curl http://localhost:3000/api/appointments
```

## Troubleshooting

### Connection Issues
1. Ensure MongoDB service is running
2. Check MONGO_URL in `.env` file
3. Verify database permissions

### Port Conflicts
- Change PORT in `.env` if 3000 is occupied
- Restart the application after changes

## Production Deployment

For production:
1. Use MongoDB Atlas or dedicated MongoDB server
2. Set production environment variables
3. Enable authentication and SSL
4. Configure proper backup strategies
