# 🚀 AI Career Coach Platform

An intelligent full-stack web application that helps users with career guidance using AI-powered insights. It provides personalized suggestions, resume improvements, and career recommendations based on user input.

---

## 📌 Project Overview

The AI Career Coach Platform is designed to assist users in making better career decisions by leveraging AI. Users can input their details, skills, and goals, and the system generates meaningful suggestions to guide their career path.

### Features:
- 🧠 AI-based career guidance
- 📄 Resume analysis & improvement suggestions
- 🎯 Personalized recommendations
- 🔐 Secure authentication system
- ⚡ Fast and responsive UI

---

## 🛠️ Tech Stack

### 💻 Frontend
- Next.js
- Tailwind CSS
- Shadcn UI

### 🧠 Backend & Database
- Neon DB (PostgreSQL)
- Prisma ORM

### 🔐 Authentication
- Clerk

### 🤖 AI Integration
- Google Gemini API

### ⚙️ Background Jobs
- Inngest

---

## ⚙️ Environment Variables

DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=
---

## ⚡ How It Works

1. User signs up or logs in using Clerk  
2. User enters career-related data  
3. Backend processes data and sends request to Gemini API  
4. AI generates personalized career suggestions  
5. Results are displayed on the dashboard  

---

## 🎯 Key Highlights

- Full-stack project using Next.js  
- Secure authentication with Clerk  
- AI-powered features using Gemini API  
- Scalable database with Prisma + Neon DB  
- Clean UI with Tailwind and Shadcn  
- Background workflows using Inngest  

---

## 📌 Conclusion

This project demonstrates how AI can be integrated into a full-stack application to build a smart and scalable career guidance platform.


Create a `.env` file in the root directory and add:

