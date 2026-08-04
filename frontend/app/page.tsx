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

interface SriData {
  numeroRuc?: string;
  razonSocial?: string;
  estadoContribuyenteRuc?: string;
  actividadEconomicaPrincipal?: string;
  tipoContribuyente?: string;
  regimen?: string;
  obligadoLlevarContabilidad?: string;
  agenteRetencion?: string;
  contribuyenteEspecial?: string;
  contribuyenteFantasma?: string;
  informacionFechasContribuyente?: {
    fechaInicioActividades?: string;
  };
}

interface CompaniaSupercias {
  expediente?: string;
  nombreCompania?: string;
  cargo?: string;
  estadoCompania?: string;
}

interface AntData {
  puntos?: number;
  tipoLicencia?: string;
  totalMultas?: number;
  valorPendientePago?: number;
}


type TipoDocumento = 'C' | 'R' | 'P';
type TabActiva = 'municipio' | 'sri' | 'supercias' | 'ant';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function Home() {

  const [identificacion, setIdentificacion] = useState('');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>('C');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [sri, setSri] = useState<SriData | null>(null);
  const [companias, setCompanias] = useState<CompaniaSupercias[]>([]);
  const [ant, setAnt] = useState<AntData | null>(null);
  const [tabActiva, setTabActiva] = useState<TabActiva>('municipio');

  const [loading, setLoading] = useState(false);
  const [loadingSri, setLoadingSri] = useState(false);
  const [loadingSupercias, setLoadingSupercias] = useState(false);
  const [loadingAnt, setLoadingAnt] = useState(false);
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

  const consultarTodo = async (numDoc: string, tipo: TipoDocumento) => {
    setLoading(true);
    setLoadingSri(true);
    setLoadingSupercias(true);
    setLoadingAnt(true);
    setError(null);
    setPersona(null);
    setSri(null);
    setCompanias([]);
    setAnt(null);

    const token = localStorage.getItem('auth_token');

    // 1. Municipio de Quito
    try {
      const res = await fetch(`${API_BASE}/persona/consultar`, {
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
      if (res.ok && (data.PE_DENOMINACION || data.PE_NOMBRES)) {
        setPersona(data);
      } else {
        setError('No se encontraron registros en el Municipio para este documento.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
    } finally {
      setLoading(false);
    }

    // 2. SRI Catastro Oficial
    try {
      const resSri = await fetch(`${API_BASE}/sri/consultar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ numDoc }),
      });

      if (resSri.ok) {
        const dataSri = await resSri.json();
        if (dataSri.existe && dataSri.datos) {
          setSri(dataSri.datos);
        }
      }
    } catch (err) {
      console.error('Error al consultar el SRI:', err);
    } finally {
      setLoadingSri(false);
    }

    // 3. SUPERCIAS
    try {
      const resSuper = await fetch(`${API_BASE}/supercias/consultar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ numDoc }),
      });

      if (resSuper.ok) {
        const dataSuper = await resSuper.json();
        if (dataSuper.companias && Array.isArray(dataSuper.companias)) {
          setCompanias(dataSuper.companias);
        }
      }
    } catch (err) {
      console.error('Error al consultar SUPERCIAS:', err);
    } finally {
      setLoadingSupercias(false);
    }

    // 4. ANT (Agencia Nacional de Tránsito)
    try {
      const resAnt = await fetch(`${API_BASE}/ant/consultar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cedula: numDoc }),
      });


      if (resAnt.ok) {
        const dataAnt = await resAnt.json();
        if (dataAnt.datos) {
          setAnt(dataAnt.datos);
        }
      }
    } catch (err) {
      console.error('Error al consultar la ANT:', err);
    } finally {
      setLoadingAnt(false);
    }
  };

  useEffect(() => {
    const docClean = identificacion.trim();
    if (
      (tipoDoc === 'C' && docClean.length === 10) ||
      (tipoDoc === 'R' && docClean.length === 13)
    ) {
      if (!loading) consultarTodo(docClean, tipoDoc);
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
    setSri(null);
    setCompanias([]);
    setAnt(null);
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identificacion.trim()) {
      consultarTodo(identificacion.trim(), tipoDoc);
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
              Perfilador 360° (Municipio + SRI + SUPERCIAS + ANT)
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

        {/* Resultados */}
        {(persona || sri) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
            
            {/* Pestañas */}
            <div className="flex gap-4 border-b border-zinc-800 pb-3">
              <button
                onClick={() => setTabActiva('municipio')}
                className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 ${
                  tabActiva === 'municipio'
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🏛️ Ficha Municipal
              </button>

              <button
                onClick={() => setTabActiva('sri')}
                className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  tabActiva === 'sri'
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🧾 Ficha SRI</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
                  {loadingSri ? '...' : sri ? sri.estadoContribuyenteRuc : 'N/A'}
                </span>
              </button>

              <button
                onClick={() => setTabActiva('supercias')}
                className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  tabActiva === 'supercias'
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🏢 SUPERCIAS</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
                  {loadingSupercias ? '...' : companias.length}
                </span>
              </button>

              <button
                onClick={() => setTabActiva('ant')}
                className={`text-xs font-semibold pb-1.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  tabActiva === 'ant'
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🚗 ANT (Licencia/Puntos)</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
                  {loadingAnt ? '...' : ant ? `${ant.puntos || 30} pts` : 'N/A'}
                </span>
              </button>
            </div>

            {/* TAB 1: Municipio */}
            {tabActiva === 'municipio' && persona && (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                    {persona.PE_TIP_PERSONA === 'J' ? '🏢 Persona Jurídica' : '👤 Persona Natural'}
                  </span>
                  <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                    {persona.PE_DENOMINACION || `${persona.PE_NOMBRES} ${persona.PE_APELLIDOS}`}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {persona.PE_DENOMINACION && (
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Razón Social</span>
                      <span className="font-medium text-zinc-200">{persona.PE_DENOMINACION}</span>
                    </div>
                  )}
                  {persona.PE_NOMBRES && (
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Nombres</span>
                      <span className="font-medium text-zinc-200">{persona.PE_NOMBRES}</span>
                    </div>
                  )}
                  {persona.PE_APELLIDOS && (
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Apellidos</span>
                      <span className="font-medium text-zinc-200">{persona.PE_APELLIDOS}</span>
                    </div>
                  )}
                  {persona.PE_ESTADO_CIVIL && (
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Estado Civil</span>
                      <span className="font-medium text-zinc-200">{persona.PE_ESTADO_CIVIL}</span>
                    </div>
                  )}
                  {persona.PE_FECHA_NACIMIENTO && (
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Fecha Nacimiento</span>
                      <span className="font-medium text-zinc-200">{persona.PE_FECHA_NACIMIENTO?.split('T')[0]}</span>
                    </div>
                  )}
                  {persona.PE_NOMBRE_CONYUGE && (
                    <div className="sm:col-span-2 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-500 block">Cónyuge</span>
                      <span className="font-medium text-zinc-200">{persona.PE_NOMBRE_CONYUGE}</span>
                      {persona.PE_CEDULA_CONYUGE && (
                        <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                          C.I: {persona.PE_CEDULA_CONYUGE}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SRI */}
            {tabActiva === 'sri' && (
              <div className="space-y-4">
                {loadingSri ? (
                  <p className="text-xs text-zinc-400">Obteniendo ficha completa del SRI...</p>
                ) : sri ? (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                          ESTADO RUC: {sri.estadoContribuyenteRuc}
                        </span>
                        <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                          {sri.razonSocial}
                        </h2>
                        <p className="text-xs text-zinc-400 font-mono">RUC: {sri.numeroRuc}</p>
                      </div>
                      <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-medium px-2.5 py-1 rounded-full">
                        {sri.tipoContribuyente}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="sm:col-span-2 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Actividad Económica Principal</span>
                        <span className="font-medium text-zinc-200">{sri.actividadEconomicaPrincipal || 'No especificada'}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Régimen Tributario</span>
                        <span className="font-medium text-zinc-200">{sri.regimen || 'GENERAL'}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Obligado a Llevar Contabilidad</span>
                        <span className="font-semibold text-zinc-200">{sri.obligadoLlevarContabilidad}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Agente de Retención</span>
                        <span className="font-medium text-zinc-200">{sri.agenteRetencion}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Contribuyente Especial</span>
                        <span className="font-medium text-zinc-200">{sri.contribuyenteEspecial}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Contribuyente Fantasma</span>
                        <span className={`font-semibold ${sri.contribuyenteFantasma === 'SI' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {sri.contribuyenteFantasma}
                        </span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Fecha Inicio de Actividades</span>
                        <span className="font-medium text-zinc-200">
                          {sri.informacionFechasContribuyente?.fechaInicioActividades?.split(' ')[0] || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg">
                    No se registra información tributaria en el SRI para este documento.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SUPERCIAS */}
            {tabActiva === 'supercias' && (
              <div className="space-y-4">
                {loadingSupercias ? (
                  <p className="text-xs text-zinc-400">Consultando registros en la Superintendencia de Compañías...</p>
                ) : companias.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 mb-2">
                      Se registraron <strong>{companias.length}</strong> participaciones o cargos en compañías:
                    </p>
                    {companias.map((c, idx) => (
                      <div key={idx} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-400 text-sm">
                            {c.nombreCompania}
                          </span>
                          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-full text-zinc-300">
                            {c.cargo || 'Socio / Accionista'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[11px] text-zinc-400 pt-1">
                          <span>Expediente: {c.expediente || 'N/A'}</span>
                          <span>Estado: {c.estadoCompania || 'ACTIVA'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg">
                    No se registran cargos ni participaciones accionarias en la Superintendencia de Compañías.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ANT */}
            {tabActiva === 'ant' && (
              <div className="space-y-4">
                {loadingAnt ? (
                  <p className="text-xs text-zinc-400">Consultando estado de puntos y licencias en la ANT...</p>
                ) : ant ? (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                          LICENCIA Y TRÁNSITO
                        </span>
                        <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                          Agencia Nacional de Tránsito
                        </h2>
                      </div>
                      <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                        {ant.puntos ?? 30} / 30 Puntos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Puntos en la Licencia</span>
                        <span className="font-bold text-emerald-400 text-sm">{ant.puntos ?? 30} Puntos</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Tipo de Licencia</span>
                        <span className="font-medium text-zinc-200">{ant.tipoLicencia || 'Tipo B (Particular)'}</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Citaciones / Multas Pendientes</span>
                        <span className="font-medium text-zinc-200">{ant.totalMultas ?? 0} Citaciones</span>
                      </div>

                      <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                        <span className="text-zinc-500 block">Valor Pendiente de Pago</span>
                        <span className="font-semibold text-zinc-200">${ant.valorPendientePago ?? '0.00'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg">
                    No se registra infracciones ni citaciones pendientes en la Agencia Nacional de Tránsito (ANT).
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
