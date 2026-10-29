import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Car,
  DollarSign,
  AlertTriangle,
  Send,
  Trash2,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  ChevronDown,
  Building2,
  ExternalLink,
  Lock,
  User,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ClientProfile, ProposalComparison, ComparisonResult, UploadedFile, AuthUser } from './types';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form state
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginContrasena, setLoginContrasena] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Change password form state (when debeCambiarClave is true)
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [cambiarClaveError, setCambiarClaveError] = useState<string | null>(null);
  const [isChangingClave, setIsChangingClave] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Files state (1 to 3 proposals)
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  // Client profile state
  const [profile, setProfile] = useState<ClientProfile>({
    nombre: '',
    vehiculo: '',
    presupuesto: 400000,
    coberturasObligatorias: {
      colision: true,
      robo: true,
      asistenciaVial: true,
      fenomenosNaturales: false,
      vehiculoSustituto: false,
    },
    prioridades: '',
    formaPago: 'Mensual',
  });

  // Comparison & UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Check existing session on load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsCheckingAuth(true);
      const res = await fetch('/api/yo');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsuario.trim() || !loginContrasena) {
      setLoginError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: loginUsuario.trim(),
          contrasena: loginContrasena,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'usuario o contraseña incorrectos');
        return;
      }

      setCurrentUser(data.user);
      setLoginContrasena('');
    } catch {
      setLoginError('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      setResult(null);
      setFiles([]);
    }
  };

  // Handle Password Change submission (required when debeCambiarClave is true)
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCambiarClaveError(null);

    if (nuevaClave.length < 8) {
      setCambiarClaveError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (!/\d/.test(nuevaClave)) {
      setCambiarClaveError('La contraseña debe contener al menos un número.');
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setCambiarClaveError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsChangingClave(true);
      const res = await fetch('/api/cambiar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaClave }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCambiarClaveError(data.error || 'Error al cambiar la contraseña.');
        return;
      }

      // Updated user has debeCambiarClave = false
      setCurrentUser(data.user);
      setNuevaClave('');
      setConfirmarClave('');
    } catch {
      setCambiarClaveError('Error de red al actualizar la contraseña.');
    } finally {
      setIsChangingClave(false);
    }
  };

  // Load sample demo files from server
  const handleLoadSamples = async () => {
    try {
      setIsLoadingSamples(true);
      setAnalysisError(null);
      const res = await fetch('/api/sample-proposals');
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      if (!res.ok) throw new Error('No se pudieron obtener las propuestas de demostración.');
      const data = await res.json();
      if (data.proposals && Array.isArray(data.proposals)) {
        const loaded = data.proposals.map((p: any) => ({
          id: p.id,
          name: p.name,
          base64: p.base64,
          size: p.size,
          isSample: true,
        }));
        setFiles(loaded);
        setProfile({
          nombre: 'Laura Solís Vargas',
          vehiculo: 'Toyota Corolla XEi 2022 (Particular)',
          presupuesto: 400000,
          coberturasObligatorias: {
            colision: true,
            robo: true,
            asistenciaVial: true,
            fenomenosNaturales: false,
            vehiculoSustituto: false,
          },
          prioridades: 'Deducibles cómodos y buen servicio de asistencia vial en carretera sin exceder el presupuesto de ₡ 400.000.',
          formaPago: 'Mensual',
        });
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error al cargar ejemplos');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handlePrefillProfile = () => {
    setProfile({
      nombre: 'Laura Solís Vargas',
      vehiculo: 'Toyota Corolla XEi 2022 (Particular)',
      presupuesto: 400000,
      coberturasObligatorias: {
        colision: true,
        robo: true,
        asistenciaVial: true,
        fenomenosNaturales: false,
        vehiculoSustituto: false,
      },
      prioridades: 'Deducibles razonables y respaldo de grúa y asistencia en todo el país sin exceder ₡ 400.000.',
      formaPago: 'Mensual',
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files);
    await processIncomingFiles(incomingFiles);
    e.target.value = '';
  };

  const processIncomingFiles = async (incomingFiles: File[]) => {
    const pdfFiles = incomingFiles.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      setAnalysisError('Por favor selecciona únicamente archivos en formato PDF.');
      return;
    }

    if (files.length + pdfFiles.length > 3) {
      setAnalysisError('Se permite un máximo de 3 propuestas para comparar simultáneamente.');
    }

    const availableSlots = 3 - files.length;
    const filesToProcess = pdfFiles.slice(0, availableSlots);

    const converted: UploadedFile[] = [];
    for (const f of filesToProcess) {
      try {
        const base64 = await fileToBase64(f);
        converted.push({
          id: Math.random().toString(36).substring(2, 9),
          name: f.name,
          base64,
          size: f.size,
          isSample: false,
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    setFiles((prev) => [...prev, ...converted]);
    setAnalysisError(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      await processIncomingFiles(droppedFiles);
    }
  };

  const handleCompare = async () => {
    if (files.length === 0) {
      setAnalysisError('Debe subir al menos 1 archivo PDF de propuesta para comparar.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, base64: f.base64 })),
          profile,
        }),
      });

      if (response.status === 401) {
        setCurrentUser(null);
        setAnalysisError('Sesión expirada. Por favor inicie sesión nuevamente.');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar las propuestas con IA.');
      }

      setResult(data);
      setTimeout(() => {
        const el = document.getElementById('seccion-resultado');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyMessage = () => {
    if (!result?.mensajeWhatsApp) return;
    navigator.clipboard.writeText(result.mensajeWhatsApp);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- VIEW 1: LOADING SESSION CHECK ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-emerald-500 flex items-center justify-center shadow-lg font-black text-2xl tracking-tight mb-4 animate-pulse">
          JB
        </div>
        <p className="text-sm font-medium text-slate-300">Iniciando sistema Corredora JB...</p>
      </div>
    );
  }

  // --- VIEW 2: LOGIN SCREEN (NO GOOGLE, NO EMAIL) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-blue-900 to-indigo-900" />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-emerald-500 flex items-center justify-center shadow-md font-black text-3xl tracking-tight text-white mx-auto mb-3">
                JB
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Corredora JB
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Sistema de Comparación de Propuestas de Seguros
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
                  <p className="text-xs text-slate-500">Acceso exclusivo para personal autorizado</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* Error message alert */}
              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Field: Usuario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usuario
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="ej. admin"
                      value={loginUsuario}
                      onChange={(e) => setLoginUsuario(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Nombre de usuario (sin correo electrónico)</p>
                </div>

                {/* Field: Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={loginContrasena}
                      onChange={(e) => setLoginContrasena(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-900/10 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Entrar</span>
                    </>
                  )}
                </button>
              </form>

              {/* Informative Security Banner */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-700">Acceso restringido</p>
                  <p className="mt-0.5">
                    Las cuentas son gestionadas por el administrador de Corredora JB. No existe autoregistro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Borrador generado con IA. Debe ser validado por un asesor contra las condiciones reales de la póliza. No suba datos reales de clientes.
          </p>
        </footer>
      </div>
    );
  }

  // --- VIEW 3: MANDATORY PASSWORD CHANGE SCREEN (debeCambiarClave === true) ---
  if (currentUser.debeCambiarClave) {
    const isLengthValid = nuevaClave.length >= 8;
    const hasNumber = /\d/.test(nuevaClave);
    const passwordsMatch = nuevaClave.length > 0 && nuevaClave === confirmarClave;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-blue-900 to-indigo-900" />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md mx-auto mb-3">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cambio obligatorio de contraseña
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Hola <strong>{currentUser.nombre}</strong> (@{currentUser.usuario}). Al ser tu primer ingreso debes definir una nueva contraseña personal.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              {cambiarClaveError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{cambiarClaveError}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 8 caracteres y un número"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita la nueva contraseña"
                    value={confirmarClave}
                    onChange={(e) => setConfirmarClave(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium"
                  />
                </div>

                {/* Validation checklist */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className={`flex items-center gap-2 ${isLengthValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {isLengthValid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 text-center leading-none">·</span>}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 text-center leading-none">·</span>}
                    <span>Al menos un número</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 text-center leading-none">·</span>}
                    <span>Las contraseñas coinciden</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingClave || !isLengthValid || !hasNumber || !passwordsMatch}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingClave ? (
                    <span>Actualizando contraseña...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Actualizar contraseña y entrar</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cerrar sesión y salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 4: MAIN COMPARATOR APP (AUTHENTICATED & ACTIVE) ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Banner / Corporate Accent */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-blue-900 to-indigo-900" />

      {/* Main Header with User Info & Logout Button (Rule 8) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-emerald-500 flex items-center justify-center shadow-inner text-white font-black text-xl tracking-tight">
                JB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Comparador de Propuestas
                  </h1>
                  <span className="bg-blue-800/80 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-700/60 hidden sm:inline-block">
                    Corredora JB · Costa Rica
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Compara propuestas de seguro de automóvil en minutos. La IA prepara, el asesor decide.
                </p>
              </div>
            </div>

            {/* User Session & Demo Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleLoadSamples}
                disabled={isLoadingSamples || isAnalyzing}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Carga automáticamente las 3 cotizaciones académicas (Cordillera, Alborada y Protectora del Valle)"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                {isLoadingSamples ? 'Cargando cotizaciones...' : 'Cargar 3 cotizaciones demo'}
              </button>

              {/* User badge + Logout Button */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight">{currentUser.nombre}</p>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {currentUser.rol} (@{currentUser.usuario})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-200 transition-all border border-slate-700 active:scale-95"
                  title="Cerrar sesión de Corredora JB"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification if any */}
        {analysisError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-rose-900">Atención requerida:</p>
              <p>{analysisError}</p>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Input Configuration Grid (Sections 1 & 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SECCIÓN 1: PROPUESTAS (PDF UPLOAD) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Propuestas (Archivos PDF)
                  </h2>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {files.length} de 3 cargados
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Sube de 1 a 3 archivos PDF emitidos por las aseguradoras (ej. Aseguradora Cordillera, Seguros Alborada, Protectora del Valle).
              </p>

              {/* Upload Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
                    : files.length >= 3
                    ? 'border-slate-200 bg-slate-50/80 cursor-not-allowed opacity-75'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="file"
                  id="pdf-upload-input"
                  accept="application/pdf"
                  multiple
                  disabled={files.length >= 3}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-blue-900">
                      {files.length >= 3 ? 'Límite alcanzado (máx. 3)' : 'Haz clic para subir o arrastra aquí'}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">Formatos soportados: PDF (hasta 20 MB c/u)</p>
                  </div>
                </div>
              </div>

              {/* Uploaded File List */}
              <div className="mt-4 flex-1">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Propuestas preparadas:</span>
                  {files.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Quitar todas
                    </button>
                  )}
                </div>

                {files.length === 0 ? (
                  <div className="p-5 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      No has subido propuestas todavía.
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadSamples}
                      className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
                    >
                      O carga los 3 PDF de ejemplo con un clic
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {files.map((file, index) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {file.isSample ? 'Ejemplo del sistema' : 'Archivo cargado'}
                              {file.size ? ` · ${(file.size / 1024).toFixed(1)} KB` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PERFIL DEL CLIENTE */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Perfil del cliente
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handlePrefillProfile}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                  title="Rellenar campos con el perfil de Laura Solís"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Llenar datos de ejemplo
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre del asegurado(a)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Laura Solís Vargas"
                      value={profile.nombre}
                      onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                  </div>

                  {/* Vehículo y uso */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehículo y uso
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Toyota Corolla XEi 2022, Particular"
                      value={profile.vehiculo}
                      onChange={(e) => setProfile({ ...profile, vehiculo: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Presupuesto máximo anual */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Presupuesto máximo anual (colones)</span>
                      <span className="text-blue-900 font-mono font-bold">
                        ₡ {Number(profile.presupuesto || 0).toLocaleString('es-CR')}
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₡</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={profile.presupuesto || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, presupuesto: Math.max(0, Number(e.target.value) || 0) })
                        }
                        placeholder="400000"
                        className="w-full pl-8 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Forma de pago preferida */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Forma de pago preferida
                    </label>
                    <select
                      value={profile.formaPago}
                      onChange={(e) => setProfile({ ...profile, formaPago: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
                    >
                      <option value="Mensual">Mensual (cuotas)</option>
                      <option value="Anual de contado">Anual de contado</option>
                      <option value="Semestral">Semestral (2 cuotas)</option>
                      <option value="Trimestral">Trimestral (4 cuotas)</option>
                    </select>
                  </div>
                </div>

                {/* Coberturas obligatorias (Casillas) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Coberturas obligatorias para el cliente:</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (Para semáforo verde deben estar incluidas en la prima base)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={profile.coberturasObligatorias.colision}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            coberturasObligatorias: {
                              ...profile.coberturasObligatorias,
                              colision: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>Colisión y vuelco</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={profile.coberturasObligatorias.robo}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            coberturasObligatorias: {
                              ...profile.coberturasObligatorias,
                              robo: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>Robo</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={profile.coberturasObligatorias.asistenciaVial}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            coberturasObligatorias: {
                              ...profile.coberturasObligatorias,
                              asistenciaVial: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>Asistencia vial 24/7</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={profile.coberturasObligatorias.fenomenosNaturales}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            coberturasObligatorias: {
                              ...profile.coberturasObligatorias,
                              fenomenosNaturales: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>Fenómenos naturales</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={profile.coberturasObligatorias.vehiculoSustituto}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            coberturasObligatorias: {
                              ...profile.coberturasObligatorias,
                              vehiculoSustituto: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>Vehículo sustituto</span>
                    </label>
                  </div>
                </div>

                {/* Prioridades (Área de texto) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridades del cliente
                  </label>
                  <textarea
                    rows={2}
                    value={profile.prioridades}
                    onChange={(e) => setProfile({ ...profile, prioridades: e.target.value })}
                    placeholder="Ej. Priorizar deducibles accesibles y buena cobertura de asistencia en carretera sin salirme del presupuesto."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Comparar propuestas */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleCompare}
            disabled={isAnalyzing || files.length === 0}
            className={`w-full sm:w-auto min-w-[300px] inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold tracking-wide shadow-lg transition-all transform ${
              isAnalyzing || files.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-900 hover:bg-blue-800 text-white shadow-blue-900/20 active:scale-98 hover:shadow-xl'
            }`}
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analizando propuestas...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Comparar propuestas ({files.length})</span>
                <ArrowRight className="w-5 h-5 ml-1 opacity-80" />
              </>
            )}
          </button>

          {files.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Sube de 1 a 3 propuestas en PDF arriba o pulsa "Cargar 3 cotizaciones demo" para comenzar.
            </p>
          )}
        </div>

        {/* Loading Indicator State */}
        {isAnalyzing && (
          <div className="my-10 p-8 rounded-2xl bg-white border border-blue-100 shadow-sm text-center max-w-xl mx-auto space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Analizando propuestas con Gemini...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Extrayendo primas, coberturas, exclusiones y validando reglas contra el perfil del cliente en Costa Rica.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-900">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-900 animate-ping" />
              <span>La IA prepara, el asesor decide</span>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: RESULTADO */}
        {result && (
          <div id="seccion-resultado" className="space-y-8 pt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header of Section 3 */}
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      Resultado: Tabla comparativa de aseguradoras
                    </h2>
                    <p className="text-xs text-slate-300">
                      Evaluación precisa de condiciones extraídas directamente de los documentos PDF
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                    Cliente: <strong>{profile.nombre || 'Laura Solís Vargas'}</strong>
                  </span>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Nueva comparación
                  </button>
                </div>
              </div>

              {/* Comparative Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-900 border-b border-slate-200">
                      <th className="py-4 px-4 sm:px-6 font-bold text-xs uppercase tracking-wider text-slate-500 w-1/4 min-w-[200px]">
                        Concepto / Cobertura
                      </th>
                      {result.propuestas.map((item, idx) => (
                        <th
                          key={idx}
                          className="py-4 px-4 sm:px-6 font-bold text-slate-900 min-w-[240px] border-l border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                            <div>
                              <div className="text-sm font-bold text-blue-950 leading-tight">
                                {item.aseguradora || `Aseguradora ${idx + 1}`}
                              </div>
                              {item.plan && (
                                <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  {item.plan}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title={item.archivo}>
                                {item.archivo}
                              </div>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {/* 1. Prima anual */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                        Prima anual
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3.5 px-4 sm:px-6 border-l border-slate-200 font-mono font-bold text-blue-950 text-sm sm:text-base">
                          {p.primaAnual || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 2. Cabe en presupuesto */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                        Cabe en presupuesto
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3.5 px-4 sm:px-6 border-l border-slate-200">
                          {p.cabeEnPresupuesto ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {p.cabeEnPresupuestoTexto || 'Sí'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              {p.cabeEnPresupuestoTexto || 'No'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 3. Deducible colisión */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Deducible colisión
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800">
                          {p.deducibleColision || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 4. Deducible robo */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Deducible robo
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800">
                          {p.deducibleRobo || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 5. RC daños a terceros */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        RC daños a terceros
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800 font-mono">
                          {p.rcDanosTerceros || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 6. RC lesiones */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        RC lesiones
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800 font-mono">
                          {p.rcLesiones || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 7. Asistencia vial 24/7 */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                        Asistencia vial 24/7
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3.5 px-4 sm:px-6 border-l border-slate-200 text-xs">
                          {p.asistenciaVialIncluida ? (
                            <div className="flex items-start gap-1.5 text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium">{p.asistenciaVial || 'Incluida'}</span>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5 text-rose-800">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span className="font-medium">{p.asistenciaVial || 'No incluida en prima'}</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 8. Grúa */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Grúa
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800">
                          {p.grua || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 9. Vehículo sustituto */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Vehículo sustituto
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs">
                          {p.vehiculoSustitutoIncluido ? (
                            <div className="flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium">{p.vehiculoSustituto}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <span className="text-slate-400 font-mono text-sm">✕</span>
                              <span>{p.vehiculoSustituto || 'No incluido'}</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 10. Fenómenos naturales */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Fenómenos naturales
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs">
                          {p.fenomenosNaturalesIncluido ? (
                            <div className="flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium">{p.fenomenosNaturales}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <span className="text-slate-400 font-mono text-sm">✕</span>
                              <span>{p.fenomenosNaturales || 'No aplica / No incluida'}</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 11. Rotura de cristales */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm">
                        Rotura de cristales
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-800">
                          {p.roturaCristales || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 12. Exclusiones destacadas */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-700 text-xs sm:text-sm align-top">
                        Exclusiones destacadas
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3.5 px-4 sm:px-6 border-l border-slate-200 text-xs text-slate-600 leading-relaxed align-top">
                          {p.exclusionesDestacadas || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* 13. Cumple obligatorias */}
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 text-xs sm:text-sm">
                        Cumple obligatorias
                      </td>
                      {result.propuestas.map((p, i) => (
                        <td key={i} className="py-3.5 px-4 sm:px-6 border-l border-slate-200">
                          {p.cumpleObligatorias ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Sí cumple
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              No cumple
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            {p.cumpleObligatoriasDetalle}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* 14. Semáforo */}
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                      <td className="py-4 px-4 sm:px-6 text-slate-900 text-xs sm:text-sm uppercase tracking-wider font-extrabold">
                        Semáforo
                      </td>
                      {result.propuestas.map((p, i) => {
                        const isVerde = p.semaforo === 'verde';
                        const isAmarillo = p.semaforo === 'amarillo';
                        const isRojo = p.semaforo === 'rojo';

                        return (
                          <td key={i} className="py-4 px-4 sm:px-6 border-l border-slate-200">
                            {isVerde && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide bg-emerald-600 text-white shadow-sm">
                                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                                  🟢 Verde
                                </span>
                                <p className="text-[11px] font-normal text-emerald-900 mt-1">
                                  {p.semaforoMotivo || 'Cabe en presupuesto y cumple todas las obligatorias.'}
                                </p>
                              </div>
                            )}

                            {isAmarillo && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide bg-amber-500 text-slate-950 shadow-sm">
                                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                                  🟡 Amarillo
                                </span>
                                <p className="text-[11px] font-normal text-amber-900 mt-1">
                                  {p.semaforoMotivo || 'Cumple obligatorias pero excede presupuesto.'}
                                </p>
                              </div>
                            )}

                            {isRojo && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide bg-rose-600 text-white shadow-sm">
                                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                                  🔴 Rojo
                                </span>
                                <p className="text-[11px] font-normal text-rose-900 mt-1">
                                  {p.semaforoMotivo || 'No cumple coberturas obligatorias requeridas.'}
                                </p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dos cuadros debajo de la tabla */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cuadro 1: Recomendación preliminar (borrador) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Recomendación preliminar (borrador)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Criterio técnico para el asesor basado en prioridades y montos
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {result.recomendacionPreliminar || 'Sin recomendación generada.'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Máximo 5 líneas con montos y justificación</span>
                  <span className="font-semibold text-blue-900">Uso interno para asesor</span>
                </div>
              </div>

              {/* Cuadro 2: Mensaje sugerido para el cliente (WhatsApp) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <Send className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Mensaje sugerido para el cliente (WhatsApp)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tono cordial, sin tecnicismos, listo para enviar
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar mensaje
                        </>
                      )}
                    </button>
                  </div>

                  {/* WhatsApp speech bubble visual */}
                  <div className="p-4 rounded-xl bg-[#eef7f2] border border-emerald-200/80 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal shadow-inner relative">
                    <div className="text-xs text-emerald-900 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Borrador WhatsApp (máx. 8 líneas):
                    </div>
                    {result.mensajeWhatsApp || 'Sin mensaje generado.'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sin promesas de plazos · Cordial y claro</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(result.mensajeWhatsApp || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Abrir en WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Mensaje de WhatsApp copiado!' : 'Copiar mensaje'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Nueva comparación
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Texto fijo al pie (Requerimiento estricto) */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-medium">
            Borrador generado con IA. Debe ser validado por un asesor contra las condiciones reales de la póliza. No suba datos reales de clientes.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Corredora JB · Herramienta Interna
          </div>
        </div>
      </footer>
    </div>
  );
}
