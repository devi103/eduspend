/**
 * EduSpend — Authentication Module
 * Handles student registration, login, logout, and session management.
 * Uses Supabase Auth with email/password.
 */

(function () {
  'use strict';

  // Wait for Supabase client to be available
  function getSupabase() {
    return window.eduspendSupabase;
  }

  // ─── Auth State ───────────────────────────────────────────
  const authState = {
    user: null,
    profile: null,
    isLoading: true,
    isAuthPage: false,
  };

  window.eduspendAuth = authState;

  // ─── Check if we're on the auth page ──────────────────────
  function isAuthPage() {
    const path = window.location.pathname.replace(/\/+$/, '');
    return path.endsWith('/auth.html') ||
           path.endsWith('/auth') ||
           window.location.hash === '#auth';
  }

  // ─── Initialize Auth ──────────────────────────────────────
  async function initAuth() {
    const sb = getSupabase();
    if (!sb) {
      console.error('[Auth] Supabase client not available');
      authState.isLoading = false;
      return;
    }

    authState.isAuthPage = isAuthPage();

    // Listen for auth state changes
    sb.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event);
      
      if (session && session.user) {
        authState.user = session.user;
        await loadProfile(session.user.id);
        authState.isLoading = false;

        // If on auth page and logged in, redirect to main
        if (authState.isAuthPage) {
          window.location.href = 'index.html';
          return;
        }

        // Update UI for logged-in user
        updateAuthUI();
        
        // Signal that auth is ready — app.js listens for this
        window.dispatchEvent(new CustomEvent('eduspend-auth-ready', {
          detail: { user: authState.user, profile: authState.profile }
        }));

      } else {
        authState.user = null;
        authState.profile = null;
        authState.isLoading = false;

        // If NOT on auth page and not logged in, redirect to auth
        if (!authState.isAuthPage) {
          window.location.href = 'auth.html';
          return;
        }
      }
    });

    // Check current session
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      authState.isLoading = false;
      if (!authState.isAuthPage) {
        window.location.href = 'auth.html';
      }
    }
  }

  // ─── Load User Profile ────────────────────────────────────
  async function loadProfile(userId) {
    const sb = getSupabase();
    if (!sb) return;

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Auth] Could not load profile:', error.message);
      // Profile might not exist yet (trigger delay); create it
      if (error.code === 'PGRST116') {
        await createProfile(userId);
      }
      return;
    }

    authState.profile = data;
  }

  // ─── Create Profile (fallback) ────────────────────────────
  async function createProfile(userId) {
    const sb = getSupabase();
    if (!sb || !authState.user) return;

    const { data, error } = await sb
      .from('profiles')
      .insert({
        id: userId,
        full_name: authState.user.user_metadata?.full_name || authState.user.email?.split('@')[0] || 'Student',
        currency: '$',
        theme: 'system'
      })
      .select()
      .single();

    if (!error && data) {
      authState.profile = data;
    }
  }

  // ─── Register (Sign Up) ───────────────────────────────────
  async function register(email, password, fullName) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });

    if (error) return { error };
    
    return { data, message: 'Registration successful! Check your email for verification, or log in if auto-confirmed.' };
  }

  // ─── Login ────────────────────────────────────────────────
  async function login(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) return { error };
    return { data };
  }

  // ─── Logout ───────────────────────────────────────────────
  async function logout() {
    const sb = getSupabase();
    if (!sb) return;

    await sb.auth.signOut();
    authState.user = null;
    authState.profile = null;
    window.location.href = 'auth.html';
  }

  // ─── Update Profile ───────────────────────────────────────
  async function updateProfile(updates) {
    const sb = getSupabase();
    if (!sb || !authState.user) return { error: { message: 'Not logged in' } };

    const { data, error } = await sb
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (!error && data) {
      authState.profile = data;
      updateAuthUI();
    }

    return { data, error };
  }

  // ─── Update Auth UI elements ──────────────────────────────
  function updateAuthUI() {
    if (!authState.user || !authState.profile) return;

    const profile = authState.profile;
    const displayName = profile.full_name || authState.user.email?.split('@')[0] || 'Student';
    const initials = displayName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Update sidebar profile name
    const nameEl = document.querySelector('#sidebar .overflow-hidden h4');
    if (nameEl) {
      nameEl.textContent = displayName.length > 15 
        ? displayName.slice(0, 14) + '.' 
        : displayName;
    }

    // Update sidebar email/link 
    const linkEl = document.querySelector('#sidebar .overflow-hidden a');
    if (linkEl) {
      linkEl.textContent = authState.user.email || '';
      linkEl.href = '#';
      linkEl.removeAttribute('target');
      linkEl.onclick = (e) => { e.preventDefault(); };
    }

    // Update avatar initials
    const initialsEl = document.querySelector('#sidebar .overflow-hidden + div span, #sidebar .w-9.h-9.rounded-full span');
    // Find the initials span inside the avatar circle
    const avatarContainer = document.querySelector('#sidebar .w-9.h-9.rounded-full');
    if (avatarContainer) {
      const img = avatarContainer.querySelector('img');
      if (img) img.style.display = 'none';
      const span = avatarContainer.querySelector('span');
      if (span) span.textContent = initials;
    }

    // Show logout button - replace "Reset Data" with logout option
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn && !document.getElementById('logoutBtn')) {
      // Add logout button next to reset
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'hover:text-rose-500 underline transition-colors';
      logoutBtn.textContent = 'Logout';
      logoutBtn.title = 'Sign out of your account';
      logoutBtn.addEventListener('click', logout);
      resetBtn.parentElement.appendChild(document.createTextNode(' | '));
      resetBtn.parentElement.appendChild(logoutBtn);
    }
  }

  // ─── Expose API globally ──────────────────────────────────
  window.eduspendAuthAPI = {
    register,
    login,
    logout,
    updateProfile,
    getUser: () => authState.user,
    getProfile: () => authState.profile,
    isLoggedIn: () => !!authState.user,
    onReady: (cb) => {
      if (authState.user) {
        cb({ user: authState.user, profile: authState.profile });
      } else {
        window.addEventListener('eduspend-auth-ready', (e) => cb(e.detail), { once: true });
      }
    }
  };

  // ─── Auth Page Form Handling ──────────────────────────────
  function setupAuthForms() {
    if (!authState.isAuthPage) return;

    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerFormContainer');
    const authError = document.getElementById('authError');
    const authSuccess = document.getElementById('authSuccess');

    function showLogin() {
      loginTab?.classList.add('active', 'bg-brand-600', 'text-white');
      loginTab?.classList.remove('text-slate-600');
      registerTab?.classList.remove('active', 'bg-brand-600', 'text-white');
      registerTab?.classList.add('text-slate-600');
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      hideMessages();
    }

    function showRegister() {
      registerTab?.classList.add('active', 'bg-brand-600', 'text-white');
      registerTab?.classList.remove('text-slate-600');
      loginTab?.classList.remove('active', 'bg-brand-600', 'text-white');
      loginTab?.classList.add('text-slate-600');
      registerForm?.classList.remove('hidden');
      loginForm?.classList.add('hidden');
      hideMessages();
    }

    function showError(msg) {
      if (authError) {
        authError.textContent = msg;
        authError.classList.remove('hidden');
      }
      if (authSuccess) authSuccess.classList.add('hidden');
    }

    function showSuccess(msg) {
      if (authSuccess) {
        authSuccess.textContent = msg;
        authSuccess.classList.remove('hidden');
      }
      if (authError) authError.classList.add('hidden');
    }

    function hideMessages() {
      if (authError) authError.classList.add('hidden');
      if (authSuccess) authSuccess.classList.add('hidden');
    }

    loginTab?.addEventListener('click', showLogin);
    registerTab?.addEventListener('click', showRegister);

    // Login form
    const loginFormEl = document.getElementById('loginForm');
    loginFormEl?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessages();

      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      const submitBtn = loginFormEl.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      const result = await login(email, password);

      if (result.error) {
        showError(result.error.message || 'Login failed. Please check your credentials.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      }
      // Successful login will trigger onAuthStateChange -> redirect
    });

    // Register form
    const registerFormEl = document.getElementById('registerForm');
    registerFormEl?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessages();

      const fullName = document.getElementById('registerName')?.value;
      const email = document.getElementById('registerEmail')?.value;
      const password = document.getElementById('registerPassword')?.value;
      const confirmPassword = document.getElementById('registerConfirmPassword')?.value;

      if (!fullName || !email || !password) {
        showError('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
      }

      const submitBtn = registerFormEl.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
      }

      const result = await register(email, password, fullName);

      if (result.error) {
        showError(result.error.message || 'Registration failed. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      } else {
        showSuccess(result.message || 'Account created! You can now sign in.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
        // If auto-confirmed, the onAuthStateChange will redirect
      }
    });
  }

  // ─── Initialize ───────────────────────────────────────────
  function bootAuth() {
    authState.isAuthPage = isAuthPage();
    setupAuthForms();
    initAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAuth);
  } else {
    bootAuth();
  }

})();
