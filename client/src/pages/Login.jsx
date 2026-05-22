import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message === 'wrong password' ? 'Password errata' : 'Errore di accesso');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-600 text-4xl text-white">
          💊
        </div>
        <h1 className="text-2xl font-bold">FarmaAlert</h1>
        <p className="mt-2 text-slate-500">Inserisci la password per accedere</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          inputMode="text"
          autoComplete="current-password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy || !password}>
          {busy ? 'Accesso...' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
