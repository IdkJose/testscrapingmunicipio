'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Persona {
  PE_PERSONA_ID?: string;
  PE_DENOMINACION?: string;
  PE_NOMBRES?: string;
  PE_APELLIDOS?: string;
  PE_NUM_IDENTIFICACION?: string;
  PE_TIP_IDENTIFICACION?: string;
  PE_FECHA_NACIMIENTO?: string;
  PE_ESTADO_CIVIL?: string;
  PE_NOMBRE_CONYUGE?: string;
  PE_CEDULA_CONYUGE?: string;
  PE_TIP_PERSONA?: string;
}

type TipoDocumento = 'C' | 'R' | 'P';

export default function Home() {
  const [identificacion, setIdentificacion] = useState('');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>('C');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const name = localStorage.getItem('user_name');

    if (!token) {
      router.push('/login');
    } else {
      setUserName(name || 'Usuario');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const consultarPersona = async (numDoc: string, tipo: TipoDocumento) => {
    setLoading(true);
    setError(null);
    setPersona(null);

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/persona/consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          strIdentificacion: numDoc,
          strTipoIdentificacion: tipo,
          strAccion: '1',
        }),
      });

      if (res.status === 401) {
        handleLogout();
        throw new Error('Sesión expirada. Inicia sesión de nuevo.');
      }

      const data = await res.json();

      if (!res.ok || (!data.PE_DENOMINACION && !data.PE_NOMBRES)) {
        throw new Error('No se encontraron registros para el documento ingresado.');
      }

      setPersona(data);
    } catch (err: any) {
      setError(err.message || 'Error en el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const docClean = identificacion.trim();
    if (
      (tipoDoc === 'C' && docClean.length === 10) ||
      (tipoDoc === 'R' && docClean.length === 13)
    ) {
      if (!loading) consultarPersona(docClean, tipoDoc);
    }
  }, [identificacion, tipoDoc]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (tipoDoc === 'P') {
      setIdentificacion(val.toUpperCase());
    } else {
      setIdentificacion(val.replace(/\D/g, ''));
    }
  };

  const handleTipoDocChange = (nuevoTipo: TipoDocumento) => {
    setTipoDoc(nuevoTipo);
    setIdentificacion('');
    setPersona(null);
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identificacion.trim()) {
      consultarPersona(identificacion.trim(), tipoDoc);
    }
  };

  const maxLength = tipoDoc === 'C' ? 10 : tipoDoc === 'R' ? 13 : 20;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {/* Header Corporativo */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🏛️</span>
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">
              Consulta de Datos Ciudadanos / RUC
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">
              Sesión: <strong className="text-zinc-200">{userName}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-md transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        
        {/* Formulario */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          
          <div className="flex gap-2 border-b border-zinc-800 pb-3">
            <button
              type="button"
              onClick={() => handleTipoDocChange('C')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tipoDoc === 'C'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              🪪 Cédula (10 dígitos)
            </button>

            <button
              type="button"
              onClick={() => handleTipoDocChange('R')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tipoDoc === 'R'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              🏢 RUC (13 dígitos)
            </button>

            <button
              type="button"
              onClick={() => handleTipoDocChange('P')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tipoDoc === 'P'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              ✈️ Pasaporte
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-medium text-zinc-400 block">
                  {tipoDoc === 'C' ? 'Cédula' : tipoDoc === 'R' ? 'RUC' : 'Pasaporte'}
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {identificacion.length}/{maxLength}
                </span>
              </div>

              <input
                type="text"
                value={identificacion}
                onChange={handleInputChange}
                maxLength={maxLength}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                placeholder={
                  tipoDoc === 'C'
                    ? '1715070197'
                    : tipoDoc === 'R'
                    ? '1715070197001'
                    : 'A12345678'
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identificacion.trim()}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-40 h-10 flex items-center gap-2"
            >
              {loading ? 'Consultando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Ficha Dinámica */}
        {persona ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                {persona.PE_TIP_PERSONA === 'J' ? '🏢 Persona Jurídica (Empresa)' : '👤 Persona Natural'}
              </span>
              <h2 className="text-xl font-bold text-zinc-100 mt-1">
                {persona.PE_DENOMINACION || `${persona.PE_NOMBRES} ${persona.PE_APELLIDOS}`}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Doc.: {persona.PE_NUM_IDENTIFICACION || identificacion} ({persona.PE_TIP_IDENTIFICACION || tipoDoc})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {persona.PE_TIP_PERSONA && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Tipo de Persona</span>
                  <span className="font-medium text-zinc-200">
                    {persona.PE_TIP_PERSONA === 'J' ? '🏢 Jurídica (Empresa)' : '👤 Natural'}
                  </span>
                </div>
              )}

              {persona.PE_DENOMINACION && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Denominación / Razón Social</span>
                  <span className="font-medium text-zinc-200">{persona.PE_DENOMINACION}</span>
                </div>
              )}

              {persona.PE_NOMBRES && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Nombres</span>
                  <span className="font-medium text-zinc-200">{persona.PE_NOMBRES}</span>
                </div>
              )}

              {persona.PE_APELLIDOS && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Apellidos</span>
                  <span className="font-medium text-zinc-200">{persona.PE_APELLIDOS}</span>
                </div>
              )}

              {persona.PE_ESTADO_CIVIL && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Estado Civil</span>
                  <span className="font-medium text-zinc-200">{persona.PE_ESTADO_CIVIL}</span>
                </div>
              )}

              {persona.PE_FECHA_NACIMIENTO && (
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Fecha de Nacimiento</span>
                  <span className="font-medium text-zinc-200">
                    {persona.PE_FECHA_NACIMIENTO?.split('T')[0]}
                  </span>
                </div>
              )}

              {persona.PE_NOMBRE_CONYUGE && (
                <div className="sm:col-span-2 bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
                  <span className="text-xs text-zinc-500 block">Cónyuge</span>
                  <span className="font-medium text-zinc-200">{persona.PE_NOMBRE_CONYUGE}</span>
                  {persona.PE_CEDULA_CONYUGE && (
                    <span className="text-xs text-zinc-500 font-mono block mt-0.5">
                      C.I: {persona.PE_CEDULA_CONYUGE}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-10 text-center text-zinc-500 text-xs">
            Selecciona el tipo de documento e ingresa el número para consultar.
          </div>
        )}
      </main>
    </div>
  );
}
