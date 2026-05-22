import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const emptyForm = {
  name: '',
  dosage: '',
  times: ['08:00'],
  reminderIntervalMinutes: 10,
  reminderMaxCount: 3,
};

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { medications } = await api.listMedications();
      setMeds(medications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing('new');
    setForm(emptyForm);
    setError('');
  }

  function openEdit(med) {
    setEditing(med.id);
    setForm({
      name: med.name,
      dosage: med.dosage || '',
      times: med.times.length ? med.times : ['08:00'],
      reminderIntervalMinutes: med.reminderIntervalMinutes,
      reminderMaxCount: med.reminderMaxCount,
    });
    setError('');
  }

  function close() {
    setEditing(null);
    setForm(emptyForm);
  }

  function updateTime(i, value) {
    const times = [...form.times];
    times[i] = value;
    setForm({ ...form, times });
  }

  function addTime() {
    setForm({ ...form, times: [...form.times, '08:00'] });
  }

  function removeTime(i) {
    if (form.times.length === 1) return;
    setForm({ ...form, times: form.times.filter((_, idx) => idx !== i) });
  }

  async function save() {
    setError('');
    try {
      if (editing === 'new') {
        await api.createMedication(form);
      } else {
        await api.updateMedication(editing, form);
      }
      close();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Eliminare questo farmaco?')) return;
    try {
      await api.deleteMedication(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (editing) {
    return (
      <div className="px-4 pt-6 pb-4">
        <header className="mb-4 flex items-center justify-between">
          <button onClick={close} className="btn-ghost px-0">
            ← Indietro
          </button>
          <h1 className="text-lg font-bold">
            {editing === 'new' ? 'Nuovo farmaco' : 'Modifica farmaco'}
          </h1>
          <div className="w-16" />
        </header>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Es. Tachipirina"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Dosaggio (opzionale)</label>
            <input
              className="input"
              value={form.dosage}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              placeholder="Es. 500mg, 1 compressa"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Orari</label>
            <div className="space-y-2">
              {form.times.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="time"
                    className="input flex-1"
                    value={t}
                    onChange={(e) => updateTime(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    disabled={form.times.length === 1}
                    className="btn-danger shrink-0 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addTime} className="btn-ghost w-full border-2 border-dashed border-brand-200">
                + Aggiungi orario
              </button>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-medium">Promemoria automatici</h3>
            <p className="mb-3 text-sm text-slate-500">
              Se non confermi di aver preso il farmaco, ricevi promemoria aggiuntivi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-600">
                  Ogni X minuti
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  className="input"
                  value={form.reminderIntervalMinutes}
                  onChange={(e) =>
                    setForm({ ...form, reminderIntervalMinutes: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">
                  Max ripetizioni
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="input"
                  value={form.reminderMaxCount}
                  onChange={(e) =>
                    setForm({ ...form, reminderMaxCount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button onClick={save} className="btn-primary w-full" disabled={!form.name.trim()}>
            Salva
          </button>
          {editing !== 'new' && (
            <button onClick={() => remove(editing)} className="btn-danger w-full">
              Elimina farmaco
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Farmaci</h1>
        <button onClick={openNew} className="btn-primary">
          + Nuovo
        </button>
      </header>

      {loading && <p className="text-center text-slate-500">Caricamento...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && meds.length === 0 && (
        <div className="card mt-8 p-6 text-center">
          <p className="text-slate-500">Nessun farmaco. Tocca "+ Nuovo" per iniziare.</p>
        </div>
      )}

      <div className="space-y-3">
        {meds.map((m) => (
          <button
            key={m.id}
            onClick={() => openEdit(m)}
            className="card w-full p-4 text-left active:bg-slate-50"
          >
            <div className="font-semibold">{m.name}</div>
            {m.dosage && <div className="text-sm text-slate-500">{m.dosage}</div>}
            <div className="mt-2 flex flex-wrap gap-1">
              {m.times.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Promemoria: ogni {m.reminderIntervalMinutes} min · max {m.reminderMaxCount}×
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
