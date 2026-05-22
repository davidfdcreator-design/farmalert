import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') {
      setStatus('denied');
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub && perm === 'granted') {
      try { await api.subscribe(sub.toJSON()); } catch {}
      setStatus('subscribed');
    } else if (perm === 'granted') {
      await subscribe();
    } else {
      setStatus('not-subscribed');
    }
  }

  async function subscribe() {
    setMessage('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'not-subscribed');
        return;
      }
      const { publicKey } = await api.vapidKey();
      if (!publicKey) {
        setMessage('Server non ha le chiavi VAPID configurate');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await api.subscribe(sub.toJSON());
      setStatus('subscribed');
      setMessage('Notifiche attivate ✓');
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    }
  }

  async function sendTest() {
    setMessage('');
    try {
      const res = await api.testNotification();
      setMessage(`Inviata a ${res.sent} dispositivo/i`);
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    }
  }

  function doLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Profilo</h1>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-semibold">Notifiche push</h2>

        {status === 'checking' && <p className="text-slate-500">Verifica in corso...</p>}

        {status === 'unsupported' && (
          <p className="text-sm text-red-600">
            Questo browser non supporta le notifiche push.
          </p>
        )}

        {status === 'denied' && (
          <p className="text-sm text-red-600">
            Hai bloccato le notifiche. Sblocca dal menù del browser (lucchetto in alto) e riprova.
          </p>
        )}

        {status === 'not-subscribed' && (
          <>
            <p className="mb-3 text-sm text-slate-500">
              Attiva le notifiche per ricevere i promemoria su questo dispositivo.
            </p>
            <button onClick={subscribe} className="btn-primary w-full">
              Attiva notifiche
            </button>
          </>
        )}

        {status === 'subscribed' && (
          <>
            <p className="mb-3 text-sm text-green-700">
              ✓ Notifiche attive su questo dispositivo
            </p>
            <button onClick={sendTest} className="btn-ghost w-full border border-brand-200">
              Invia notifica di test
            </button>
          </>
        )}

        {message && <p className="mt-3 text-center text-sm text-slate-600">{message}</p>}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Account</h2>
        <button onClick={doLogout} className="btn-danger w-full">
          Esci
        </button>
      </section>

      <p className="mt-8 text-center text-xs text-slate-400">FarmaAlert v1.0</p>
    </div>
  );
}
