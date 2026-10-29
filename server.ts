import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'corredora-jb-session-auth-token-2026';

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));
app.use(cookieParser(COOKIE_SECRET));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// --- DATA PERSISTENCE & INITIALIZATION ---
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USUARIOS_FILE = path.join(DATA_DIR, 'usuarios.json');
const COMPARACIONES_FILE = path.join(DATA_DIR, 'comparaciones.json');
const AUDITORIA_FILE = path.join(DATA_DIR, 'auditoria.json');

export interface StoredUser {
  id: string;
  usuario: string; // nombre corto, sin espacios, en minúsculas
  nombre: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  claveHash: string;
  debeCambiarClave: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

// Initialize initial files if they do not exist
function initializeDataFiles() {
  if (!fs.existsSync(USUARIOS_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const initialHash = bcrypt.hashSync('Fundepos2026*', salt);
    const initialAdmin: StoredUser = {
      id: 'usr_admin_001',
      usuario: 'admin',
      nombre: 'Administrador',
      rol: 'administrador',
      estado: 'activo',
      claveHash: initialHash,
      debeCambiarClave: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
    };
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify([initialAdmin], null, 2), 'utf-8');
    console.log('data/usuarios.json inicializado con administrador inicial (usuario: admin).');
  }

  if (!fs.existsSync(COMPARACIONES_FILE)) {
    fs.writeFileSync(COMPARACIONES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(AUDITORIA_FILE)) {
    fs.writeFileSync(AUDITORIA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

initializeDataFiles();

function loadUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USUARIOS_FILE)) return [];
    const content = fs.readFileSync(USUARIOS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error al leer usuarios.json:', err);
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  try {
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al guardar usuarios.json:', err);
  }
}

function logAudit(accion: string, userId: string, usuario: string, detalles?: string) {
  try {
    let auditList = [];
    if (fs.existsSync(AUDITORIA_FILE)) {
      auditList = JSON.parse(fs.readFileSync(AUDITORIA_FILE, 'utf-8') || '[]');
    }
    auditList.push({
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      usuario,
      accion,
      detalles: detalles || '',
      fecha: new Date().toISOString(),
    });
    fs.writeFileSync(AUDITORIA_FILE, JSON.stringify(auditList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
}

function saveComparisonRecord(record: any) {
  try {
    let list = [];
    if (fs.existsSync(COMPARACIONES_FILE)) {
      list = JSON.parse(fs.readFileSync(COMPARACIONES_FILE, 'utf-8') || '[]');
    }
    list.unshift(record);
    // Keep last 100 comparisons
    if (list.length > 100) list = list.slice(0, 100);
    fs.writeFileSync(COMPARACIONES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al guardar comparaciones.json:', err);
  }
}

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    rol: u.rol,
    estado: u.estado,
    debeCambiarClave: u.debeCambiarClave,
    fechaCreacion: u.fechaCreacion,
    ultimoAcceso: u.ultimoAcceso,
  };
}

// Authentication Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.signedCookies?.jb_session;
  if (!userId) {
    return res.status(401).json({ error: 'Sesión no válida o expirada. Por favor inicie sesión.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    res.clearCookie('jb_session', { path: '/' });
    return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida.' });
  }

  if (user.estado !== 'activo') {
    return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
  }

  (req as any).currentUser = user;
  next();
}

// --- AUTHENTICATION ENDPOINTS ---

// POST /api/login (usuario y contraseña)
app.post('/api/login', (req: Request, res: Response) => {
  const { usuario, contrasena } = req.body || {};

  if (!usuario || typeof usuario !== 'string' || !contrasena || typeof contrasena !== 'string') {
    return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
  }

  const normalizedUser = usuario.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find((u) => u.usuario.toLowerCase() === normalizedUser);

  if (!user) {
    return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
  }

  const passwordMatch = bcrypt.compareSync(contrasena, user.claveHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
  }

  if (user.estado === 'suspendido') {
    return res.status(403).json({ error: 'usuario suspendido, contacte al administrador' });
  }

  // Update ultimoAcceso
  user.ultimoAcceso = new Date().toISOString();
  saveUsers(users);
  logAudit('LOGIN', user.id, user.usuario, 'Inicio de sesión exitoso');

  // Set signed cookie expiring in 8 hours
  res.cookie('jb_session', user.id, {
    httpOnly: true,
    signed: true,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
  });

  res.json({
    ok: true,
    user: sanitizeUser(user),
  });
});

// POST /api/logout
app.post('/api/logout', (req: Request, res: Response) => {
  const userId = req.signedCookies?.jb_session;
  if (userId) {
    const users = loadUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      logAudit('LOGOUT', user.id, user.usuario, 'Cierre de sesión');
    }
  }

  res.clearCookie('jb_session', { path: '/' });
  res.json({ ok: true });
});

// GET /api/yo
app.get('/api/yo', (req: Request, res: Response) => {
  const userId = req.signedCookies?.jb_session;
  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    res.clearCookie('jb_session', { path: '/' });
    return res.status(401).json({ error: 'Sesión no válida' });
  }

  if (user.estado !== 'activo') {
    return res.status(403).json({ error: 'usuario suspendido, contacte al administrador' });
  }

  res.json({
    ok: true,
    user: sanitizeUser(user),
  });
});

// POST /api/cambiar-clave
app.post('/api/cambiar-clave', requireAuth, (req: Request, res: Response) => {
  const currentUser: StoredUser = (req as any).currentUser;
  const { nuevaClave } = req.body || {};

  // Rule 4: mínimo 8 caracteres, al menos un número
  if (!nuevaClave || typeof nuevaClave !== 'string' || nuevaClave.length < 8 || !/\d/.test(nuevaClave)) {
    return res.status(400).json({
      error: 'La nueva contraseña debe tener como mínimo 8 caracteres y contener al menos un número.',
    });
  }

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === currentUser.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const newHash = bcrypt.hashSync(nuevaClave, 10);
  users[userIndex].claveHash = newHash;
  users[userIndex].debeCambiarClave = false;
  saveUsers(users);

  logAudit('CAMBIO_CLAVE', currentUser.id, currentUser.usuario, 'Cambio de contraseña completado');

  res.json({
    ok: true,
    user: sanitizeUser(users[userIndex]),
  });
});

// Helper for promise timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Endpoint: provide sample proposals that exist on disk (requires authentication)
app.get('/api/sample-proposals', requireAuth, async (_req: Request, res: Response) => {
  try {
    const assetsDir = path.resolve(process.cwd(), 'public/assets/aistudio');
    if (!fs.existsSync(assetsDir)) {
      return res.status(404).json({ error: 'Directorio de archivos de ejemplo no encontrado' });
    }

    const files = [
      {
        id: 'cordillera',
        name: 'Propuesta_A_Aseguradora_Cordillera.pdf',
        originalFileName: 'Propuesta_A_Aseguradora_Cordillera_7f9a63be.pdf',
        insurer: 'Aseguradora Cordillera S.A.',
        plan: 'Seguro Voluntario de Automóvil',
      },
      {
        id: 'alborada',
        name: 'Propuesta_B_Seguros_Alborada.pdf',
        originalFileName: 'Propuesta_B_Seguros_Alborada_26bdc3b0.pdf',
        insurer: 'Seguros Alborada',
        plan: 'Oferta Plan Básico Auto',
      },
      {
        id: 'valle',
        name: 'Propuesta_C_Protectora_del_Valle.pdf',
        originalFileName: 'Propuesta_C_Protectora_del_Valle_422f9421.pdf',
        insurer: 'Protectora del Valle Seguros Generales',
        plan: 'Plan Todo Riesgo Premium',
      },
    ];

    const results = files
      .map((item) => {
        const filePath = path.join(assetsDir, item.originalFileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          return {
            ...item,
            base64: fileBuffer.toString('base64'),
            size: fileBuffer.length,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json({ proposals: results });
  } catch (error: any) {
    console.error('Error loading sample proposals:', error);
    res.status(500).json({ error: 'Error al cargar propuestas de ejemplo: ' + error.message });
  }
});

interface CoverageRequirements {
  colision: boolean;
  robo: boolean;
  asistenciaVial: boolean;
  fenomenosNaturales: boolean;
  vehiculoSustituto: boolean;
}

interface ClientProfile {
  nombre: string;
  vehiculo: string;
  presupuesto: number;
  coberturasObligatorias: CoverageRequirements;
  prioridades: string;
  formaPago: string;
}

// Resilient call to Gemini
async function callGemini(contents: any): Promise<string> {
  const models = [
    { name: 'gemini-3.8-flash', timeoutMs: 6000 },
    { name: 'gemini-3.5-flash-lite', timeoutMs: 35000 },
    { name: 'gemini-flash-latest', timeoutMs: 25000 },
  ];

  let lastError: any = null;

  for (const modelConfig of models) {
    try {
      console.log(`Llamando modelo ${modelConfig.name} con timeout ${modelConfig.timeoutMs}ms...`);
      const apiPromise = ai.models.generateContent({
        model: modelConfig.name,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const response = await withTimeout(apiPromise, modelConfig.timeoutMs);
      if (response && response.text) {
        console.log(`Modelo ${modelConfig.name} respondió con éxito.`);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.warn(`Aviso modelo ${modelConfig.name}:`, msg.slice(0, 150));
    }
  }

  throw lastError || new Error('No se pudo comunicar con los servicios de IA.');
}

// Endpoint: Compare proposals (requires authentication)
app.post('/api/compare', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser: StoredUser = (req as any).currentUser;
    const { files, profile } = req.body as {
      files: Array<{ name: string; base64: string }>;
      profile: ClientProfile;
    };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar de 1 a 3 archivos PDF de propuestas.' });
    }

    if (files.length > 3) {
      return res.status(400).json({ error: 'Se permite un máximo de 3 propuestas para comparar.' });
    }

    if (!profile) {
      return res.status(400).json({ error: 'Debe proporcionar el perfil del cliente.' });
    }

    const mandatoryList: string[] = [];
    if (profile.coberturasObligatorias?.colision) mandatoryList.push('Colisión y vuelco');
    if (profile.coberturasObligatorias?.robo) mandatoryList.push('Robo');
    if (profile.coberturasObligatorias?.asistenciaVial) mandatoryList.push('Asistencia vial 24/7');
    if (profile.coberturasObligatorias?.fenomenosNaturales) mandatoryList.push('Fenómenos naturales');
    if (profile.coberturasObligatorias?.vehiculoSustituto) mandatoryList.push('Vehículo sustituto');

    const presupuestoNum = Number(profile.presupuesto) || 0;

    const promptText = `
Eres un analista experto en seguros de automóvil para Corredora JB en Costa Rica.
Analiza estrictamente las ${files.length} propuesta(s) de seguro adjuntas en formato PDF.

PERFIL DEL CLIENTE:
- Nombre: ${profile.nombre || 'Laura Solís Vargas'}
- Vehículo y uso: ${profile.vehiculo || 'Toyota Corolla XEi 2022, Particular'}
- Presupuesto máximo anual: ₡ ${presupuestoNum.toLocaleString('es-CR')} colones
- Coberturas obligatorias requeridas: ${mandatoryList.length > 0 ? mandatoryList.join(', ') : 'Ninguna marcada'}
- Prioridades del cliente: ${profile.prioridades || 'No indicadas'}
- Forma de pago preferida: ${profile.formaPago || 'No indicada'}

INSTRUCCIONES DE LÓGICA Y EXTRACCIÓN (ESTRICTAS):
1. Extraer de cada PDF SOLO lo que dice el documento; si un dato no aparece, escribir exactamente "no indicado". NO INVENTAR.
2. Validar para cada aseguradora:
   - CABE EN PRESUPUESTO: Verdadero si la prima anual (con IVA) es menor o igual al presupuesto del cliente (₡ ${presupuestoNum}).
   - CUMPLE OBLIGATORIAS: Verdadero SOLO SI TODAS las coberturas obligatorias marcadas por el cliente están INCLUIDAS en la prima base. Si un paquete o cobertura figura como opcional con costo adicional o no incluida (ej. Asistencia vial en Alborada por ₡ 45.000 adicionales), NO CUENTA como incluida.
   - SEMÁFORO:
     * 'verde': si cabe en presupuesto y cumple obligatorias.
     * 'amarillo': si cumple obligatorias pero no cabe en presupuesto.
     * 'rojo': si no cumple obligatorias (falta alguna cobertura requerida).
3. RECOMENDACIÓN PRELIMINAR (BORRADOR):
   - Recomendar UNA SOLA propuesta.
   - Justificar en MÁXIMO 5 LÍNEAS con los montos exactos, según las prioridades del cliente.
   - Si una propuesta con semáforo amarillo es mejor para satisfacer las prioridades del cliente, decirlo claramente y cuantificar con exactitud la diferencia de prima respecto al presupuesto.
4. MENSAJE SUGERIDO PARA EL CLIENTE (WHATSAPP):
   - MÁXIMO 8 LÍNEAS.
   - Tono cordial y profesional, sin tecnicismos de seguros.
   - Incluir la recomendación, dos razones clave, la alternativa viable y un próximo paso claro.
   - SIN prometer plazos ni tiempos de entrega de póliza.

Debes responder ÚNICAMENTE en JSON con este esquema exacto:
{
  "propuestas": [
    {
      "archivo": "nombre del archivo analizado",
      "aseguradora": "Nombre oficial de la aseguradora (ej. Aseguradora Cordillera S.A.)",
      "plan": "Nombre del plan si se menciona",
      "primaAnual": "Prima anual total con IVA tal como figura (ej. ₡ 395.000)",
      "primaAnualNumero": 395000,
      "cabeEnPresupuesto": true/false,
      "cabeEnPresupuestoTexto": "Sí (₡ 395.000 ≤ ₡ 400.000)" o "No (excede por ₡ 55.000)",
      "deducibleColision": "Detalle del deducible colisión y vuelco",
      "deducibleRobo": "Detalle del deducible robo",
      "rcDanosTerceros": "Límite de RC daños a terceros (bienes)",
      "rcLesiones": "Límite de RC lesiones o muerte a terceros",
      "asistenciaVial": "Detalle de asistencia vial 24/7 y si está incluida o es opcional",
      "asistenciaVialIncluida": true si está incluida en la prima base sin cobro extra, false si es opcional o no incluida,
      "grua": "Condiciones del servicio de grúa (km y eventos)",
      "vehiculoSustituto": "Condiciones de vehículo sustituto",
      "vehiculoSustitutoIncluido": true si está incluido en la prima base, false si no,
      "fenomenosNaturales": "Condiciones de fenómenos naturales (ej. No aplica o Suma asegurada)",
      "fenomenosNaturalesIncluido": true si está incluido en la prima base, false si no,
      "colisionIncluido": true si cubre colisión y vuelco en la prima base, false si no,
      "roboIncluido": true si cubre robo en la prima base, false si no,
      "roturaCristales": "Detalle de rotura de cristales",
      "exclusionesDestacadas": "Resumen de las exclusiones principales señaladas en el documento",
      "cumpleObligatorias": true/false,
      "cumpleObligatoriasDetalle": "Explicación concisa de si cumple con todas o cuáles faltan",
      "semaforo": "verde" | "amarillo" | "rojo",
      "semaforoMotivo": "Justificación concisa del semáforo según las reglas"
    }
  ],
  "recomendacionPreliminar": "Texto de la recomendación de máximo 5 líneas",
  "mensajeWhatsApp": "Texto sugerido para WhatsApp de máximo 8 líneas"
}
`;

    const parts: any[] = [];
    files.forEach((file, index) => {
      const cleanBase64 = file.base64.replace(/^data:application\/pdf;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
      parts.push({
        text: `El documento PDF anterior corresponde al Archivo ${index + 1}: "${file.name}".`,
      });
    });

    parts.push({
      text: promptText,
    });

    const rawResponse = await callGemini({ parts });
    const cleaned = rawResponse.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsedResult = JSON.parse(cleaned);

    // Deterministic validation layer on server
    if (parsedResult.propuestas && Array.isArray(parsedResult.propuestas)) {
      parsedResult.propuestas = parsedResult.propuestas.map((item: any, idx: number) => {
        const fileObj = files[idx] || files[0];
        if (!item.archivo) item.archivo = fileObj.name;

        const primaNum = Number(item.primaAnualNumero) || 0;
        const fitsBudget = presupuestoNum > 0 ? primaNum <= presupuestoNum : true;
        item.cabeEnPresupuesto = fitsBudget;

        if (presupuestoNum > 0) {
          if (fitsBudget) {
            item.cabeEnPresupuestoTexto = `Sí (₡ ${primaNum.toLocaleString('es-CR')} ≤ ₡ ${presupuestoNum.toLocaleString('es-CR')})`;
          } else {
            const diff = primaNum - presupuestoNum;
            item.cabeEnPresupuestoTexto = `No (excede por ₡ ${diff.toLocaleString('es-CR')})`;
          }
        }

        const missingRequirements: string[] = [];
        if (profile.coberturasObligatorias?.colision && !item.colisionIncluido) {
          missingRequirements.push('Colisión y vuelco');
        }
        if (profile.coberturasObligatorias?.robo && !item.roboIncluido) {
          missingRequirements.push('Robo');
        }
        if (profile.coberturasObligatorias?.asistenciaVial && !item.asistenciaVialIncluida) {
          missingRequirements.push('Asistencia vial 24/7');
        }
        if (profile.coberturasObligatorias?.fenomenosNaturales && !item.fenomenosNaturalesIncluido) {
          missingRequirements.push('Fenómenos naturales');
        }
        if (profile.coberturasObligatorias?.vehiculoSustituto && !item.vehiculoSustitutoIncluido) {
          missingRequirements.push('Vehículo sustituto');
        }

        const fulfillsMandatory = missingRequirements.length === 0;
        item.cumpleObligatorias = fulfillsMandatory;

        if (mandatoryList.length === 0) {
          item.cumpleObligatoriasDetalle = 'Sin coberturas obligatorias marcadas';
        } else if (fulfillsMandatory) {
          item.cumpleObligatoriasDetalle = `Cumple con las ${mandatoryList.length} coberturas solicitadas`;
        } else {
          item.cumpleObligatoriasDetalle = `No cumple: Falta ${missingRequirements.join(', ')}`;
        }

        if (!fulfillsMandatory) {
          item.semaforo = 'rojo';
          item.semaforoMotivo = `No cumple con las coberturas obligatorias (${missingRequirements.join(', ')} no incluidas en prima base).`;
        } else if (!fitsBudget) {
          item.semaforo = 'amarillo';
          item.semaforoMotivo = `Cumple con todas las coberturas solicitadas, pero supera el presupuesto en ₡ ${(primaNum - presupuestoNum).toLocaleString('es-CR')}.`;
        } else {
          item.semaforo = 'verde';
          item.semaforoMotivo = `Cumple con todas las coberturas y está dentro del presupuesto anual.`;
        }

        return item;
      });
    }

    // Persist comparison in data/comparaciones.json associated with user id
    saveComparisonRecord({
      id: 'comp_' + Date.now(),
      userId: currentUser.id,
      usuario: currentUser.usuario,
      cliente: profile.nombre || 'Sin nombre',
      vehiculo: profile.vehiculo || 'Sin vehículo',
      presupuesto: presupuestoNum,
      archivos: files.map((f) => f.name),
      fecha: new Date().toISOString(),
      recomendacion: parsedResult.recomendacionPreliminar,
    });

    logAudit('COMPARACION', currentUser.id, currentUser.usuario, `Comparación de ${files.length} propuestas para ${profile.nombre || 'cliente'}`);

    res.json(parsedResult);
  } catch (error: any) {
    console.error('Error in /api/compare:', error);
    res.status(500).json({
      error: 'Error al procesar las propuestas con Gemini: ' + (error.message || 'Error desconocido'),
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Comparador de Propuestas - Corredora JB server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
