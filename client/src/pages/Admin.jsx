import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { users } = await api.adminListUsers();
      setUsers(users);
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.adminCreateUser({ email: email.trim().toLowerCase(), password, isAdmin });
      setEmail('');
      setPassword('');
      setIsAdmin(false);
      setMessage('Utente creato ✓');
      await load();
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Eliminare ${u.email}? Verranno cancellati anche i suoi farmaci.`)) return;
    try {
      await api.adminDeleteUser(u.id);
      setMessage('Utente eliminato');
      await load();
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    }
  }

  async function resetPwd(u) {
    const np = prompt(`Nuova password per ${u.email} (min 6):`);
    if (!np) return;
    try {
      await api.adminResetPassword(u.id, np);
      setMessage(`Password aggiornata per ${u.email}`);
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Amministrazione</h1>

      <section className="card mb-4 p-4">
        <h2 className="mb-3 font-semibold">Nuovo utente</h2>
        <form onSubmit={createUser} className="space-y-3">
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            className="input"
            placeholder="Password (min 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            Amministratore
          </label>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creazione...' : 'Crea utente'}
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Utenti ({users.length})</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Caricamento...</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {u.email}
                    {u.isAdmin && (
                      <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-700">
                        admin
                      </span>
                    )}
                    {u.email === user?.email && (
                      <span className="ml-2 text-xs text-slate-400">(tu)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetPwd(u)}
                    className="text-xs text-slate-600 underline"
                  >
                    Reset pwd
                  </button>
                  {u.email !== user?.email && (
                    <button
                      onClick={() => deleteUser(u)}
                      className="text-xs text-red-600 underline"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {message && <p className="mt-3 text-center text-sm text-slate-600">{message}</p>}
      </section>
    </div>
  );
}
