import React, { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onLogin, message }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = register ? form : { email: form.email, password: form.password };
      const data = await api(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(body) });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={submit}>
        <div className="login-brand"><span className="brand-icon" aria-hidden="true">H</span><strong>HELP<span>DESK</span></strong></div>
        <p className="eyebrow">Support portal</p><h1>{register ? 'Create an account' : 'Welcome back'}</h1>
        <p className="login-intro">{register ? 'Get started with your support workspace.' : 'Sign in to manage your support requests.'}</p>
        {(error || message) && <div className="error" role="alert">{error || message}</div>}
        {register && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} minLength="2" maxLength="60" required /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={register ? 8 : 1} maxLength="72" required /></label>
        <button type="submit" disabled={busy}>{busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}</button>
        <p className="auth-switch">{register ? 'Already have an account?' : 'New here?'} <button type="button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Sign in' : 'Create an account'}</button></p>
      </form>
    </div>
  );
}
