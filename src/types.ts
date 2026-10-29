export interface CoverageRequirements {
  colision: boolean;
  robo: boolean;
  asistenciaVial: boolean;
  fenomenosNaturales: boolean;
  vehiculoSustituto: boolean;
}

export interface ClientProfile {
  nombre: string;
  vehiculo: string;
  presupuesto: number;
  coberturasObligatorias: CoverageRequirements;
  prioridades: string;
  formaPago: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  base64: string;
  size?: number;
  isSample?: boolean;
}

export interface ProposalComparison {
  archivo: string;
  aseguradora: string;
  plan?: string;
  primaAnual: string;
  primaAnualNumero: number;
  cabeEnPresupuesto: boolean;
  cabeEnPresupuestoTexto: string;
  deducibleColision: string;
  deducibleRobo: string;
  rcDanosTerceros: string;
  rcLesiones: string;
  asistenciaVial: string;
  asistenciaVialIncluida: boolean;
  grua: string;
  vehiculoSustituto: string;
  vehiculoSustitutoIncluido: boolean;
  fenomenosNaturales: string;
  fenomenosNaturalesIncluido: boolean;
  colisionIncluido: boolean;
  roboIncluido: boolean;
  roturaCristales: string;
  exclusionesDestacadas: string;
  cumpleObligatorias: boolean;
  cumpleObligatoriasDetalle: string;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  semaforoMotivo: string;
}

export interface ComparisonResult {
  propuestas: ProposalComparison[];
  recomendacionPreliminar: string;
  mensajeWhatsApp: string;
}

export interface AuthUser {
  id: string;
  usuario: string;
  nombre: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  debeCambiarClave: boolean;
  fechaCreacion?: string;
  ultimoAcceso?: string | null;
}
