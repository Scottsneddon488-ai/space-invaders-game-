import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Search,
  Check, X, Calendar, ChevronRight, Trash2, BookOpen, ListChecks, Pencil,
  Sun, Moon,
} from 'lucide-react';

/* ============================================================
   THEME — same token set as the business dashboards.
   ============================================================ */
const theme = {
  primary: { light: '#246BFD', dark: '#5A8CFF' },
  background: { light: '#F6F8FC', dark: '#0C1424' },
  surface: { light: '#FFFFFF', dark: '#15233A' },
  foreground: { light: '#0C1B33', dark: '#F7FAFF' },
  muted: { light: '#68758A', dark: '#A9B7CC' },
  border: { light: '#E4EAF3', dark: '#2C3E58' },
  success: { light: '#1BB58B', dark: '#4CD5A9' },
  warning: { light: '#F4A340', dark: '#FFC166' },
  warningSurface: { light: '#FEF3E4', dark: '#3A2C16' },
  error: { light: '#E85D75', dark: '#FF869C' },
  onAccent: { light: '#FFFFFF', dark: '#0C1424' },
};

// Resolves every token to the given mode, e.g. tone('dark').primary === '#5A8CFF'.
const tone = (mode) => Object.fromEntries(Object.entries(theme).map(([k, v]) => [k, v[mode]]));

/* ============================================================
   FINANCE DATA ADAPTER
   Same pattern as the business dashboards: sample data for now,
   swap the inside of these for a real bank feed / Stripe payout
   feed later — the UI never changes.
   ============================================================ */
const sampleAccounts = [
  { id: 'A-1', name: 'Personal current', balance: 2140 },
  { id: 'A-2', name: 'Business current', balance: 6830 },
  { id: 'A-3', name: 'Savings', balance: 4200 },
];

const sampleBills = [
  { id: 'B-1', name: 'Van insurance', amount: 89, due: 'Due in 3 days' },
  { id: 'B-2', name: 'Mobile contract', amount: 32, due: 'Due in 6 days' },
  { id: 'B-3', name: 'Tool finance', amount: 145, due: 'Due in 11 days' },
];

const sampleCashflow = [
  { month: 'Mar', income: 3100, expenses: 2200 },
  { month: 'Apr', income: 3600, expenses: 2450 },
  { month: 'May', income: 2900, expenses: 2300 },
  { month: 'Jun', income: 4200, expenses: 2600 },
  { month: 'Jul', income: 3800, expenses: 2500 },
  { month: 'Aug', income: 4650, expenses: 2700 },
];

const financeAdapter = {
  fetchAccounts: async () => sampleAccounts,
  fetchBills: async () => sampleBills,
  fetchCashflow: async () => sampleCashflow,
  fetchSummary: async () => {
    const totalBalance = sampleAccounts.reduce((s, a) => s + a.balance, 0);
    const latest = sampleCashflow[sampleCashflow.length - 1];
    const savingsRate = Math.round(((latest.income - latest.expenses) / latest.income) * 100);
    return { totalBalance, income: latest.income, expenses: latest.expenses, savingsRate };
  },
};

const money = (n) => `£${n.toLocaleString('en-GB')}`;

/* ============================================================
   SIGNATURE ELEMENT — a ledger-tick divider
   ============================================================ */
const LedgerDivider = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
    <div style={{ flex: 1, height: 2, background: color, borderRadius: 1 }} />
    <div style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
    <div style={{ flex: 1, height: 2, background: color, borderRadius: 1 }} />
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function PersonalDashboard() {
  const [tab, setTab] = useState('overview');

  // Dark mode — follows the OS/browser preference by default; the header
  // toggle sets an explicit override that's remembered on this device.
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [modeOverride, setModeOverride] = useState(null);
  const mode = modeOverride ?? (systemPrefersDark ? 'dark' : 'light');
  const T = useMemo(() => tone(mode), [mode]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemPrefersDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('theme-mode', false);
        if (res && (res.value === 'light' || res.value === 'dark')) {
          setModeOverride(res.value);
        }
      } catch {
        // no saved preference — keep following the system setting
      }
    })();
  }, []);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setModeOverride(next);
    window.storage.set('theme-mode', next, false).catch(() => {});
  };

  // Accounts & bills — start from sample data, but become real once
  // you edit or add one; persisted the same way as the to-do list.
  const [accounts, setAccounts] = useState(sampleAccounts);
  const [bills, setBills] = useState(sampleBills);
  const [financeLoaded, setFinanceLoaded] = useState(false);
  const [financeError, setFinanceError] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [addingBill, setAddingBill] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDue, setNewBillDue] = useState('');

  const [cashflow] = useState(sampleCashflow);

  // To-do list — persisted personally via window.storage
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [todosLoaded, setTodosLoaded] = useState(false);
  const [todoError, setTodoError] = useState(false);

  // Diary — persisted personally via window.storage
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [entryError, setEntryError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('todos', false);
        setTodos(res ? JSON.parse(res.value) : []);
      } catch {
        setTodos([]);
      } finally {
        setTodosLoaded(true);
      }
    })();
    (async () => {
      try {
        const res = await window.storage.get('diary-entries', false);
        setEntries(res ? JSON.parse(res.value) : []);
      } catch {
        setEntries([]);
      } finally {
        setEntriesLoaded(true);
      }
    })();
    (async () => {
      try {
        const acc = await window.storage.get('accounts', false);
        if (acc) setAccounts(JSON.parse(acc.value));
      } catch {
        // no saved accounts yet — keep sample data as a starting point
      }
      try {
        const bl = await window.storage.get('bills', false);
        if (bl) setBills(JSON.parse(bl.value));
      } catch {
        // no saved bills yet — keep sample data as a starting point
      } finally {
        setFinanceLoaded(true);
      }
    })();
  }, []);

  const saveAccounts = async (next) => {
    setAccounts(next);
    try {
      const result = await window.storage.set('accounts', JSON.stringify(next), false);
      if (!result) setFinanceError(true);
    } catch {
      setFinanceError(true);
    }
  };

  const saveBills = async (next) => {
    setBills(next);
    try {
      const result = await window.storage.set('bills', JSON.stringify(next), false);
      if (!result) setFinanceError(true);
    } catch {
      setFinanceError(true);
    }
  };

  const startEditingAccount = (a) => {
    setEditingAccountId(a.id);
    setEditingValue(String(a.balance));
  };

  const commitAccountEdit = (id) => {
    const val = parseFloat(editingValue);
    if (!isNaN(val)) {
      saveAccounts(accounts.map(a => a.id === id ? { ...a, balance: val } : a));
    }
    setEditingAccountId(null);
    setEditingValue('');
  };

  const addAccount = () => {
    const val = parseFloat(newAccountBalance);
    if (!newAccountName.trim() || isNaN(val)) return;
    saveAccounts([...accounts, { id: `A-${Date.now()}`, name: newAccountName.trim(), balance: val }]);
    setNewAccountName('');
    setNewAccountBalance('');
    setAddingAccount(false);
  };

  const removeAccount = (id) => {
    saveAccounts(accounts.filter(a => a.id !== id));
  };

  const addBill = () => {
    const val = parseFloat(newBillAmount);
    if (!newBillName.trim() || isNaN(val)) return;
    saveBills([...bills, {
      id: `B-${Date.now()}`,
      name: newBillName.trim(),
      amount: val,
      due: newBillDue.trim() || 'Due date not set',
    }]);
    setNewBillName('');
    setNewBillAmount('');
    setNewBillDue('');
    setAddingBill(false);
  };

  const removeBill = (id) => {
    saveBills(bills.filter(b => b.id !== id));
  };

  const saveTodos = async (next) => {
    setTodos(next);
    try {
      const result = await window.storage.set('todos', JSON.stringify(next), false);
      if (!result) setTodoError(true);
    } catch {
      setTodoError(true);
    }
  };

  const saveEntries = async (next) => {
    setEntries(next);
    try {
      const result = await window.storage.set('diary-entries', JSON.stringify(next), false);
      if (!result) setEntryError(true);
    } catch {
      setEntryError(true);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const next = [{ id: Date.now(), text: newTodo.trim(), done: false }, ...todos];
    saveTodos(next);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTodo = (id) => {
    saveTodos(todos.filter(t => t.id !== id));
  };

  const addEntry = () => {
    if (!newEntry.trim()) return;
    const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const next = [{ id: Date.now(), text: newEntry.trim(), date: dateLabel }, ...entries];
    saveEntries(next);
    setNewEntry('');
  };

  const removeEntry = (id) => {
    saveEntries(entries.filter(e => e.id !== id));
  };

  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const latest = cashflow[cashflow.length - 1];
    const savingsRate = Math.round(((latest.income - latest.expenses) / latest.income) * 100);
    return { totalBalance, income: latest.income, expenses: latest.expenses, savingsRate };
  }, [accounts, cashflow]);

  const openTodos = todos.filter(t => !t.done).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: T.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: T.foreground,
      paddingBottom: 84,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .display { font-family: 'Manrope', sans-serif; }
        .scrollx::-webkit-scrollbar { display: none; }
        input:focus, textarea:focus { outline: 2px solid ${T.primary}; outline-offset: 1px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '20px 18px 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Personal
            </div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
              Scott's Dashboard
            </div>
          </div>
          <button
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              border: `1px solid ${T.border}`, background: T.background,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mode === 'dark' ? <Sun size={16} color={T.foreground} /> : <Moon size={16} color={T.foreground} />}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="scrollx" style={{
        display: 'flex', gap: 10, padding: '16px 18px 4px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {[
          { label: 'Total balance', value: money(summary.totalBalance), color: T.primary, icon: Wallet },
          { label: 'Income (mo.)', value: money(summary.income), color: T.success, icon: TrendingUp },
          { label: 'Expenses (mo.)', value: money(summary.expenses), color: T.error, icon: TrendingDown },
          { label: 'Savings rate', value: `${summary.savingsRate}%`, color: T.foreground, icon: PiggyBank },
        ].map((s, i) => (
          <div key={i} style={{
            minWidth: 138, background: T.surface, borderRadius: 14,
            padding: '14px 14px', border: `1px solid ${T.border}`, flexShrink: 0,
          }}>
            <s.icon size={16} color={s.color} />
            <div className="display" style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cashflow chart */}
      <div style={{
        margin: '14px 18px 0', background: T.surface, borderRadius: 14,
        border: `1px solid ${T.border}`, padding: '14px 16px 6px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Income vs expenses</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
            <span style={{ color: T.success, fontWeight: 600 }}>● Income</span>
            <span style={{ color: T.error, fontWeight: 600 }}>● Expenses</span>
          </div>
        </div>
        <div style={{ height: 92, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashflow} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.success} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={T.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" hide />
              <Tooltip
                formatter={(v, key) => [money(v), key === 'income' ? 'Income' : 'Expenses']}
                labelStyle={{ display: 'none' }}
                contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="income" stroke={T.success} strokeWidth={2.5} fill="url(#incomeFill)" />
              <Area type="monotone" dataKey="expenses" stroke={T.error} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 18px 8px' }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'todo', label: `To-Do${openTodos ? ` (${openTodos})` : ''}` },
          { key: 'diary', label: 'Diary' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10,
            background: tab === t.key ? T.primary : T.surface,
            color: tab === t.key ? T.onAccent : T.muted,
            fontWeight: 700, fontSize: 13,
            border: tab === t.key ? 'none' : `1px solid ${T.border}`,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview: accounts + bills, editable */}
      {tab === 'overview' && (
        <div style={{ padding: '0 18px' }}>
          {financeError && (
            <div style={{ fontSize: 12, color: T.error, marginBottom: 10 }}>
              Couldn't save that change — try again.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Accounts
            </div>
            <button onClick={() => setAddingAccount(!addingAccount)} style={{
              border: 'none', background: 'none', color: T.primary,
              fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, padding: 2,
            }}>
              <Plus size={13} /> Add
            </button>
          </div>

          {addingAccount && (
            <div style={{
              background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
              padding: 12, marginBottom: 10, display: 'flex', gap: 8,
            }}>
              <input
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Account name"
                style={{ flex: 1.3, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5 }}
              />
              <input
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                placeholder="Balance"
                inputMode="decimal"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5 }}
              />
              <button onClick={addAccount} style={{
                width: 36, borderRadius: 8, border: 'none', background: T.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={16} color={T.onAccent} />
              </button>
            </div>
          )}

          {!financeLoaded ? (
            <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
          ) : (
            accounts.map((a, i) => (
              <div key={a.id}>
                <div style={{
                  background: T.surface, borderRadius: 14,
                  border: `1px solid ${T.border}`, padding: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  {editingAccountId === a.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitAccountEdit(a.id)}
                        inputMode="decimal"
                        autoFocus
                        style={{ width: 90, padding: '6px 8px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 14, textAlign: 'right' }}
                      />
                      <button onClick={() => commitAccountEdit(a.id)} style={{ border: 'none', background: 'none', padding: 3 }}>
                        <Check size={16} color={T.success} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="display" style={{ fontSize: 15, fontWeight: 800 }}>{money(a.balance)}</div>
                      <button onClick={() => startEditingAccount(a)} style={{ border: 'none', background: 'none', padding: 2 }}>
                        <Pencil size={13} color={T.muted} />
                      </button>
                      <button onClick={() => removeAccount(a.id)} style={{ border: 'none', background: 'none', padding: 2 }}>
                        <X size={14} color={T.muted} />
                      </button>
                    </div>
                  )}
                </div>
                {i < accounts.length - 1 && <LedgerDivider color={T.border} />}
              </div>
            ))
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 8px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Upcoming bills
            </div>
            <button onClick={() => setAddingBill(!addingBill)} style={{
              border: 'none', background: 'none', color: T.primary,
              fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, padding: 2,
            }}>
              <Plus size={13} /> Add
            </button>
          </div>

          {addingBill && (
            <div style={{
              background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
              padding: 12, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  placeholder="Bill name"
                  style={{ flex: 1.3, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5 }}
                />
                <input
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newBillDue}
                  onChange={(e) => setNewBillDue(e.target.value)}
                  placeholder="Due (e.g. Due in 5 days)"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5 }}
                />
                <button onClick={addBill} style={{
                  width: 36, borderRadius: 8, border: 'none', background: T.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={16} color={T.onAccent} />
                </button>
              </div>
            </div>
          )}

          {financeLoaded && bills.map((b, i) => (
            <div key={b.id}>
              <div style={{
                background: T.surface, borderRadius: 14,
                border: `1px solid ${T.border}`, padding: 14,
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: T.warningSurface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Calendar size={16} color={T.warning} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{b.due}</div>
                </div>
                <div className="display" style={{ fontSize: 14, fontWeight: 800 }}>{money(b.amount)}</div>
                <button onClick={() => removeBill(b.id)} style={{ border: 'none', background: 'none', padding: 2 }}>
                  <X size={14} color={T.muted} />
                </button>
              </div>
              {i < bills.length - 1 && <LedgerDivider color={T.border} />}
            </div>
          ))}
        </div>
      )}

      {/* To-Do */}
      {tab === 'todo' && (
        <div style={{ padding: '0 18px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a task"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${T.border}`, fontSize: 14,
                background: T.surface, color: T.foreground,
              }}
            />
            <button onClick={addTodo} style={{
              width: 42, borderRadius: 10, border: 'none', background: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} color={T.onAccent} />
            </button>
          </div>

          {todoError && (
            <div style={{ fontSize: 12, color: T.error, marginBottom: 10 }}>
              Couldn't save that change — try again.
            </div>
          )}

          {!todosLoaded ? (
            <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
          ) : todos.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 13.5,
            }}>
              <ListChecks size={28} color={T.border} style={{ marginBottom: 8 }} />
              <div>Nothing on the list yet. Add your first task above.</div>
            </div>
          ) : (
            todos.map((t, i) => (
              <div key={t.id}>
                <div style={{
                  background: T.surface, borderRadius: 12,
                  border: `1px solid ${T.border}`, padding: '11px 12px',
                  display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <button onClick={() => toggleTodo(t.id)} style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${t.done ? T.success : T.border}`,
                    background: t.done ? T.success : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.done && <Check size={14} color={T.onAccent} />}
                  </button>
                  <div style={{
                    flex: 1, fontSize: 14,
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? T.muted : T.foreground,
                  }}>
                    {t.text}
                  </div>
                  <button onClick={() => removeTodo(t.id)} style={{ border: 'none', background: 'none', padding: 4 }}>
                    <X size={15} color={T.muted} />
                  </button>
                </div>
                {i < todos.length - 1 && <div style={{ height: 6 }} />}
              </div>
            ))
          )}
        </div>
      )}

      {/* Diary */}
      {tab === 'diary' && (
        <div style={{ padding: '0 18px' }}>
          <div style={{ marginBottom: 14 }}>
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Write today's note…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${T.border}`, fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', background: T.surface, color: T.foreground,
              }}
            />
            <button onClick={addEntry} style={{
              marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 10,
              border: 'none', background: T.primary, color: T.onAccent,
              fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}>
              <Plus size={16} /> Add entry
            </button>
          </div>

          {entryError && (
            <div style={{ fontSize: 12, color: T.error, marginBottom: 10 }}>
              Couldn't save that change — try again.
            </div>
          )}

          {!entriesLoaded ? (
            <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 13.5,
            }}>
              <BookOpen size={28} color={T.border} style={{ marginBottom: 8 }} />
              <div>No entries yet. Jot down today's note above.</div>
            </div>
          ) : (
            entries.map((e, i) => (
              <div key={e.id}>
                <div style={{
                  background: T.surface, borderRadius: 14,
                  border: `1px solid ${T.border}`, padding: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {e.date}
                    </div>
                    <button onClick={() => removeEntry(e.id)} style={{ border: 'none', background: 'none', padding: 2 }}>
                      <Trash2 size={13} color={T.muted} />
                    </button>
                  </div>
                  <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.45 }}>{e.text}</div>
                </div>
                {i < entries.length - 1 && <div style={{ height: 8 }} />}
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ padding: '20px 18px 0', fontSize: 11.5, color: T.muted, textAlign: 'center' }}>
        Accounts, bills, to-dos and diary entries all save for you automatically. The income/expenses chart is still sample data.
      </div>
    </div>
  );
}
