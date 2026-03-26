# ⛳ Golf Course: Charity Subscription Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styled-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?style=flat-square&logo=supabase)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)

> A high-performance, mobile-first subscription platform where golf enthusiasts can log their scores, support global charities, and participate in automated prize draws. Built with a focus on transparency, secure automated payouts, and social impact.

### 🚀 **[View Live Demo Here](https://golf-course-a-golf-charity-subscription-platform-6pi-j7njr308c.vercel.app/login)**

---

## 📖 About the Project

**Golf Course** turns every game of golf into an opportunity for giving. The platform features a dual-sided architecture: a seamless, mobile-optimized experience for players to manage subscriptions and track their impact, and a robust command center for administrators to run algorithm-based draws, verify winners, and manage payouts.

---

## ✨ Key Features

### 🏌️‍♂️ Player Experience
* **Subscription Management:** Secure monthly and yearly recurring memberships powered by Stripe.
* **Impact Control:** Players select their preferred charity from a global directory and dynamically set their contribution percentage (10%–100%).
* **Score Tracking:** A clean, intuitive interface to log recent game scores (maintaining the 5 most recent entries).
* **Prize Center:** Automated dashboard notifications for winning draws, complete with a secure document upload system for prize claim verification.

### 👑 Admin Command Center
* **The Draw Engine:** A custom-built algorithmic system that evaluates active subscribers against drawn numbers, calculating match counts (3, 4, or 5) and automating Jackpot Rollovers.
* **Verification Queue:** A streamlined portal to review player "Proof of Win" documents and securely approve financial payouts.
* **Real-Time Analytics:** Live tracking of active subscribers, estimated platform revenue, and current prize pools.
* **Platform Management:** Full CRUD capabilities for the charity directory and oversight of the global user base.

---

## 💻 Tech Stack

* **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
* **Backend:** Next.js Server Actions & Route Handlers
* **Database & Auth:** Supabase (PostgreSQL), Supabase Storage for secure file uploads
* **Payments:** Stripe API & Stripe Webhooks
* **Deployment:** Vercel

---

## 🔒 Security & Architecture

* **Role-Based Access Control (RBAC):** Strict layout-level middleware ensuring total separation between player dashboards and the `/admin` command center.
* **Impersonation Protection:** Custom signup logic preventing users from registering with reserved system names (e.g., "Admin").
* **Secure Webhooks:** Cryptographically signed Stripe webhooks to ensure database updates (like subscription activations) only occur from verified payment events.
* **Smart Routing:** Intelligent login redirection based on user roles and active session states.

---

## 🚀 Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* Supabase Account & Stripe Developer Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/pratish19/Golf-Course-A-Golf-Charity-Subscription-Platform.git](https://github.com/pratish19/Golf-Course-A-Golf-Charity-Subscription-Platform.git)
   cd Golf-Course-A-Golf-Charity-Subscription-Platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your specific API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) to view it in your browser.*

---
*Designed and built by Pratish.*
