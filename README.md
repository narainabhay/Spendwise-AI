# SpendWise AI – Intelligent Expense Tracker
> *"Understand Your Money. Improve Your Future."*

SpendWise AI is a complete, modern, fintech-grade full-stack personal finance application. It unites expense tracking, proactive budget guardrails, goal milestones, and Google Gemini AI financial reasoning into an intuitive, responsive interface.

---

## 🌟 Key Features

1. **Intelligent Financial Dashboard**
   - **Net Balance Calculation**: Dynamic calculation from opening balance and transaction history (`Total Balance = Opening Balance + Income - Expenses`).
   - **Real-Time KPIs**: Total Monthly Income, Outflow, Net Savings, and Savings Rate (with 20%+ target benchmarks).
   - **Visual Analytics**: Interactive Recharts for Income vs Outflow, Category Donut distributions, and historical area trends.
   - **Snapshot Alerts**: Real-time budget progress with 80% and 100% warnings.

2. **Complete Transaction Management**
   - Multi-field records: Title, Type (Income / Expense), Category, Date, Payment Method, and Notes.
   - 12 comprehensive categories with custom color palettes and icons: Food, Travel, Shopping, Education, Healthcare, Bills, Entertainment, Rent, Salary, Freelance, Investments, and Other.
   - Advanced filtering by date range (This Month, Last Month, 30 Days, 90 Days, This Year, All Time), category, type, and payment method.
   - Live search across titles, notes, and categories.
   - Sorting by amount (high/low) and date (newest/oldest).
   - One-click RFC4180-compliant CSV Export.

3. **Gemini 3.8 Flash AI Financial Advisor**
   - Server-side integration with `@google/genai` (API key never exposed to client).
   - Grounded strictly in your actual computed financial totals: category spending percentages, top expenses, and month-over-month variances.
   - Pre-configured financial prompts:
     - *"Where did I spend the most this month?"*
     - *"Why are my expenses increasing?"*
     - *"Compare my spending with last month."*
     - *"How much can I save next month?"*
     - *"Which categories exceed my budget?"*
     - *"Suggest a realistic monthly budget."*
     - *"Find unusual spending patterns."*
     - *"Give me a personalized savings plan."*
   - Clear distinction between historical data facts and estimates/recommendations.

4. **Smart Budget Planner & Guardrails**
   - Total monthly spending limit and individual category limits.
   - Real-time progress bars with amber alerts at 80% and red warnings at 100% breach.
   - **AI Suggest Budgets**: Leverages Gemini to suggest realistic category allocations according to sound financial guidelines (e.g., 50/30/20 rule).

5. **Savings Goals Module**
   - Target amount, target date, and current saved amount.
   - Incremental deposit / contribution workflow with milestone celebrations.
   - Dynamic formula calculates suggested monthly contributions to reach target date.
   - Filter by Active, Completed, and Overdue goals.

6. **Reports & Analytics**
   - Weekly, monthly, and yearly aggregation views.
   - Area trend charts and highest spending rankings.
   - Average daily burn rate and month-over-month % variance diagnostics.
   - Filtered CSV exports.

7. **Recurring Transactions**
   - Schedule regular income (e.g., Salary) and expenses (e.g., Rent, Utilities, Subscriptions).
   - Explicit "Process Due Items" review workflow to prevent silent duplicate postings.

8. **Dual Mode: Demo Sandbox & Supabase Cloud PostgreSQL**
   - **Demo Mode**: Pre-populated with rich, realistic transaction and budget data; persists in local storage.
   - **Live Cloud Mode**: Connects directly to Supabase PostgreSQL with Row-Level Security (RLS) so each user accesses only their own records.
   - Includes full SQL schema and in-app connection tester.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Data Visualization**: Recharts
- **AI Engine**: Google Gemini API (`@google/genai`, model `gemini-3.8-flash`)
- **Backend**: Node.js & Express (running on port 3000 with Vite middleware)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Google Gemini API key (automatically injected in AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# App URL
APP_URL="http://localhost:3000"

# Supabase PostgreSQL Configuration (Optional for cloud sync)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

PORT=3000
```

---

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

To sync your data to your personal Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Paste the contents of `schema.sql` (or copy directly from **Settings > View SQL Schema** inside SpendWise AI).
4. Run the script. This creates `profiles`, `transactions`, `budgets`, `savings_goals`, `recurring_transactions` and activates Row Level Security (RLS).
5. Copy your **Project URL** and **Anon Public Key** from Supabase Settings > API into SpendWise AI under **Settings & Database** and click **Save & Test Connection**.
