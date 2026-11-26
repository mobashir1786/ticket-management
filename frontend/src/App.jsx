import React, { useCallback, useEffect, useState } from 'react';
import Login from './components/Login';
import TicketDetail from './components/TicketDetail';
import TicketFilters from './components/TicketFilters';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import { api } from './services/api';

function savedSession() {
  try {
    const session = JSON.parse(localStorage.getItem('helpdesk-session'));
    return session?.token && session?.user?.name ? session : null;
  } catch {
    return null;
  }
}

function Card({ label: title, value, accent }) {
  return <article className={accent}><span>{title}</span><strong>{value ?? '—'}</strong></article>;
}

export default function App() {
  const [session, setSession] = useState(savedSession);
  const [sessionMessage, setSessionMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logout = useCallback((message = '') => {
    localStorage.removeItem('helpdesk-session');
    setSession(null);
    setSelected(null);
    setSessionMessage(message);
    setTickets([]);
    setStats(null);
    setPagination(null);
  }, []);

  const handleError = useCallback((err) => {
    if (err.status === 401) {
      logout('Your session has expired. Please sign in again.');
    } else {
      setError(err.message || 'Could not connect to the server.');
    }
  }, [logout]);

  const load = useCallback(async (signal) => {
    if (!session) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(filters.page),
        limit: '10',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      if (filters.search) query.set('search', filters.search);
      if (filters.status) query.set('status', filters.status);
      if (filters.priority) query.set('priority', filters.priority);
      const [list, summary] = await Promise.all([
        api(`/api/tickets?${query}`, { signal }, session.token),
        api('/api/tickets/stats', { signal }, session.token),
      ]);
      if (signal?.aborted) return;
      if (filters.page > Math.max(1, list.pagination.totalPages)) {
        setFilters((current) => ({ ...current, page: Math.max(1, list.pagination.totalPages) }));
        return;
      }
      setTickets(list.tickets);
      setPagination(list.pagination);
      setStats(summary);
      setError('');
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [session, filters, handleError]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function changeFilters(changes) {
    setFilters((current) => ({ ...current, ...changes, page: 1 }));
  }

  if (!session) {
    return <Login message={sessionMessage} onLogin={(value) => {
      localStorage.setItem('helpdesk-session', JSON.stringify(value));
      setSessionMessage('');
      setSession(value);
    }} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">H</span>
          <div><strong>HELP<span>DESK</span></strong><small>SUPPORT WORKSPACE</small></div>
        </div>
        <div className="header-account">
          <span className="account-name">{session.user.name}</span>
          <button className="ghost" onClick={() => logout()}>Logout</button>
        </div>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SUPPORT WORKSPACE / TICKETS</p>
          <h1>Manage your <span>tickets.</span></h1>
          <p>Keep track of requests and stay up to date on their progress.</p>
        </div>
        <TicketForm session={session} onSaved={() => {
          if (filters.page !== 1) setFilters((current) => ({ ...current, page: 1 }));
          else load();
        }} onError={handleError} />
      </div>
      <div className="workspace-layout">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <span className="sidebar-icon" aria-hidden="true">{session.user.name.charAt(0).toUpperCase()}</span>
            <div className="profile"><strong>{session.user.name}</strong><small>{session.user.role === 'ADMIN' ? 'Administrator' : 'Support user'}</small></div>
          </div>
          <div className="sidebar-section"><p className="eyebrow">WORKSPACE</p><div className="sidebar-active"><span aria-hidden="true">▦</span> Tickets</div></div>
          <div className="sidebar-tip"><strong>Need a hand?</strong><p>Create a ticket and share the details so the support team can help.</p></div>
        </aside>
        <main className="workspace">
          {error && <div className="error" role="alert">{error}</div>}
          <section className="stats" aria-label="Ticket overview">
            <Card label="Total" value={stats?.total} />
            <Card label="Open" value={stats?.open} accent="blue" />
            <Card label="In progress" value={stats?.inProgress} accent="amber" />
            <Card label="Resolved" value={stats?.resolved} accent="green" />
          </section>
          <TicketFilters search={search} setSearch={setSearch} filters={filters} changeFilters={changeFilters} />
          <TicketList
            tickets={tickets}
            loading={loading}
            error={error}
            pagination={pagination}
            page={filters.page}
            onSelect={setSelected}
            onPageChange={(change) => setFilters((current) => ({ ...current, page: current.page + change }))}
          />
        </main>
      </div>
      {selected && <TicketDetail id={selected} session={session} onClose={() => setSelected(null)} onChanged={load} onError={handleError} />}
    </div>
  );
}
