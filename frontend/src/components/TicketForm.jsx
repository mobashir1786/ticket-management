import React, { useState } from 'react';
import { api } from '../services/api';
import { CATEGORIES, PRIORITIES, label } from '../utils/tickets';

const emptyTicket = { title: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' };

export default function TicketForm({ session, ticket, onSaved, onError, onCancel }) {
  const [open, setOpen] = useState(Boolean(ticket));
  const [form, setForm] = useState(ticket ? { title: ticket.title, description: ticket.description, category: ticket.category } : emptyTicket);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setError('');
    if (onCancel) onCancel();
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api(ticket ? `/api/tickets/${ticket._id}` : '/api/tickets', {
        method: ticket ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      }, session.token);
      if (!ticket) setForm(emptyTicket);
      close();
      await onSaved();
    } catch (err) {
      if (err.status === 401) onError(err);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    {!ticket && <button onClick={() => setOpen(true)}>+ New ticket</button>}
    {open && <div className="overlay"><form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="ticket-form-title">
      <h2 id="ticket-form-title">{ticket ? 'Edit ticket' : 'Create ticket'}</h2>
      {error && <div className="error" role="alert">{error}</div>}
      <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} minLength="3" maxLength="120" required /></label>
      <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} minLength="10" maxLength="5000" required /></label>
      <div className="row"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select></label>
      {!ticket && <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select></label>}</div>
      <div className="actions"><button type="button" className="ghost" onClick={close}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : ticket ? 'Save changes' : 'Create'}</button></div>
    </form></div>}
  </>;
}
