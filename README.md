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

## 🌟 Key Features
- **AI-Powered Categorization**: Automatically routes and categorizes complaints using Python AI microservices.
- **Transparency Dashboard**: Public dashboard to view grievance statistics and resolution metrics.
- **Complaint Tracking**: Track real-time status updates of filed grievances.
- **Secure Authentication**: Robust login and role-based access control.

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

### 2. Running the Application

#### Option A: Quick Start (Windows)
You can launch all three services automatically using the provided batch script:
```cmd
start-all.bat
```

#### Option B: Manual Start

**Backend (Spring Boot)**
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

**AI Service (Python Flask)**
```bash
cd ai-service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

**Frontend (React)**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```
