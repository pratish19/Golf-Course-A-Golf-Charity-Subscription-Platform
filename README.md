Deployed Links: https://golf-course-a-golf-charity-subscription-platform-6pi-j7njr308c.vercel.app/login
⛳ Golf Course: A Golf Charity Subscription Platform
Golf Course is a high-performance, mobile-first Web3-style subscription platform where golf enthusiasts can log their scores, support global charities, and participate in automated prize draws. Built with a focus on transparency and social impact, the platform turns every game of golf into an opportunity for giving.

🚀 Key Features
For Players
Role-Based Dashboards: Distinct experiences for Players and Administrators.

Subscription Engine: Monthly and Yearly membership plans powered by Stripe.

Impact Tracking: Users select a charity and set their contribution percentage (10%–100%).

Score Logging: Simple mobile interface to log recent game points (limited to 5 active scores).

Prize Center: Automated winning notifications with a secure Supabase Storage proof-upload system for verification.

For Administrators
The Draw Engine: A custom-built algorithm that evaluates player scores against drawn numbers, calculates match counts (3, 4, or 5), and manages a Jackpot Rollover system.

Verification Queue: A dedicated portal to review "Proof of Win" documents and approve payouts.

Analytics Command Center: Real-time stats on active subscribers, estimated revenue, and current prize pools.

User & Charity Management: Tools to manage the global charity directory and monitor user subscription statuses.

🛠️ Tech Stack
Framework: Next.js 15 (App Router)

Styling: Tailwind CSS (Dark Mode / Zinc-Emerald aesthetic)

Database & Auth: Supabase

Payments: Stripe API

Deployment: Vercel

Language: TypeScript

📂 Project Structure
Plaintext
├── app/
│   ├── (admin)/dashboard   # Admin-only control center
│   ├── (auth)/login        # Smart-routing authentication
│   ├── (dashboard)/page    # Player-centric dashboard
│   └── api/
│       ├── billing         # Stripe Checkout Session logic
│       └── webhooks/stripe # Secure payment/subscription sync
├── components/             # Reusable UI (CharitySlider, PricingCards, etc.)
├── lib/
│   ├── supabase/           # Server/Client database utilities
│   └── utils.ts            # Formatting and logic helpers
└── public/                 # Static assets and brand assets
⚙️ Installation & Setup
Clone the repository:

Bash
git clone https://github.com/pratish19/Golf-Course-A-Golf-Charity-Subscription-Platform.git
cd Golf-Course-A-Golf-Charity-Subscription-Platform
Install dependencies:

Bash
npm install
Environment Variables:
Create a .env.local file and add your credentials:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
Run the development server:

Bash
npm run dev
🛡️ Security
Middleware Protection: Routes are protected based on authentication state.

Admin Isolation: The /admin route is strictly constrained to the master admin email.

Impersonation Protection: Registration logic prevents users from using reserved names like "Admin."

Signature Verification: Stripe webhooks use secret signing to prevent unauthorized database updates.

Developed with ❤️ by Pratish
