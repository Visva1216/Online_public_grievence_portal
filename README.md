# 🏛️ Delhi Grievance Portal - AI-Powered Public Grievance System
## Government of NCT of Delhi

A complete, production-ready AI-powered grievance management system with Spring Boot backend, React frontend, MySQL database, and Python AI microservices.

---

## 🗂️ Project Structure

```
delhi-grievance-portal/
├── backend/          # Spring Boot REST API
├── frontend/         # React.js Application  
├── ai-service/       # Python AI Microservices
└── database/         # MySQL Schema & Seeds
```

## 🚀 Quick Start

### Prerequisites
- Java 17+, Maven 3.8+
- Node.js 18+, npm 9+
- Python 3.10+, pip
- MySQL 8.0+

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p delhi_grievance < database/seed.sql
```

### 2. Backend
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. AI Service
```bash
cd ai-service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```
