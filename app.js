/**
 * EduSpend — Smart Student Expense & Budget Dashboard
 * Full-Stack Client Architecture with Supabase Integration
 */

(function () {
  'use strict';

  // Constants & Local Storage Keys
  const STORAGE_KEYS = {
    EXPENSES: 'eduspend_expenses',
    ALLOWANCE: 'eduspend_allowance',
    CURRENCY: 'eduspend_currency',
    THEME: 'eduspend_theme',
    CATEGORY_BUDGETS: 'eduspend_category_budgets',
    GUEST_SESSION: 'eduspend_guest_mode',
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
  const currentMonth = now.getMonth();

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

  // Supabase Client Initialization
  const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) || 'https://rzsceanhmmrkevyzbqba.supabase.co';
  const SUPABASE_ANON_KEY = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || 'sb_publishable_Io3nYD8s_3rLReuCT6wv2Q_NYXy9dB6';

  let supabase = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.warn('Supabase initialization notice:', err);
    }
  }

  // Application State
  const state = {
    expenses: [],
    monthlyAllowance: 500,
    currency: '$',
    categoryBudgets: {},
    chartRange: 'month',
    currentSection: 'dashboard',
    user: null,
    authTab: 'signin', // 'signin' | 'signup' | 'reset'
    isCloudSynced: false,
    hasCheckedExpensesTable: false,
    useExpensesTable: true,
  };

  // Chart instances
  let categoryChartInstance = null;
  let dailyChartInstance = null;

  // Initialize App
  async function init() {
    loadLocalState();
    setupTheme();
    setupNavigation();
    setupEventListeners();
    setupCategoryBudgetDefaults();
    setupAuthListeners();

    // Set default date in Add Expense form to today
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
      dateInput.value = todayStr;
      dateInput.max = todayStr;
    }

    // Pick random student tip
    const tipEl = document.getElementById('dailyTipText');
    if (tipEl) {
      const randomTip = STUDENT_TIPS[Math.floor(Math.random() * STUDENT_TIPS.length)];
      tipEl.innerHTML = randomTip;
    }

    // Refresh UI & Charts
    renderAll();

    // Check Supabase Auth Session
    await checkInitialSession();

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================
  // SUPABASE AUTHENTICATION & SESSION
  // ==========================================

  async function checkInitialSession() {
    if (!supabase) {
      updateAuthUI(null);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Session check warning:', error.message);
        updateAuthUI(null);
        return;
      }

      if (session && session.user) {
        state.user = session.user;
        updateAuthUI(session.user);
        await loadCloudData();
      } else {
        updateAuthUI(null);
      }
    } catch (e) {
      console.warn('Auth check catch:', e);
      updateAuthUI(null);
    }

    // Listen to Auth State Changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        state.user = session.user;
        updateAuthUI(session.user);
        if (event === 'SIGNED_IN') {
          showToast(`Welcome back, ${getUserDisplayName(session.user)}!`, 'success');
          await loadCloudData();
        }
      } else {
        state.user = null;
        updateAuthUI(null);
        if (event === 'SIGNED_OUT') {
          loadLocalState();
          renderAll();
          showToast('Signed out. Local guest mode active.', 'info');
        }
      }
    });
  }

  function getUserDisplayName(user) {
    if (!user) return 'Guest Student';
    if (user.user_metadata && user.user_metadata.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.email) {
      const namePart = user.email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Student User';
  }

  function getUserInitials(name) {
    if (!name) return 'GS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function updateAuthUI(user) {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const userAvatarInitials = document.getElementById('userAvatarInitials');
    const sidebarAuthText = document.getElementById('sidebarAuthText');
    const sidebarAuthIcon = document.getElementById('sidebarAuthIcon');
    const authTriggerText = document.getElementById('authTriggerText');
    const cloudStatusDot = document.getElementById('cloudStatusDot');
    const cloudStatusText = document.getElementById('cloudStatusText');
    const mobileCloudText = document.getElementById('mobileCloudText');
    const storageModeDot = document.getElementById('storageModeDot');
    const storageModeText = document.getElementById('storageModeText');
    const modalStorageState = document.getElementById('modalStorageState');
    const modalStorageDetails = document.getElementById('modalStorageDetails');

    if (user) {
      state.isCloudSynced = true;
      const displayName = getUserDisplayName(user);
      const initials = getUserInitials(displayName);

      if (userNameDisplay) userNameDisplay.textContent = displayName;
      if (userEmailDisplay) userEmailDisplay.textContent = user.email || 'Cloud Account';
      if (userAvatarInitials) userAvatarInitials.textContent = initials;

      if (sidebarAuthText) sidebarAuthText.textContent = 'Sign Out';
      if (authTriggerText) authTriggerText.textContent = 'Sign Out';

      if (cloudStatusDot) {
        cloudStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 pulse-emerald';
      }
      if (cloudStatusText) cloudStatusText.textContent = 'Cloud Connected';
      if (mobileCloudText) mobileCloudText.textContent = 'Synced';

      if (storageModeDot) storageModeDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
      if (storageModeText) storageModeText.textContent = 'Supabase Cloud';

      if (modalStorageState) {
        modalStorageState.textContent = 'Supabase Cloud (Active)';
        modalStorageState.className = 'font-bold text-emerald-600 dark:text-emerald-400';
      }
      if (modalStorageDetails) {
        modalStorageDetails.textContent = `Signed in as ${user.email}. All records secured with PostgreSQL Row Level Security (RLS).`;
      }
    } else {
      state.isCloudSynced = false;
      if (userNameDisplay) userNameDisplay.textContent = 'Guest Student';
      if (userEmailDisplay) userEmailDisplay.textContent = 'Local Mode';
      if (userAvatarInitials) userAvatarInitials.textContent = 'GS';

      if (sidebarAuthText) sidebarAuthText.textContent = 'Sign In';
      if (authTriggerText) authTriggerText.textContent = 'Sign In';

      if (cloudStatusDot) {
        cloudStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500';
      }
      if (cloudStatusText) cloudStatusText.textContent = 'Guest Mode';
      if (mobileCloudText) mobileCloudText.textContent = 'Local';

      if (storageModeDot) storageModeDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
      if (storageModeText) storageModeText.textContent = 'Local Storage';

      if (modalStorageState) {
        modalStorageState.textContent = 'Local Storage (Guest)';
        modalStorageState.className = 'font-bold text-amber-600 dark:text-amber-400';
      }
      if (modalStorageDetails) {
        modalStorageDetails.textContent = 'Running in offline guest mode. Sign in to automatically sync your budget with PostgreSQL.';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // SUPABASE CLOUD DATA OPERATIONS
  // ==========================================

  async function loadCloudData() {
    if (!supabase || !state.user) return;

    try {
      // 1. Fetch Profile info (currency, allowance, category budgets)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .maybeSingle();

      if (!profileErr && profile) {
        if (profile.currency) state.currency = profile.currency;
        if (profile.monthly_allowance) state.monthlyAllowance = parseFloat(profile.monthly_allowance);
        if (profile.category_budgets) {
          state.categoryBudgets = { ...state.categoryBudgets, ...profile.category_budgets };
        }
      } else if (!profile) {
        // Create initial profile record if trigger didn't run
        await supabase.from('profiles').insert([{
          id: state.user.id,
          email: state.user.email,
          full_name: getUserDisplayName(state.user),
          currency: state.currency,
          monthly_allowance: state.monthlyAllowance,
          category_budgets: state.categoryBudgets
        }]);
      }

      // 2. Fetch Expenses from 'expenses' table
      const { data: expensesData, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', state.user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!expErr && expensesData) {
        state.useExpensesTable = true;
        if (expensesData.length > 0) {
          state.expenses = expensesData.map(e => ({
            id: e.id,
            title: e.title,
            amount: parseFloat(e.amount),
            category: e.category,
            date: e.date,
            paymentMethod: e.payment_method || 'UPI / Online',
            notes: e.notes || ''
          }));
        } else {
          // New cloud user: offer to migrate current local sample/expenses or keep clean
          if (state.expenses.length > 0) {
            console.log('User has local expenses, ready for sync');
          }
        }
      } else if (expErr) {
        console.warn('Expenses table fetch note:', expErr.message);
        // If table doesn't exist yet, we keep local state and flag
        state.useExpensesTable = false;
      }

      saveLocalState();
      renderAll();
    } catch (e) {
      console.warn('Error loading cloud data, keeping local cache:', e);
    }
  }

  async function cloudInsertExpense(expense) {
    if (!supabase || !state.user || !state.useExpensesTable) return false;

    try {
      const payload = {
        user_id: state.user.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        payment_method: expense.paymentMethod,
        notes: expense.notes || ''
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Cloud insert error:', error.message);
        return false;
      }

      if (data && data.id) {
        expense.id = data.id; // Map returned UUID
      }
      return true;
    } catch (e) {
      console.warn('Cloud insert catch:', e);
      return false;
    }
  }

  async function cloudDeleteExpense(id) {
    if (!supabase || !state.user || !state.useExpensesTable) return false;

    try {
      // Check if id is a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) return false;

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);

      if (error) {
        console.warn('Cloud delete error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Cloud delete catch:', e);
      return false;
    }
  }

  async function cloudUpdateProfile(fields) {
    if (!supabase || !state.user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          ...fields,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);
    } catch (e) {
      console.warn('Cloud profile update notice:', e);
    }
  }

  async function migrateLocalExpensesToCloud() {
    if (!supabase || !state.user) {
      showToast('Please sign in first to sync to Supabase!', 'error');
      openAuthModal('signin');
      return;
    }

    if (state.expenses.length === 0) {
      showToast('No local expenses to sync.', 'info');
      return;
    }

    try {
      showToast('Syncing local expenses to cloud...', 'info');

      const payloads = state.expenses.map(e => ({
        user_id: state.user.id,
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
        payment_method: e.paymentMethod || 'UPI / Online',
        notes: e.notes || ''
      }));

      const { error } = await supabase.from('expenses').insert(payloads);

      if (error) {
        showToast(`Sync error: ${error.message}`, 'error');
        return;
      }

      showToast(`Synced ${payloads.length} expenses to Supabase cloud!`, 'success');
      await loadCloudData();
    } catch (e) {
      showToast('Failed to sync: ' + e.message, 'error');
    }
  }

  // ==========================================
  // LOCAL STATE MANAGEMENT (OFFLINE RESILIENCE)
  // ==========================================

  function loadLocalState() {
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
      console.warn('LocalStorage notice:', e);
      state.expenses = [...DEFAULT_EXPENSES];
      state.monthlyAllowance = 500;
      state.currency = '$';
    }
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
      localStorage.setItem(STORAGE_KEYS.ALLOWANCE, state.monthlyAllowance.toString());
      localStorage.setItem(STORAGE_KEYS.CURRENCY, state.currency);
      localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(state.categoryBudgets));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  function setupCategoryBudgetDefaults() {
    for (const [cat, info] of Object.entries(CATEGORIES)) {
      if (!state.categoryBudgets[cat]) {
        state.categoryBudgets[cat] = info.defaultLimit;
      }
    }
  }

  // ==========================================
  // THEME & NAVIGATION
  // ==========================================

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

      navItems.forEach(btn => {
        if (btn.dataset.section === targetKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      Object.keys(sections).forEach(key => {
        if (key === targetKey) {
          sections[key].el.classList.remove('hidden');
        } else {
          sections[key].el.classList.add('hidden');
        }
      });

      const titleEl = document.getElementById('sectionTitle');
      const subtitleEl = document.getElementById('sectionSubtitle');
      if (titleEl) titleEl.textContent = sections[targetKey].title;
      if (subtitleEl) subtitleEl.textContent = sections[targetKey].subtitle;

      closeMobileSidebar();

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
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    const quickAddBtn = document.getElementById('quickAddExpenseTopBtn');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => switchSection('add-expense'));
    }

    document.querySelectorAll('.nav-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        if (sec) switchSection(sec);
      });
    });
  }

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

  // ==========================================
  // AUTH MODAL & EVENT LISTENERS
  // ==========================================

  function openAuthModal(tab = 'signin') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    setAuthTab(tab);
    modal.classList.remove('hidden');
  }

  function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
    clearAuthAlert();
  }

  function setAuthTab(tab) {
    state.authTab = tab;
    clearAuthAlert();

    const tabSignIn = document.getElementById('authTabSignIn');
    const tabSignUp = document.getElementById('authTabSignUp');
    const tabReset = document.getElementById('authTabReset');
    const fullNameGroup = document.getElementById('authFullNameGroup');
    const passwordGroup = document.getElementById('authPasswordGroup');
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');
    const submitBtnText = document.getElementById('authSubmitText');
    const passwordInput = document.getElementById('authPassword');

    const activeClasses = ['bg-white', 'dark:bg-slate-700', 'text-brand-600', 'dark:text-brand-300', 'shadow-xs'];
    const inactiveClasses = ['text-slate-600', 'dark:text-slate-400'];

    [tabSignIn, tabSignUp, tabReset].forEach(t => {
      if (t) {
        t.classList.remove(...activeClasses);
        t.classList.add(...inactiveClasses);
      }
    });

    if (tab === 'signin') {
      if (tabSignIn) {
        tabSignIn.classList.add(...activeClasses);
        tabSignIn.classList.remove(...inactiveClasses);
      }
      if (fullNameGroup) fullNameGroup.classList.add('hidden');
      if (passwordGroup) passwordGroup.classList.remove('hidden');
      if (passwordInput) passwordInput.required = true;
      if (title) title.textContent = 'Sign In to EduSpend';
      if (subtitle) subtitle.textContent = 'Access your synced expenses and student budget';
      if (submitBtnText) submitBtnText.textContent = 'Sign In to EduSpend';
    } else if (tab === 'signup') {
      if (tabSignUp) {
        tabSignUp.classList.add(...activeClasses);
        tabSignUp.classList.remove(...inactiveClasses);
      }
      if (fullNameGroup) fullNameGroup.classList.remove('hidden');
      if (passwordGroup) passwordGroup.classList.remove('hidden');
      if (passwordInput) passwordInput.required = true;
      if (title) title.textContent = 'Create Student Account';
      if (subtitle) subtitle.textContent = 'Start tracking your college budget in the cloud';
      if (submitBtnText) submitBtnText.textContent = 'Create Student Account';
    } else if (tab === 'reset') {
      if (tabReset) {
        tabReset.classList.add(...activeClasses);
        tabReset.classList.remove(...inactiveClasses);
      }
      if (fullNameGroup) fullNameGroup.classList.add('hidden');
      if (passwordGroup) passwordGroup.classList.add('hidden');
      if (passwordInput) passwordInput.required = false;
      if (title) title.textContent = 'Reset Password';
      if (subtitle) subtitle.textContent = 'We will email you a secure link to reset your password';
      if (submitBtnText) submitBtnText.textContent = 'Send Reset Link';
    }
  }

  function showAuthAlert(message, type = 'error') {
    const alertBox = document.getElementById('authAlertBox');
    if (!alertBox) return;

    alertBox.classList.remove('hidden');
    if (type === 'error') {
      alertBox.className = 'mb-4 p-3 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    } else {
      alertBox.className = 'mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    }
    alertBox.textContent = message;
  }

  function clearAuthAlert() {
    const alertBox = document.getElementById('authAlertBox');
    if (alertBox) alertBox.classList.add('hidden');
  }

  function setupAuthListeners() {
    const tabSignIn = document.getElementById('authTabSignIn');
    const tabSignUp = document.getElementById('authTabSignUp');
    const tabReset = document.getElementById('authTabReset');
    const authForm = document.getElementById('authForm');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const guestBtn = document.getElementById('guestModeBtn');
    const sidebarAuthBtn = document.getElementById('sidebarAuthBtn');
    const authTriggerBtn = document.getElementById('authTriggerBtn');
    const cloudStatusBtn = document.getElementById('cloudStatusBtn');
    const mobileCloudBtn = document.getElementById('mobileCloudBtn');
    const openCloudInfoBtn = document.getElementById('openCloudInfoBtn');
    const closeCloudModalBtn = document.getElementById('closeCloudModalBtn');
    const cloudModal = document.getElementById('cloudStatusModal');
    const copySqlBtn = document.getElementById('copySqlSchemaBtn');
    const syncLocalBtn = document.getElementById('syncLocalToCloudBtn');

    if (tabSignIn) tabSignIn.addEventListener('click', () => setAuthTab('signin'));
    if (tabSignUp) tabSignUp.addEventListener('click', () => setAuthTab('signup'));
    if (tabReset) tabReset.addEventListener('click', () => setAuthTab('reset'));
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);

    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        closeAuthModal();
        showToast('Guest mode enabled. Entries stored locally in browser.', 'info');
      });
    }

    // Auth Trigger Handlers (toggle between sign in modal and sign out)
    function handleAuthButtonClick() {
      if (state.user) {
        if (confirm(`Sign out of ${state.user.email}?`)) {
          if (supabase) supabase.auth.signOut();
        }
      } else {
        openAuthModal('signin');
      }
    }

    if (sidebarAuthBtn) sidebarAuthBtn.addEventListener('click', handleAuthButtonClick);
    if (authTriggerBtn) authTriggerBtn.addEventListener('click', handleAuthButtonClick);

    // Cloud Status Modals
    function openCloudModal() {
      if (cloudModal) cloudModal.classList.remove('hidden');
    }
    function closeCloudModal() {
      if (cloudModal) cloudModal.classList.add('hidden');
    }

    if (cloudStatusBtn) cloudStatusBtn.addEventListener('click', openCloudModal);
    if (mobileCloudBtn) mobileCloudBtn.addEventListener('click', openCloudModal);
    if (openCloudInfoBtn) openCloudInfoBtn.addEventListener('click', openCloudModal);
    if (closeCloudModalBtn) closeCloudModalBtn.addEventListener('click', closeCloudModal);

    // Copy SQL Schema action
    if (copySqlBtn) {
      copySqlBtn.addEventListener('click', async () => {
        const sql = `-- EduSpend PostgreSQL Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT '$',
  monthly_allowance NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
  category_budgets JSONB NOT NULL DEFAULT '{"Food":140,"Academics":70,"Transport":45,"Housing":120,"Entertainment":40,"Personal":35,"Tech":25,"Other":25}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('Food', 'Academics', 'Transport', 'Housing', 'Entertainment', 'Personal', 'Tech', 'Other')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'UPI / Online',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);`;

        try {
          await navigator.clipboard.writeText(sql);
          showToast('SQL Schema copied to clipboard!', 'success');
        } catch (e) {
          showToast('Check supabase/schema.sql in repo for the complete SQL!', 'info');
        }
      });
    }

    if (syncLocalBtn) {
      syncLocalBtn.addEventListener('click', migrateLocalExpensesToCloud);
    }

    // Submit Auth Form
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthAlert();

        if (!supabase) {
          showAuthAlert('Supabase client is not loaded. Check network or configuration.');
          return;
        }

        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const fullName = document.getElementById('authFullName')?.value.trim();
        const submitBtn = document.getElementById('authSubmitBtn');
        const originalText = document.getElementById('authSubmitText').textContent;

        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75');

        try {
          if (state.authTab === 'signin') {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            if (error) throw error;

            closeAuthModal();
            showToast('Signed in successfully!', 'success');
          } else if (state.authTab === 'signup') {
            if (!fullName) {
              showAuthAlert('Please enter your full name.');
              submitBtn.disabled = false;
              submitBtn.classList.remove('opacity-75');
              return;
            }

            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName
                }
              }
            });
            if (error) throw error;

            if (data.session) {
              closeAuthModal();
              showToast(`Welcome to EduSpend, ${fullName}!`, 'success');
            } else {
              showAuthAlert('Account created! Please check your email to verify and sign in.', 'success');
            }
          } else if (state.authTab === 'reset') {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            showAuthAlert('Password reset email sent! Check your inbox.', 'success');
          }
        } catch (err) {
          showAuthAlert(err.message || 'Authentication failed. Please verify credentials.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-75');
        }
      });
    }
  }

  // ==========================================
  // EVENT LISTENERS & FORM SUBMISSIONS
  // ==========================================

  function setupEventListeners() {
    const themeBtn = document.getElementById('themeToggle');
    const themeBtnMobile = document.getElementById('themeToggleMobile');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', toggleTheme);

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
      currencySelect.addEventListener('change', async (e) => {
        state.currency = e.target.value;
        saveLocalState();
        renderAll();
        showToast(`Currency updated to ${state.currency}`, 'info');
        await cloudUpdateProfile({ currency: state.currency });
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
          saveLocalState();
          renderAll();
          showToast('Sample student data restored successfully!', 'success');
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

        showToast(`Selected preset: ${title} (${state.currency}${amount})`, 'info');
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
      confirmAllowanceBtn.addEventListener('click', async () => {
        const val = parseFloat(modalAllowanceInput.value);
        if (val && val > 0) {
          state.monthlyAllowance = val;
          saveLocalState();
          closeModal();
          renderAll();
          showToast(`Monthly allowance updated to ${state.currency}${val.toFixed(2)}`, 'success');
          await cloudUpdateProfile({ monthly_allowance: val });
        } else {
          alert('Please enter a valid positive allowance amount.');
        }
      });
    }

    // Budget Planner allowance input & button
    const saveAllowanceBtn = document.getElementById('saveAllowanceBtn');
    const monthlyAllowanceInput = document.getElementById('monthlyAllowanceInput');
    if (saveAllowanceBtn && monthlyAllowanceInput) {
      saveAllowanceBtn.addEventListener('click', async () => {
        const val = parseFloat(monthlyAllowanceInput.value);
        if (val && val > 0) {
          state.monthlyAllowance = val;
          saveLocalState();
          renderAll();
          showToast(`Monthly allowance set to ${state.currency}${val.toFixed(2)}`, 'success');
          await cloudUpdateProfile({ monthly_allowance: val });
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
  async function handleAddExpenseSubmit(e) {
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

    // Optimistically add to state
    state.expenses.unshift(newExpense);
    saveLocalState();

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

    // Sync to Supabase in background
    if (state.user) {
      const synced = await cloudInsertExpense(newExpense);
      if (synced) {
        saveLocalState();
      }
    }

    // Switch back to dashboard to see results
    const dashBtn = document.querySelector('.nav-item[data-section="dashboard"]');
    if (dashBtn) dashBtn.click();
  }

  // Delete an expense
  async function deleteExpense(id) {
    const item = state.expenses.find(e => e.id === id);
    if (!item) return;

    if (confirm(`Delete "${item.title}" (${state.currency}${item.amount.toFixed(2)})?`)) {
      state.expenses = state.expenses.filter(e => e.id !== id);
      saveLocalState();
      renderAll();
      showToast('Expense removed', 'info');

      if (state.user) {
        await cloudDeleteExpense(id);
      }
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

    document.querySelectorAll('.preset-amount-label').forEach(label => {
      const parent = label.closest('.quick-preset-btn');
      if (parent) {
        const amt = parent.dataset.amount;
        label.textContent = `${cur}${parseFloat(amt).toFixed(2)}`;
      }
    });

    const monthBadge = document.getElementById('currentMonthBadge');
    if (monthBadge) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthBadge.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
  }

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

  function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const metrics = calculateMetrics();
    const cur = state.currency;
    const isDark = document.documentElement.classList.contains('dark');

    const labels = Object.keys(CATEGORIES);
    const dataValues = labels.map(l => metrics.categoryTotals[l] || 0);
    const backgroundColors = labels.map(l => isDark ? CATEGORIES[l].darkColor : CATEGORIES[l].color);

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
          borderWidth: 2,
          borderColor: isDark ? '#0f172a' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
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

  function updateDailyChart() {
    const canvas = document.getElementById('dailySpendingChart');
    if (!canvas) return;

    const cur = state.currency;
    const isDark = document.documentElement.classList.contains('dark');

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
          legend: { display: false },
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

    filtered.sort((a, b) => {
      if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortVal === 'amount-desc') return b.amount - a.amount;
      if (sortVal === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    const totalSum = filtered.reduce((acc, c) => acc + c.amount, 0);

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

    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) deleteExpense(id);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function renderBudgetPlanner() {
    const allowanceInput = document.getElementById('monthlyAllowanceInput');
    if (allowanceInput) allowanceInput.value = state.monthlyAllowance;

    const cur = state.currency;
    const allowance = state.monthlyAllowance;
    const metrics = calculateMetrics();

    const needs = allowance * 0.50;
    const wants = allowance * 0.30;
    const savings = allowance * 0.20;

    const needsEl = document.getElementById('ruleNeedsAmount');
    const wantsEl = document.getElementById('ruleWantsAmount');
    const savingsEl = document.getElementById('ruleSavingsAmount');
    if (needsEl) needsEl.textContent = `${cur}${needs.toFixed(2)}`;
    if (wantsEl) wantsEl.textContent = `${cur}${wants.toFixed(2)}`;
    if (savingsEl) savingsEl.textContent = `${cur}${savings.toFixed(2)}`;

    const milestonePaceEl = document.getElementById('milestoneTargetPace');
    const projectedSavingsEl = document.getElementById('projectedSavingsAmount');
    if (milestonePaceEl) milestonePaceEl.textContent = `${cur}${metrics.safeDailyPace.toFixed(2)}/day`;
    if (projectedSavingsEl) {
      const projected = Math.max(0, metrics.remainingBudget);
      projectedSavingsEl.textContent = `${cur}${projected.toFixed(2)}`;
    }

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
