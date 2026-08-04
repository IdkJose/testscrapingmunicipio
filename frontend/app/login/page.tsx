'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para solicitar acceso
  const [showModal, setShowModal] = useState(false);
  const [nombreReq, setNombreReq] = useState('');
  const [emailReq, setEmailReq] = useState('');
  const [motivoReq, setMotivoReq] = useState('');
  const [loadingReq, setLoadingReq] = useState(false);
  const [msgReq, setMsgReq] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_name', data.user.name);

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingReq(true);
    setMsgReq(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/solicitar-acceso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombreReq,
          email: emailReq,
          motivo: motivoReq,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al enviar la solicitud.');
      }

      setMsgReq({ type: 'success', text: data.message });
      setNombreReq('');
      setEmailReq('');
      setMotivoReq('');
    } catch (err: any) {
      setMsgReq({ type: 'error', text: err.message || 'Error al conectar' });
    } finally {
      setLoadingReq(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-2xl mb-2">
            🏛️
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Perfilador de Datos 360°
          </h1>
          <p className="text-xs text-zinc-400">
            Ingresa con tus credenciales de usuario autorizado
          </p>
        </div>

        {/* Alerta de Error Login */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center">
            {error}
          </div>
        )}

        {/* Formulario Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 block">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="usuario@dominio.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 block">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 mt-2 shadow"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Botón para solicitar acceso */}
        <div className="pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-400 mb-2">¿No tienes cuenta aún?</p>
          <button
            onClick={() => {
              setShowModal(true);
              setMsgReq(null);
            }}
            className="text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
          >
            📩 Solicitar Acceso al Administrador
          </button>
        </div>
      </div>

      {/* MODAL SOLICITAR ACCESO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>📩</span> Solicitud de Acceso
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {msgReq && (
              <div
                className={`p-3 rounded-lg text-xs text-center ${
                  msgReq.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {msgReq.text}
              </div>
            )}

            <form onSubmit={handleSolicitarAcceso} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 block">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombreReq}
                  onChange={(e) => setNombreReq(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 block">
                  Tu Correo Electrónico
                </label>
                <input
                  type="email"
                  value={emailReq}
                  onChange={(e) => setEmailReq(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  placeholder="juan@empresa.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 block">
                  Motivo de la solicitud / Organización
                </label>
                <textarea
                  value={motivoReq}
                  onChange={(e) => setMotivoReq(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  placeholder="Explica brevemente para qué requieres el acceso..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2 rounded-lg text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingReq}
                  className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {loadingReq ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
