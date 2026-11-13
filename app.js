/**
 * EduSpend — Student Budget & Expense Dashboard
 * Frontend Architecture & State Management
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEYS = {
    EXPENSES: 'eduspend_expenses',
    ALLOWANCE: 'eduspend_allowance',
    CURRENCY: 'eduspend_currency',
    THEME: 'eduspend_theme',
    CATEGORY_BUDGETS: 'eduspend_category_budgets',
  };

  // Category Configuration
  const CATEGORIES = {
    Food: { icon: '🍔', color: '#f59e0b', darkColor: '#fbbf24', defaultLimit: 140 },
    Academics: { icon: '📚', color: '#6366f1', darkColor: '#818cf8', defaultLimit: 70 },
    Transport: { icon: '🚌', color: '#0ea5e9', darkColor: '#38bdf8', defaultLimit: 45 },
    Housing: { icon: '🏠', color: '#a855f7', darkColor: '#c084fc', defaultLimit: 120 },
    Entertainment: { icon: '🎮', color: '#ec4899', darkColor: '#f472b6', defaultLimit: 40 },
    Personal: { icon: '🧴', color: '#10b981', darkColor: '#34d399', defaultLimit: 35 },
    Tech: { icon: '💻', color: '#22c55e', darkColor: '#4ade80', defaultLimit: 25 },
    Other: { icon: '📦', color: '#94a3b8', darkColor: '#cbd5e1', defaultLimit: 25 },
  };

  // Helper to format date in YYYY-MM-DD
  function formatDateISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get current reference date
  const now = new Date();
  const todayStr = formatDateISO(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Sample initial transactions for a realistic student experience
  const DEFAULT_EXPENSES = [
    {
      id: 'exp-1',
      title: 'Campus Canteen Lunch',
      amount: 6.50,
      category: 'Food',
      date: todayStr,
      paymentMethod: 'Campus Meal Card',
      notes: 'Grilled sandwich & iced tea'
    },
    {
      id: 'exp-2',
      title: 'Lab Notebook & Gel Pens',
      amount: 8.20,
      category: 'Academics',
      date: todayStr,
      paymentMethod: 'UPI / Online',
      notes: 'Chemistry lab manual'
    },
    {
      id: 'exp-3',
      title: 'Campus Metro Pass Top-up',
      amount: 15.00,
      category: 'Transport',
      date: formatDateISO(new Date(now.getTime() - 1 * 86400000)),
      paymentMethod: 'Debit Card',
      notes: 'Weekly commuter reload'
    },
    {
      id: 'exp-4',
      title: 'Hostel WiFi & Printing Share',
      amount: 22.00,
      category: 'Housing',
      date: formatDateISO(new Date(now.getTime() - 2 * 86400000)),
      paymentMethod: 'UPI / Online',
      notes: 'Monthly room contribution'
    },
    {
      id: 'exp-5',
      title: 'Spotify Student Subscription',
      amount: 5.99,
      category: 'Tech',
      date: formatDateISO(new Date(now.getTime() - 4 * 86400000)),
      paymentMethod: 'Credit Card',
      notes: 'Study playlist'
    },
    {
      id: 'exp-6',
      title: 'Dorm Groceries & Oats',
      amount: 28.40,
      category: 'Food',
      date: formatDateISO(new Date(now.getTime() - 5 * 86400000)),
      paymentMethod: 'Debit Card',
      notes: 'Milk, fruits, instant ramen'
    },
    {
      id: 'exp-7',
      title: 'Weekend Cinema with Dorm Mates',
      amount: 14.50,
      category: 'Entertainment',
      date: formatDateISO(new Date(now.getTime() - 6 * 86400000)),
      paymentMethod: 'UPI / Online',
      notes: 'Student discount ticket'
    },
    {
      id: 'exp-8',
      title: 'Shampoo & Laundry Detergent',
      amount: 11.20,
      category: 'Personal',
      date: formatDateISO(new Date(now.getTime() - 8 * 86400000)),
      paymentMethod: 'Cash',
      notes: 'Campus mart'
    },
    {
      id: 'exp-9',
      title: 'Algorithms Reference Book (Used)',
      amount: 32.00,
      category: 'Academics',
      date: formatDateISO(new Date(now.getTime() - 10 * 86400000)),
      paymentMethod: 'UPI / Online',
      notes: 'Senior year batch discount'
    },
    {
      id: 'exp-10',
      title: 'Late Night Coffee & Donuts',
      amount: 7.80,
      category: 'Food',
      date: formatDateISO(new Date(now.getTime() - 11 * 86400000)),
      paymentMethod: 'UPI / Online',
      notes: 'Study session at library'
    }
  ];

  const STUDENT_TIPS = [
    "Cooking meals 4 days a week saves an average of 35% compared to campus cafes!",
    "Always carry your student ID! Most museums, public transit, and software provide up to 50% discounts.",
    "Buy textbooks second-hand or borrow reserve copies from your campus library to save hundreds.",
    "Split streaming services and bulk grocery purchases with dorm mates to cut fixed costs in half.",
    "Use campus fitness centers and free recreational activities instead of expensive gym memberships."
  ];

  // State
  const state = {
    expenses: [],
    monthlyAllowance: 500,
    currency: '$',
    categoryBudgets: {},
    chartRange: 'month', // '7days' or 'month'
    currentSection: 'dashboard',
  };

  // Chart references
  let categoryChartInstance = null;
  let dailyChartInstance = null;

  // Initialize App
  function init() {
    loadState();
    setupTheme();
    setupNavigation();
    setupEventListeners();
    setupCategoryBudgetDefaults();
    
    // Set default date in Add Expense form to today
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
      dateInput.value = todayStr;
      dateInput.max = todayStr; // can't add future expenses
    }

    // Pick random student tip
    const tipEl = document.getElementById('dailyTipText');
    if (tipEl) {
      const randomTip = STUDENT_TIPS[Math.floor(Math.random() * STUDENT_TIPS.length)];
      tipEl.innerHTML = randomTip;
    }

    // Refresh UI & Charts
    renderAll();

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Load state from localStorage or seed
  function loadState() {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      state.expenses = storedExpenses ? JSON.parse(storedExpenses) : [...DEFAULT_EXPENSES];

      const storedAllowance = localStorage.getItem(STORAGE_KEYS.ALLOWANCE);
      state.monthlyAllowance = storedAllowance ? parseFloat(storedAllowance) : 500;

      const storedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      state.currency = storedCurrency || '$';

      const storedBudgets = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
      state.categoryBudgets = storedBudgets ? JSON.parse(storedBudgets) : {};
    } catch (e) {
      console.warn('LocalStorage error, using defaults', e);
      state.expenses = [...DEFAULT_EXPENSES];
      state.monthlyAllowance = 500;
      state.currency = '$';
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
      localStorage.setItem(STORAGE_KEYS.ALLOWANCE, state.monthlyAllowance.toString());
      localStorage.setItem(STORAGE_KEYS.CURRENCY, state.currency);
      localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(state.categoryBudgets));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }

  function setupCategoryBudgetDefaults() {
    for (const [cat, info] of Object.entries(CATEGORIES)) {
      if (!state.categoryBudgets[cat]) {
        state.categoryBudgets[cat] = info.defaultLimit;
      }
    }
  }

  // Theme Handling
  function setupTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    if (categoryChartInstance) updateCategoryChart();
    if (dailyChartInstance) updateDailyChart();
  }

  // Navigation Logic
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
      'dashboard': {
        el: document.getElementById('section-dashboard'),
        title: 'Dashboard Overview',
        subtitle: "Welcome back! Here's your real-time college budget summary and spending habits."
      },
      'add-expense': {
        el: document.getElementById('section-add-expense'),
        title: 'Add New Expense',
        subtitle: 'Log your campus spending quickly with preset shortcuts and tags.'
      },
      'expense-history': {
        el: document.getElementById('section-expense-history'),
        title: 'Expense History & Audit',
        subtitle: 'Filter, search, inspect, and export all historical transactions.'
      },
      'budget-planner': {
        el: document.getElementById('section-budget-planner'),
        title: 'Budget Planner & Target Health',
        subtitle: 'Plan monthly allowance, view category health, and save for goals.'
      }
    };

    function switchSection(targetKey) {
      if (!sections[targetKey]) return;

      state.currentSection = targetKey;

      // Update active nav button
      navItems.forEach(btn => {
        if (btn.dataset.section === targetKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Show/hide section containers
      Object.keys(sections).forEach(key => {
        if (key === targetKey) {
          sections[key].el.classList.remove('hidden');
        } else {
          sections[key].el.classList.add('hidden');
        }
      });

      // Update main title & subtitle
      const titleEl = document.getElementById('sectionTitle');
      const subtitleEl = document.getElementById('sectionSubtitle');
      if (titleEl) titleEl.textContent = sections[targetKey].title;
      if (subtitleEl) subtitleEl.textContent = sections[targetKey].subtitle;

      // Close mobile sidebar if open
      closeMobileSidebar();

      // Refresh section-specific widgets
      if (targetKey === 'dashboard') {
        setTimeout(() => {
          if (categoryChartInstance) categoryChartInstance.resize();
          if (dailyChartInstance) dailyChartInstance.resize();
        }, 50);
      } else if (targetKey === 'expense-history') {
        renderHistoryTable();
      } else if (targetKey === 'budget-planner') {
        renderBudgetPlanner();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        switchSection(sec);
      });
    });

    // Quick add top button
    const quickAddBtn = document.getElementById('quickAddExpenseTopBtn');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => switchSection('add-expense'));
    }

    // Nav-switch buttons inside views
    document.querySelectorAll('.nav-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        if (sec) switchSection(sec);
      });
    });
  }

  // Mobile Drawer
  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
  }

  function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (overlay) overlay.classList.remove('hidden');
  }

  // Event Listeners setup
  function setupEventListeners() {
    // Theme toggle buttons
    const themeBtn = document.getElementById('themeToggle');
    const themeBtnMobile = document.getElementById('themeToggleMobile');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', toggleTheme);

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Currency selector
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      currencySelect.value = state.currency;
      currencySelect.addEventListener('change', (e) => {
        state.currency = e.target.value;
        saveState();
        renderAll();
        showToast(`Currency updated to ${state.currency}`, 'info');
      });
    }

    // Reset Data Button
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (confirm('Reset to initial sample student expenses? All custom entries will be restored to defaults.')) {
          state.expenses = [...DEFAULT_EXPENSES];
          state.monthlyAllowance = 500;
          setupCategoryBudgetDefaults();
          saveState();
          renderAll();
          showToast('Sample data restored successfully!', 'success');
        }
      });
    }

    // Add Expense Form submit
    const addForm = document.getElementById('addExpenseForm');
    if (addForm) {
      addForm.addEventListener('submit', handleAddExpenseSubmit);
    }

    // Quick presets buttons
    document.querySelectorAll('.quick-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        const amount = btn.dataset.amount;
        const category = btn.dataset.category;

        const titleInput = document.getElementById('expenseTitle');
        const amountInput = document.getElementById('expenseAmount');
        const catRadio = document.querySelector(`input[name="categoryRadio"][value="${category}"]`);

        if (titleInput) titleInput.value = title;
        if (amountInput) amountInput.value = amount;
        if (catRadio) catRadio.checked = true;

        showToast(`Selected shortcut: ${title} (${state.currency}${amount})`, 'info');
      });
    });

    // Allowance editing modal
    const editAllowanceBtn = document.getElementById('editAllowanceBtn');
    const allowanceModal = document.getElementById('allowanceModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmAllowanceBtn = document.getElementById('confirmAllowanceBtn');
    const modalAllowanceInput = document.getElementById('modalAllowanceInput');

    if (editAllowanceBtn && allowanceModal) {
      editAllowanceBtn.addEventListener('click', () => {
        modalAllowanceInput.value = state.monthlyAllowance;
        allowanceModal.classList.remove('hidden');
      });
    }

    function closeModal() {
      if (allowanceModal) allowanceModal.classList.add('hidden');
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (confirmAllowanceBtn && modalAllowanceInput) {
      confirmAllowanceBtn.addEventListener('click', () => {
        const val = parseFloat(modalAllowanceInput.value);
        if (val && val > 0) {
          state.monthlyAllowance = val;
          saveState();
          closeModal();
          renderAll();
          showToast(`Monthly allowance updated to ${state.currency}${val.toFixed(2)}`, 'success');
        } else {
          alert('Please enter a valid positive allowance amount.');
        }
      });
    }

    // Budget Planner allowance input & button
    const saveAllowanceBtn = document.getElementById('saveAllowanceBtn');
    const monthlyAllowanceInput = document.getElementById('monthlyAllowanceInput');
    if (saveAllowanceBtn && monthlyAllowanceInput) {
      saveAllowanceBtn.addEventListener('click', () => {
        const val = parseFloat(monthlyAllowanceInput.value);
        if (val && val > 0) {
          state.monthlyAllowance = val;
          saveState();
          renderAll();
          showToast(`Monthly allowance set to ${state.currency}${val.toFixed(2)}`, 'success');
        }
      });
    }

    // Expense History filters
    const searchInput = document.getElementById('historySearchInput');
    const catFilter = document.getElementById('historyCategoryFilter');
    const sortBy = document.getElementById('historySortBy');

    if (searchInput) searchInput.addEventListener('input', renderHistoryTable);
    if (catFilter) catFilter.addEventListener('change', renderHistoryTable);
    if (sortBy) sortBy.addEventListener('change', renderHistoryTable);

    // Export to CSV
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportExpensesToCSV);
    }

    // Daily Chart Range toggles
    const view7DaysBtn = document.getElementById('viewLast7DaysBtn');
    const viewThisMonthDaysBtn = document.getElementById('viewThisMonthDaysBtn');

    if (view7DaysBtn && viewThisMonthDaysBtn) {
      view7DaysBtn.addEventListener('click', () => {
        state.chartRange = '7days';
        view7DaysBtn.classList.add('bg-white', 'dark:bg-slate-700', 'text-brand-600', 'dark:text-brand-300', 'shadow-xs');
        view7DaysBtn.classList.remove('text-slate-600', 'dark:text-slate-300');
        viewThisMonthDaysBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-brand-600', 'dark:text-brand-300', 'shadow-xs');
        viewThisMonthDaysBtn.classList.add('text-slate-600', 'dark:text-slate-300');
        updateDailyChart();
      });

      viewThisMonthDaysBtn.addEventListener('click', () => {
        state.chartRange = 'month';
        viewThisMonthDaysBtn.classList.add('bg-white', 'dark:bg-slate-700', 'text-brand-600', 'dark:text-brand-300', 'shadow-xs');
        viewThisMonthDaysBtn.classList.remove('text-slate-600', 'dark:text-slate-300');
        view7DaysBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-brand-600', 'dark:text-brand-300', 'shadow-xs');
        view7DaysBtn.classList.add('text-slate-600', 'dark:text-slate-300');
        updateDailyChart();
      });
    }
  }

  // Handle Form Submission for Adding Expense
  function handleAddExpenseSubmit(e) {
    e.preventDefault();

    const amountInput = document.getElementById('expenseAmount');
    const titleInput = document.getElementById('expenseTitle');
    const dateInput = document.getElementById('expenseDate');
    const methodSelect = document.getElementById('expensePaymentMethod');
    const notesInput = document.getElementById('expenseNotes');
    const catChecked = document.querySelector('input[name="categoryRadio"]:checked');

    const amount = parseFloat(amountInput.value);
    const title = titleInput.value.trim();
    const date = dateInput.value || todayStr;
    const category = catChecked ? catChecked.value : 'Other';
    const paymentMethod = methodSelect.value || 'UPI / Online';
    const notes = notesInput.value.trim();

    if (!amount || amount <= 0 || !title) {
      showToast('Please enter a valid amount and title', 'error');
      return;
    }

    const newExpense = {
      id: 'exp-' + Date.now(),
      title,
      amount,
      category,
      date,
      paymentMethod,
      notes
    };

    // Add to state at beginning
    state.expenses.unshift(newExpense);
    saveState();

    // Trigger confetti celebration
    if (window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    // Reset form
    amountInput.value = '';
    titleInput.value = '';
    notesInput.value = '';
    dateInput.value = todayStr;

    showToast(`Logged "${title}" (${state.currency}${amount.toFixed(2)})!`, 'success');

    // Update entire UI
    renderAll();

    // Switch back to dashboard to see results
    const dashBtn = document.querySelector('.nav-item[data-section="dashboard"]');
    if (dashBtn) dashBtn.click();
  }

  // Delete an expense
  function deleteExpense(id) {
    const item = state.expenses.find(e => e.id === id);
    if (!item) return;

    if (confirm(`Delete "${item.title}" (${state.currency}${item.amount.toFixed(2)})?`)) {
      state.expenses = state.expenses.filter(e => e.id !== id);
      saveState();
      renderAll();
      showToast('Expense removed', 'info');
    }
  }

  // Calculations
  function calculateMetrics() {
    let spentToday = 0;
    let spentTodayCount = 0;
    let spentMonth = 0;
    let categoryTotals = {};

    Object.keys(CATEGORIES).forEach(k => {
      categoryTotals[k] = 0;
    });

    state.expenses.forEach(exp => {
      const expDate = new Date(exp.date + 'T00:00:00');
      const isToday = exp.date === todayStr;
      const isThisMonth = expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;

      if (isToday) {
        spentToday += exp.amount;
        spentTodayCount++;
      }

      if (isThisMonth) {
        spentMonth += exp.amount;
        if (categoryTotals[exp.category] !== undefined) {
          categoryTotals[exp.category] += exp.amount;
        } else {
          categoryTotals['Other'] += exp.amount;
        }
      }
    });

    const monthlyAllowance = state.monthlyAllowance;
    const remainingBudget = monthlyAllowance - spentMonth;
    const pctUsed = monthlyAllowance > 0 ? (spentMonth / monthlyAllowance) * 100 : 0;

    // Remaining days calculation
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);
    const safeDailyPace = remainingBudget > 0 ? remainingBudget / daysRemaining : 0;

    return {
      spentToday,
      spentTodayCount,
      spentMonth,
      monthlyAllowance,
      remainingBudget,
      pctUsed,
      categoryTotals,
      daysRemaining,
      safeDailyPace
    };
  }

  // Render All Components
  function renderAll() {
    renderCurrencySymbols();
    renderDashboardMetrics();
    renderRecentTransactions();
    updateCategoryChart();
    updateDailyChart();
    renderHistoryTable();
    renderBudgetPlanner();
  }

  // Update Currency Prefixes in inputs and badges
  function renderCurrencySymbols() {
    const cur = state.currency;

    const ids = [
      'formCurrencyPrefix',
      'plannerCurrencyPrefix',
      'modalCurrencyPrefix'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = cur;
    });

    // Update preset labels
    document.querySelectorAll('.preset-amount-label').forEach(label => {
      const parent = label.closest('.quick-preset-btn');
      if (parent) {
        const amt = parent.dataset.amount;
        label.textContent = `${cur}${parseFloat(amt).toFixed(2)}`;
      }
    });

    // Update current month badge
    const monthBadge = document.getElementById('currentMonthBadge');
    if (monthBadge) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthBadge.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
  }

  // Render Dashboard Top Metric Cards
  function renderDashboardMetrics() {
    const metrics = calculateMetrics();
    const cur = state.currency;

    // 1. Spent Today
    const spentTodayEl = document.getElementById('spentTodayAmount');
    const spentTodayCountEl = document.getElementById('spentTodayCount');
    if (spentTodayEl) spentTodayEl.textContent = `${cur}${metrics.spentToday.toFixed(2)}`;
    if (spentTodayCountEl) {
      spentTodayCountEl.textContent = `${metrics.spentTodayCount} transaction${metrics.spentTodayCount === 1 ? '' : 's'} today`;
    }

    // 2. Spent This Month
    const spentMonthEl = document.getElementById('spentMonthAmount');
    const spentMonthPctBadge = document.getElementById('spentMonthPctBadge');
    if (spentMonthEl) spentMonthEl.textContent = `${cur}${metrics.spentMonth.toFixed(2)}`;
    if (spentMonthPctBadge) {
      spentMonthPctBadge.textContent = `${Math.round(metrics.pctUsed)}%`;
      if (metrics.pctUsed > 100) {
        spentMonthPctBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300';
      } else if (metrics.pctUsed > 80) {
        spentMonthPctBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300';
      } else {
        spentMonthPctBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      }
    }

    // 3. Monthly Allowance
    const allowanceEl = document.getElementById('monthlyAllowanceAmount');
    if (allowanceEl) allowanceEl.textContent = `${cur}${metrics.monthlyAllowance.toFixed(2)}`;

    // 4. Remaining Budget
    const remainingBudgetEl = document.getElementById('remainingBudgetAmount');
    const dailyPaceText = document.getElementById('dailyPaceText');
    const remainingIconWrap = document.getElementById('remainingBudgetIconWrap');

    if (remainingBudgetEl) {
      if (metrics.remainingBudget >= 0) {
        remainingBudgetEl.textContent = `${cur}${metrics.remainingBudget.toFixed(2)}`;
        remainingBudgetEl.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight';
        if (remainingIconWrap) {
          remainingIconWrap.className = 'w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center';
        }
      } else {
        remainingBudgetEl.textContent = `-${cur}${Math.abs(metrics.remainingBudget).toFixed(2)}`;
        remainingBudgetEl.className = 'text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight';
        if (remainingIconWrap) {
          remainingIconWrap.className = 'w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center';
        }
      }
    }

    if (dailyPaceText) {
      if (metrics.remainingBudget >= 0) {
        dailyPaceText.textContent = `Safe pace: ${cur}${metrics.safeDailyPace.toFixed(2)}/day left`;
      } else {
        dailyPaceText.textContent = `Over budget! Cut discretionary spend`;
      }
    }

    // Progress bar & velocity
    const progressBar = document.getElementById('budgetProgressBar');
    const progressLabel = document.getElementById('budgetProgressLabel');
    const daysLeftLabel = document.getElementById('daysLeftLabel');
    const budgetStatusBadge = document.getElementById('budgetStatusBadge');
    const budgetAlertPill = document.getElementById('budgetAlertPill');

    const cappedWidth = Math.min(100, Math.max(0, metrics.pctUsed));
    if (progressBar) {
      progressBar.style.width = `${cappedWidth}%`;
      if (metrics.pctUsed >= 100) {
        progressBar.className = 'bg-rose-500 h-full rounded-full transition-all duration-500';
      } else if (metrics.pctUsed >= 80) {
        progressBar.className = 'bg-amber-500 h-full rounded-full transition-all duration-500';
      } else {
        progressBar.className = 'bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500';
      }
    }

    if (progressLabel) progressLabel.textContent = `${Math.round(metrics.pctUsed)}% used`;
    if (daysLeftLabel) daysLeftLabel.textContent = `${metrics.daysRemaining} days remaining`;

    if (budgetStatusBadge) {
      if (metrics.pctUsed >= 100) {
        budgetStatusBadge.textContent = 'Exceeded';
        budgetStatusBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
        if (budgetAlertPill) budgetAlertPill.classList.remove('hidden');
      } else if (metrics.pctUsed >= 80) {
        budgetStatusBadge.textContent = 'Warning';
        budgetStatusBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        if (budgetAlertPill) budgetAlertPill.classList.remove('hidden');
      } else {
        budgetStatusBadge.textContent = 'On Track';
        budgetStatusBadge.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        if (budgetAlertPill) budgetAlertPill.classList.add('hidden');
      }
    }

    // History count badge in sidebar
    const historyBadge = document.getElementById('historyCountBadge');
    if (historyBadge) historyBadge.textContent = state.expenses.length;
  }

  // Render Recent Transactions (Last 4)
  function renderRecentTransactions() {
    const listEl = document.getElementById('recentTransactionsList');
    if (!listEl) return;

    const cur = state.currency;
    const recents = state.expenses.slice(0, 4);

    if (recents.length === 0) {
      listEl.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-400">
          No transactions yet. Click "+ Add Expense" to record your first student spend!
        </div>
      `;
      return;
    }

    listEl.innerHTML = recents.map(item => {
      const catInfo = CATEGORIES[item.category] || CATEGORIES.Other;
      const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="py-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              ${catInfo.icon}
            </div>
            <div>
              <h5 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">${escapeHtml(item.title)}</h5>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>${formattedDate}</span>
                <span>&bull;</span>
                <span class="badge-category badge-cat-${item.category}">${catInfo.icon} ${item.category}</span>
                ${item.notes ? `<span class="hidden sm:inline text-slate-400 italic font-normal">&mdash; "${escapeHtml(item.notes)}"</span>` : ''}
              </div>
            </div>
          </div>
          <div class="text-right">
            <span class="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">-${cur}${item.amount.toFixed(2)}</span>
            <span class="text-[10px] block text-slate-400">${escapeHtml(item.paymentMethod)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Category Doughnut Chart (Chart.js)
  function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const metrics = calculateMetrics();
    const cur = state.currency;
    const isDark = document.documentElement.classList.contains('dark');

    const labels = Object.keys(CATEGORIES);
    const dataValues = labels.map(l => metrics.categoryTotals[l] || 0);
    const backgroundColors = labels.map(l => isDark ? CATEGORIES[l].darkColor : CATEGORIES[l].color);

    // Find top category
    let topCat = 'None';
    let topAmount = 0;
    labels.forEach(l => {
      const amt = metrics.categoryTotals[l] || 0;
      if (amt > topAmount) {
        topAmount = amt;
        topCat = l;
      }
    });

    const topCategoryNameEl = document.getElementById('topCategoryName');
    const topCategoryAmountEl = document.getElementById('topCategoryAmount');
    if (topCategoryNameEl) topCategoryNameEl.textContent = topCat;
    if (topCategoryAmountEl) topCategoryAmountEl.textContent = `${cur}${topAmount.toFixed(2)}`;

    // Build custom mini legend list
    const legendEl = document.getElementById('categoryLegendList');
    if (legendEl) {
      const activeCats = labels
        .map(l => ({ name: l, amount: metrics.categoryTotals[l] || 0, icon: CATEGORIES[l].icon, color: CATEGORIES[l].color }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      legendEl.innerHTML = activeCats.map(c => `
        <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          <div class="flex items-center gap-1.5 overflow-hidden">
            <span class="text-xs">${c.icon}</span>
            <span class="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">${c.name}</span>
          </div>
          <span class="text-[11px] font-bold text-slate-900 dark:text-white shrink-0">${cur}${c.amount.toFixed(1)}</span>
        </div>
      `).join('');
    }

    if (categoryChartInstance) {
      categoryChartInstance.data.labels = labels;
      categoryChartInstance.data.datasets[0].data = dataValues;
      categoryChartInstance.data.datasets[0].backgroundColor = backgroundColors;
      categoryChartInstance.update();
      return;
    }

    categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: isDark ? 2 : 2,
          borderColor: isDark ? '#0f172a' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            callbacks: {
              label: function (ctx) {
                const label = ctx.label || '';
                const val = ctx.parsed || 0;
                return ` ${label}: ${cur}${val.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  // Daily Spending Chart (Area / Smooth Line)
  function updateDailyChart() {
    const canvas = document.getElementById('dailySpendingChart');
    if (!canvas) return;

    const cur = state.currency;
    const isDark = document.documentElement.classList.contains('dark');

    // Aggregate daily totals
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let numDaysToShow = state.chartRange === '7days' ? 7 : Math.min(now.getDate(), daysInMonth);
    
    // Create day buckets
    const labels = [];
    const spendPerDay = [];
    let sumTotal = 0;

    if (state.chartRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const iso = formatDateISO(d);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        labels.push(dayLabel);

        const totalOnDay = state.expenses
          .filter(e => e.date === iso)
          .reduce((acc, e) => acc + e.amount, 0);

        spendPerDay.push(totalOnDay);
        sumTotal += totalOnDay;
      }
    } else {
      // Current month up to today
      const maxDay = now.getDate();
      for (let day = 1; day <= maxDay; day++) {
        const d = new Date(currentYear, currentMonth, day);
        const iso = formatDateISO(d);
        labels.push(`${day}`);

        const totalOnDay = state.expenses
          .filter(e => e.date === iso)
          .reduce((acc, e) => acc + e.amount, 0);

        spendPerDay.push(totalOnDay);
        sumTotal += totalOnDay;
      }
    }

    const avgSpend = spendPerDay.length > 0 ? (sumTotal / spendPerDay.length) : 0;
    const benchmarkEl = document.getElementById('dailyAvgBenchmark');
    if (benchmarkEl) {
      benchmarkEl.textContent = `Daily Average: ${cur}${avgSpend.toFixed(2)}/day`;
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    if (isDark) {
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    }

    if (dailyChartInstance) {
      dailyChartInstance.data.labels = labels;
      dailyChartInstance.data.datasets[0].data = spendPerDay;
      dailyChartInstance.data.datasets[0].backgroundColor = gradient;
      dailyChartInstance.data.datasets[0].borderColor = '#6366f1';
      dailyChartInstance.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
      dailyChartInstance.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
      dailyChartInstance.options.scales.x.grid.color = isDark ? '#1e293b' : '#f1f5f9';
      dailyChartInstance.options.scales.y.grid.color = isDark ? '#1e293b' : '#f1f5f9';
      dailyChartInstance.update();
      return;
    }

    dailyChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Spend',
          data: spendPerDay,
          borderColor: '#6366f1',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          backgroundColor: gradient,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: spendPerDay.length > 15 ? 2.5 : 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (ctx) {
                return ` Spent: ${cur}${ctx.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: isDark ? '#1e293b' : '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: {
                family: '"Plus Jakarta Sans", sans-serif',
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: isDark ? '#1e293b' : '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: {
                family: '"Plus Jakarta Sans", sans-serif',
                size: 11
              },
              callback: function (val) {
                return cur + val;
              }
            }
          }
        }
      }
    });
  }

  // Render Expense History Table
  function renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('historyEmptyState');
    const countEl = document.getElementById('filteredResultsCount');
    const sumEl = document.getElementById('filteredTotalSum');
    if (!tableBody) return;

    const cur = state.currency;
    const searchVal = (document.getElementById('historySearchInput')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('historyCategoryFilter')?.value || 'ALL';
    const sortVal = document.getElementById('historySortBy')?.value || 'date-desc';

    let filtered = state.expenses.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchVal) ||
        (item.notes && item.notes.toLowerCase().includes(searchVal)) ||
        item.category.toLowerCase().includes(searchVal) ||
        item.paymentMethod.toLowerCase().includes(searchVal);

      const matchesCat = catVal === 'ALL' || item.category === catVal;
      return matchesSearch && matchesCat;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortVal === 'amount-desc') return b.amount - a.amount;
      if (sortVal === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    const totalSum = filtered.reduce((acc, cur) => acc + cur.amount, 0);

    if (countEl) countEl.textContent = `Showing ${filtered.length} transaction${filtered.length === 1 ? '' : 's'}`;
    if (sumEl) sumEl.textContent = `Total: ${cur}${totalSum.toFixed(2)}`;

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tableBody.innerHTML = filtered.map(item => {
      const catInfo = CATEGORIES[item.category] || CATEGORIES.Other;
      const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
          <td class="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
            ${formattedDate}
          </td>
          <td class="px-4 py-3">
            <span class="font-bold text-slate-900 dark:text-white block">${escapeHtml(item.title)}</span>
            ${item.notes ? `<span class="text-[11px] text-slate-400 block">${escapeHtml(item.notes)}</span>` : ''}
          </td>
          <td class="px-4 py-3 whitespace-nowrap">
            <span class="badge-category badge-cat-${item.category}">
              ${catInfo.icon} ${item.category}
            </span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
            <span class="inline-flex items-center gap-1">
              <i data-lucide="credit-card" class="w-3.5 h-3.5 text-slate-400"></i>
              ${escapeHtml(item.paymentMethod)}
            </span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-right font-extrabold text-slate-900 dark:text-white">
            ${cur}${item.amount.toFixed(2)}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-center">
            <button class="delete-expense-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors" data-id="${item.id}" title="Delete expense">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach delete listeners
    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        if (id) deleteExpense(id);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render Budget Planner Section
  function renderBudgetPlanner() {
    const allowanceInput = document.getElementById('monthlyAllowanceInput');
    if (allowanceInput) allowanceInput.value = state.monthlyAllowance;

    const cur = state.currency;
    const allowance = state.monthlyAllowance;
    const metrics = calculateMetrics();

    // 50/30/20 student breakdown
    const needs = allowance * 0.50;
    const wants = allowance * 0.30;
    const savings = allowance * 0.20;

    const needsEl = document.getElementById('ruleNeedsAmount');
    const wantsEl = document.getElementById('ruleWantsAmount');
    const savingsEl = document.getElementById('ruleSavingsAmount');
    if (needsEl) needsEl.textContent = `${cur}${needs.toFixed(2)}`;
    if (wantsEl) wantsEl.textContent = `${cur}${wants.toFixed(2)}`;
    if (savingsEl) savingsEl.textContent = `${cur}${savings.toFixed(2)}`;

    // Savings Milestone
    const milestonePaceEl = document.getElementById('milestoneTargetPace');
    const projectedSavingsEl = document.getElementById('projectedSavingsAmount');
    if (milestonePaceEl) milestonePaceEl.textContent = `${cur}${metrics.safeDailyPace.toFixed(2)}/day`;
    if (projectedSavingsEl) {
      const projected = Math.max(0, metrics.remainingBudget);
      projectedSavingsEl.textContent = `${cur}${projected.toFixed(2)}`;
    }

    // Render Category Budget Cards
    const cardsContainer = document.getElementById('categoryBudgetCards');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = Object.entries(CATEGORIES).map(([cat, info]) => {
      const cap = state.categoryBudgets[cat] || info.defaultLimit;
      const spent = metrics.categoryTotals[cat] || 0;
      const pct = cap > 0 ? (spent / cap) * 100 : 0;
      const remaining = cap - spent;

      let statusBadge = '';
      let progressColor = 'bg-brand-500';

      if (pct >= 100) {
        statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Over Budget</span>`;
        progressColor = 'bg-rose-500';
      } else if (pct >= 80) {
        statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Near Cap</span>`;
        progressColor = 'bg-amber-500';
      } else {
        statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Healthy</span>`;
        progressColor = 'bg-emerald-500';
      }

      return `
        <div class="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">${info.icon}</span>
              <div>
                <h5 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">${cat}</h5>
                <span class="text-[11px] text-slate-400">Limit: ${cur}${cap.toFixed(0)}</span>
              </div>
            </div>
            ${statusBadge}
          </div>

          <div class="mt-2">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-bold text-slate-900 dark:text-white">${cur}${spent.toFixed(2)} spent</span>
              <span class="text-slate-400">${remaining >= 0 ? `${cur}${remaining.toFixed(2)} left` : `Exceeded by ${cur}${Math.abs(remaining).toFixed(2)}`}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="${progressColor} h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(0, pct))}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Export Expenses to CSV
  function exportExpensesToCSV() {
    if (state.expenses.length === 0) {
      showToast('No expenses available to export!', 'error');
      return;
    }

    const headers = ['Date', 'Title', 'Category', 'PaymentMethod', 'Amount', 'Notes'];
    const rows = state.expenses.map(e => [
      `"${e.date}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.paymentMethod}"`,
      e.amount.toFixed(2),
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduspend_expenses_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported expenses to CSV!', 'success');
  }

  // Toast Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
      type === 'success'
        ? 'bg-emerald-600 text-white border-emerald-500'
        : type === 'error'
        ? 'bg-rose-600 text-white border-rose-500'
        : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-800'
    }`;

    let iconHtml = '<i data-lucide="info" class="w-4 h-4"></i>';
    if (type === 'success') iconHtml = '<i data-lucide="check-circle" class="w-4 h-4"></i>';
    if (type === 'error') iconHtml = '<i data-lucide="alert-circle" class="w-4 h-4"></i>';

    toast.innerHTML = `
      ${iconHtml}
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // XSS prevention escape helper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Kickstart on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
