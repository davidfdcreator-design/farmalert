import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function formatDate(d) {
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function Home() {
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const { doses } = await api.today();
      setDoses(doses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  async function take(dose) {
    try {
      await api.take(dose.medicationId, dose.scheduledAt);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const today = new Date();

  return (
    <div className="px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Oggi</h1>
        <p className="capitalize text-slate-500">{formatDate(today)}</p>
      </header>

      {loading && <p className="text-center text-slate-500">Caricamento...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && doses.length === 0 && (
        <div className="card mt-8 p-6 text-center">
          <p className="text-slate-500">Nessun farmaco da prendere oggi.</p>
          <p className="mt-2 text-sm text-slate-400">
            Vai in "Farmaci" per aggiungerne uno.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {doses.map((d) => (
          <div
            key={`${d.medicationId}-${d.scheduledAt}`}
            className={`card p-4 ${d.taken ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{d.time}</span>
                  {d.taken && <span className="text-sm text-green-600">✓ preso</span>}
                </div>
                <p className="truncate font-medium">{d.name}</p>
                {d.dosage && <p className="text-sm text-slate-500">{d.dosage}</p>}
              </div>
              {!d.taken && (
                <button onClick={() => take(d)} className="btn-primary shrink-0">
                  Ho preso
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
