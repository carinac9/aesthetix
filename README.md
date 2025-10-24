# 🏠 Aesthetix — Interior Design Platform  

*Create, share, and visualize your dream spaces in 3D.*  

![aesthetix](https://img.shields.io/badge/aesthetix-Interior%20Design%20Platform-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.6-green)
![Flask](https://img.shields.io/badge/Flask-Recommendation%20Service-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

---

## 🎥 Demo
🎬 [Watch the Demo Video](https://drive.google.com/drive/u/0/folders/14-PgOqFe3JN1tRQFNmAgWRsyQ6boKE6Y)  
*(Short 3 minute preview of the main features and UI)*  

---

## ✨ Overview
**Aesthetix** is a full-stack web platform that combines social networking with interactive 3D interior design.  
Users can design rooms, place furniture, share projects, follow friends, and explore design templates powered by a Python microservice.  

Built as my **Bachelor’s Thesis** at *West University of Timișoara (2025)* — a project that reflects my passion for blending **technology**, **creativity**, and **user experience**.  

---

## ⚙️ Tech Stack
**Frontend:** React, Vite, Three.js  
**Backend:** Spring Boot (Java 17), PostgreSQL  
**Microservice:** Flask (Python)  
**Other:** Sketchfab API, Axios, REST APIs  

---

## 🌟 Features
- 🏡 3D Room Designer with real-time rendering  
- 🧠 Template recommendation microservice (Flask + PostgreSQL)  
- 🧑‍🤝‍🧑 Social features — follow, post, like, comment  
- 🔐 Secure authentication and profile privacy  
- 💌 Email notifications and friend requests  
- 📱 Responsive and intuitive design  

---

## 🚀 Quick Start
```bash
# Clone the project
git clone https://github.com/CarinaCimpianu/Aesthetix.git

# Run backend (Spring Boot)
cd demo
mvn spring-boot:run

# Run frontend (React)
cd ../aesthetix
npm install
npm run dev

# Optional: Run Python microservice
cd ../prettAI
python app.py
