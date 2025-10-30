# Hospital Management System - Database Schema

## Database: `hms`

### Collections

#### 1. **doctors**
```json
{
  "id": "number (auto-increment)",
  "name": "string",
  "specialization": "string", 
  "contact": "string",
  "email": "string"
}
```

**Sample Data:**
- Dr. Sarah Smith (Cardiologist)
- Dr. Michael Johnson (Neurologist)
- Dr. Emily Williams (Pediatrician)
- Dr. James Brown (Orthopedic)
- Dr. Lisa Davis (Dermatologist)

#### 2. **patients**
```json
{
  "id": "number (auto-increment)",
  "name": "string",
  "age": "number",
  "contact": "string",
  "email": "string",
  "lastVisit": "string (YYYY-MM-DD)"
}
```

**Sample Data:**
- John Doe (30 years)
- Jane Smith (25 years)
- Robert Wilson (45 years)
- Maria Garcia (35 years)

#### 3. **appointments**
```json
{
  "id": "number (auto-increment)",
  "patientId": "number",
  "doctorId": "number", 
  "date": "string (YYYY-MM-DD)",
  "time": "string (HH:MM)",
  "status": "string (Confirmed|Completed|Cancelled)"
}
```

#### 4. **currentUser**
```json
{
  "id": "number",
  "name": "string",
  "email": "string"
}
```

## API Endpoints

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Add new doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Patients  
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get specific patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PUT /api/appointments/:id/status` - Update appointment status

### User
- `GET /api/currentUser` - Get current user
- `PUT /api/currentUser` - Update current user

## Database Features

- **Auto-seeding**: Database automatically seeds with sample data on first run
- **Auto-increment IDs**: Custom ID generation for all collections
- **Error Handling**: Proper error handling and validation
- **CORS Support**: Cross-origin requests enabled
