# EduSpend — Student Budget & Expense Dashboard

A clean, modern, student-friendly personal finance and expense dashboard with a responsive sidebar and 4 dedicated operational sections.

## 🚀 Key Features

### 1. Sidebar Navigation
- **Dashboard**: High-level financial overview, metric cards, graphs, and recent transactions.
- **Add Expense**: Streamlined expense logging with one-tap student shortcut presets (Canteen Lunch, Coffee, Transit, Prints), category tagging, payment methods, and celebration confetti.
- **Expense History**: Full audit trail with real-time text search, category filtering, multi-criteria sorting, item deletion, and **Export to CSV**.
- **Budget Planner**: Monthly allowance setter, 50/30/20 student budgeting rule calculator, category caps with health progress bars, and semester savings projection.
- **Sidebar Footer**: User profile badge linked to [aadarshx.in](https://www.aadarshx.in), Dark/Light mode toggle, and one-click sample data reset.

### 2. Dashboard Metrics & Graphs
- **Total Spent Today**: Today's expenditure with transaction count.
- **Total Spent This Month**: Current month total spend with percentage of monthly allowance.
- **Monthly Allowance**: Target budget allocation with quick inline editor.
- **Remaining Budget**: Surplus or deficit calculation with a calculated **Safe Daily Pace** for remaining days in the month.
- **Category-wise Spending Graph**: Interactive Chart.js Donut chart with category percentages, hover tooltips, and top-expense category highlight.
- **Daily Spending Graph**: Smooth Area/Line chart tracking daily campus expenditures against the daily average benchmark (toggle between Last 7 Days and Full Month).

### 3. Student-Centric Design Details
- Preloaded with realistic student seed data (canteen food, textbooks, WiFi, student subscriptions).
- Full **localStorage** persistence: changes, new expenses, and budget limits persist across page reloads.
- Multi-currency switcher (`$`, `₹`, `€`, `£`).
- Dark mode support with persistent preference.
- 100% responsive for mobile, tablet, and desktop screens.

---

## 🛠️ How to Open & Run

### Method 1: Direct Browser Launch (No server required)
You can directly open `index.html` in any web browser (Chrome, Safari, Firefox, Edge, Brave):
```bash
open /Users/devikajoshi/.gemini/antigravity/scratch/student-budget-dashboard/index.html
```

### Method 2: Local HTTP Server (Optional)
If you prefer running a local server:
```bash
# Using Python
cd /Users/devikajoshi/.gemini/antigravity/scratch/student-budget-dashboard
python3 -m http.server 3000

# Or using npx serve
npx serve /Users/devikajoshi/.gemini/antigravity/scratch/student-budget-dashboard
```
Then visit `http://localhost:3000` in your browser.
