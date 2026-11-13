/**
 * EduSpend — Backend Data Module
 * Handles all CRUD operations for expenses, budgets, and settings
 * with Supabase PostgreSQL as the data store.
 * Falls back to localStorage when Supabase is unavailable.
 */

(function () {
  'use strict';

  function getSupabase() {
    return window.eduspendSupabase;
  }

  function getUserId() {
    return window.eduspendAuth?.user?.id || null;
  }

  // ─── EXPENSES ─────────────────────────────────────────────

  /**
   * Fetch all expenses for the logged-in user
   */
  async function fetchExpenses() {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return [];

    const { data, error } = await sb
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Backend] Fetch expenses error:', error.message);
      return [];
    }

    // Map DB columns to frontend format
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      amount: parseFloat(row.amount),
      category: row.category,
      date: row.date,
      paymentMethod: row.payment_method,
      notes: row.notes || '',
      createdAt: row.created_at
    }));
  }

  /**
   * Add a new expense
   */
  async function addExpense(expense) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return { error: { message: 'Not connected' } };

    const { data, error } = await sb
      .from('expenses')
      .insert({
        user_id: userId,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        payment_method: expense.paymentMethod,
        notes: expense.notes || ''
      })
      .select()
      .single();

    if (error) {
      console.error('[Backend] Add expense error:', error.message);
      return { error };
    }

    return {
      data: {
        id: data.id,
        title: data.title,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        paymentMethod: data.payment_method,
        notes: data.notes || '',
        createdAt: data.created_at
      }
    };
  }

  /**
   * Update an existing expense
   */
  async function updateExpense(id, updates) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return { error: { message: 'Not connected' } };

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await sb
      .from('expenses')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Backend] Update expense error:', error.message);
      return { error };
    }

    return {
      data: {
        id: data.id,
        title: data.title,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        paymentMethod: data.payment_method,
        notes: data.notes || ''
      }
    };
  }

  /**
   * Delete an expense
   */
  async function deleteExpense(id) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return { error: { message: 'Not connected' } };

    const { error } = await sb
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Backend] Delete expense error:', error.message);
      return { error };
    }

    return { success: true };
  }

  // ─── BUDGETS ──────────────────────────────────────────────

  /**
   * Get monthly allowance for a specific month/year
   */
  async function getMonthlyBudget(month, year) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return null;

    const { data, error } = await sb
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      // No budget set for this month, return default
      return { monthly_allowance: 500 };
    }

    return data;
  }

  /**
   * Upsert monthly allowance
   */
  async function setMonthlyBudget(month, year, allowance) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return { error: { message: 'Not connected' } };

    const { data, error } = await sb
      .from('budgets')
      .upsert({
        user_id: userId,
        month: month,
        year: year,
        monthly_allowance: allowance
      }, {
        onConflict: 'user_id,month,year'
      })
      .select()
      .single();

    if (error) {
      console.error('[Backend] Set budget error:', error.message);
      return { error };
    }

    return { data };
  }

  // ─── CATEGORY BUDGETS ─────────────────────────────────────

  /**
   * Get all category budgets for a month/year
   */
  async function getCategoryBudgets(month, year) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return {};

    const { data, error } = await sb
      .from('category_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) {
      console.error('[Backend] Get category budgets error:', error.message);
      return {};
    }

    // Convert array to map: { category: limit }
    const result = {};
    (data || []).forEach(row => {
      result[row.category] = parseFloat(row.budget_limit);
    });
    return result;
  }

  /**
   * Set a category budget limit
   */
  async function setCategoryBudget(month, year, category, limit) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return { error: { message: 'Not connected' } };

    const { data, error } = await sb
      .from('category_budgets')
      .upsert({
        user_id: userId,
        month: month,
        year: year,
        category: category,
        budget_limit: limit
      }, {
        onConflict: 'user_id,month,year,category'
      })
      .select()
      .single();

    if (error) {
      console.error('[Backend] Set category budget error:', error.message);
      return { error };
    }

    return { data };
  }

  // ─── PROFILE / SETTINGS ───────────────────────────────────

  /**
   * Update user currency preference
   */
  async function updateCurrency(currency) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return;

    await sb
      .from('profiles')
      .update({ currency: currency })
      .eq('id', userId);
  }

  /**
   * Update user theme preference
   */
  async function updateTheme(theme) {
    const sb = getSupabase();
    const userId = getUserId();
    if (!sb || !userId) return;

    await sb
      .from('profiles')
      .update({ theme: theme })
      .eq('id', userId);
  }

  // ─── Expose API globally ──────────────────────────────────
  window.eduspendBackend = {
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthlyBudget,
    setMonthlyBudget,
    getCategoryBudgets,
    setCategoryBudget,
    updateCurrency,
    updateTheme,
  };

})();
