import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { PRIORITIES, STATUSES, label, userLabel } from '../utils/tickets';
import TicketForm from './TicketForm';
import LoadingIndicator from './LoadingIndicator';

export default function TicketDetail({ id, session, onClose, onChanged, onError }) {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const ticket = await api(`/api/tickets/${id}`, {}, session.token);
      setData(ticket);
      setError('');
    } catch (err) {
      if (err.status === 401) onError(err);
      else setError(err.message);
    }
  }, [id, session.token, onError]);
  useEffect(() => { load(); }, [load]);

  async function update(body) {
    setBusy('Updating ticket...');
    try {
      await api(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, session.token);
      await load();
      await onChanged();
    } catch (err) {
      if (err.status === 401) onError(err);
      else setError(err.message);
    } finally { setBusy(''); }
  }

  async function comment(event) {
    event.preventDefault();
    setBusy('Adding comment...');
    try {
      await api(`/api/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) }, session.token);
      setMessage('');
      await load();
    } catch (err) {
      if (err.status === 401) onError(err);
      else setError(err.message);
    } finally { setBusy(''); }
  }

  async function remove() {
    if (!window.confirm('Delete this ticket and its comments?')) return;
    setBusy('Deleting ticket...');
    try {
      await api(`/api/tickets/${id}`, { method: 'DELETE' }, session.token);
      onClose();
      await onChanged();
    } catch (err) {
      if (err.status === 401) onError(err);
      else setError(err.message);
    } finally { setBusy(''); }
  }

  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
    <div className="detail" role="dialog" aria-modal="true" aria-label="Ticket details" aria-busy={Boolean(busy)}>
      <button className="close" aria-label="Close ticket details" onClick={onClose} disabled={Boolean(busy)}>×</button>
      <section>
        {error && <div className="error" role="alert">{error}</div>}
        {!data && !error && <LoadingIndicator>Loading ticket...</LoadingIndicator>}
        {busy && <div className="operation-loading"><LoadingIndicator>{busy}</LoadingIndicator></div>}
        {data && <>
          <p className="eyebrow">{label(data.category)}</p>
          <h2>{data.title}</h2>
          <p>{data.description}</p>
          <div className="detail-meta">
            <span className={`badge ${data.status.toLowerCase()}`}>{label(data.status)}</span>
            <span>{label(data.priority)} priority</span><span>Created by: {userLabel(data.createdBy)}</span>
          </div>
          {session.user.role === 'ADMIN' && <div className="admin-controls">
            <label>Status: <select aria-label="Ticket status" value={data.status} disabled={Boolean(busy)} onChange={(e) => update({ status: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select></label>
            <label>Priority: <select aria-label="Ticket priority" value={data.priority} disabled={Boolean(busy)} onChange={(e) => update({ priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select></label>
          </div>}
          {session.user.role === 'USER' && data.status === 'OPEN' && <div className="ticket-actions"><button className="ghost" disabled={busy} onClick={() => setEditing(true)}>Edit ticket</button><button className="danger" disabled={busy} onClick={remove}>Delete ticket</button></div>}
          <h3>Comments</h3>
          <div className="comments">{data.comments.length ? data.comments.map((c) => <article key={c._id}><strong>{userLabel(c.userId)}</strong><p>{c.message}</p></article>) : <p className="muted">No comments yet.</p>}</div>
          {data.status !== 'CLOSED' ? <form className="comment-form" onSubmit={comment}><input aria-label="Comment" placeholder="Add a comment..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength="1000" disabled={Boolean(busy)} required /><button disabled={Boolean(busy)}>Send</button></form> : <p className="muted">Comments are closed for this ticket.{session.user.role === 'USER' && ' Contact an admin for further help.'}</p>}
        </>}
      </section>
      {data && <aside className="timeline"><h3>Activity timeline</h3>{data.activity.length ? data.activity.map((a) => <article key={a._id}><span>{label(a.action)}</span><p>{a.details}</p><small>{userLabel(a.actorId)} · {new Date(a.createdAt).toLocaleString()}</small></article>) : <p className="muted">No activity yet.</p>}</aside>}
    </div>
    {editing && <TicketForm ticket={data} session={session} onCancel={() => setEditing(false)} onError={onError} onSaved={async () => { await load(); await onChanged(); }} />}
  </div>;
}
