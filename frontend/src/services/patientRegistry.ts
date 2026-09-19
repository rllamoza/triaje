export interface DetailedPatient {
  id: number
  ticket: string
  dni: string
  paciente: string
  edad: string
  sexo: 'M' | 'F'
  comunidad: string
  telefono?: string
  prioridad: 'rojo' | 'amarillo' | 'verde'
  prioridadLabel: string
  hora: string
  espera: string
  seguro: string
  alergias?: string
  antecedentes?: string
  motivo: string
  detalles: string
  destino: string
  medico: string
  vitals: {
    pa: string
    fc: string
    temp: string
    spo2: string
    fr: string
    gluc: string
    peso?: string
    talla?: string
    imc?: string
  }
  receta?: string[]
  hash?: string
  fecha?: string
}

export const PATIENT_DATABASE: DetailedPatient[] = [
  {
    id: 3,
    ticket: 'T-104',
    dni: '42918274',
    paciente: 'QUISPE CONDORI, JUAN',
    edad: '54 años',
    sexo: 'M',
    comunidad: 'RUMICHACA SECTOR ALTO (Ollantaytambo, Cusco)',
    telefono: '984 312 809',
    prioridad: 'amarillo',
    prioridadLabel: 'P2 - Urgente (Atención < 15 min)',
    hora: '08:42 hrs',
    espera: '28 min',
    seguro: 'SIS Gratuito Activo',
    alergias: 'Penicilina / Betalactámicos (Choque anafiláctico hace 8 años)',
    antecedentes: 'Hipertensión arterial no controlada, Lumbalgia crónica de esfuerzo',
    motivo: 'Lumbago incapacitante y síndrome febril agudo',
    detalles: 'Marcha claudicante, dolor lumbar irradiado a miembro inferior derecho, cefalea frontal y malestar general.',
    destino: 'CONSULTORIO 1 (MEDICINA GENERAL)',
    medico: 'Dr. M. Huamán Quispe (CMP: 48192)',
    vitals: {
      pa: '145/95 mmHg',
      fc: '88 lpm',
      temp: '38.6 °C',
      spo2: '92% (Altitud 2,792 msnm)',
      fr: '20 rpm',
      gluc: '110 mg/dL',
      peso: '68.5 kg',
      talla: '1.62 m',
      imc: '26.1 (Sobrepeso leve)',
    },
    receta: [
      '1. Paracetamol 500mg - 1 tab c/8h x 3 días.',
      '2. Naproxeno 550mg - 1 tab c/12h x 4 días.',
      '3. Complejo B - 1 ampolla IM stat.',
    ],
    hash: '8f92-a1b4-7c3e-90df',
    fecha: '19/09/2026',
  },
  {
    id: 1,
    ticket: 'T-101',
    dni: '02817462',
    paciente: 'MAMANI QUISPE, ROSA',
    edad: '67 años',
    sexo: 'F',
    comunidad: 'COMUNIDAD HUAYLLABAMBA',
    telefono: '951 842 103',
    prioridad: 'rojo',
    prioridadLabel: 'P1 - Emergencia Crítica (< 0 min)',
    hora: '09:12 hrs',
    espera: '3 min',
    seguro: 'SIS Gratuito',
    alergias: 'Alergia severa a Penicilina',
    antecedentes: 'Hipertensión arterial de larga data sin medicación regular',
    motivo: 'Crisis hipertensiva y disnea severa en reposo',
    detalles: 'Cianosis distal leve, dolor torácico opresivo y dificultad respiratoria marcada.',
    destino: 'CONSULTORIO 1 (MEDICINA GENERAL / REANIMACIÓN)',
    medico: 'Dr. M. Huamán Quispe',
    vitals: {
      pa: '180/110 mmHg',
      fc: '104 lpm',
      temp: '36.8 °C',
      spo2: '84% (Hipoxia severa - Oxígeno requerido)',
      fr: '26 rpm',
      gluc: '135 mg/dL',
      peso: '59.0 kg',
      talla: '1.50 m',
      imc: '26.2',
    },
    receta: [
      '1. Captopril 25mg - 1 tab sublingual stat.',
      '2. Oxígeno medicinal por cánula binasal a 3 L/min.',
      '3. Monitoreo continuo de PA c/15 min.',
    ],
    hash: '3e41-b8f2-11a9-99ff',
    fecha: '19/09/2026',
  },
  {
    id: 2,
    ticket: 'T-102',
    dni: '78291043',
    paciente: 'HUALLPA CCORI, DYLAN',
    edad: '3 años',
    sexo: 'M',
    comunidad: 'SECTOR MEDIA LUNA',
    telefono: '974 610 395',
    prioridad: 'rojo',
    prioridadLabel: 'P1 - Emergencia Pediátrica (< 0 min)',
    hora: '09:14 hrs',
    espera: '1 min',
    seguro: 'SIS Infantil',
    alergias: 'Sin alergias conocidas',
    antecedentes: 'Infección respiratoria alta de 48h evolución',
    motivo: 'Fiebre muy alta con episodio convulsivo febril',
    detalles: 'Convulsión tónico-clónica reportada por la madre hace 20 minutos. Somnoliento postictal.',
    destino: 'CONSULTORIO 2 (PEDIATRÍA)',
    medico: 'Dra. S. Mendoza Vargas',
    vitals: {
      pa: '90/60 mmHg',
      fc: '142 lpm',
      temp: '39.8 °C',
      spo2: '93% (Altitud)',
      fr: '34 rpm',
      gluc: '98 mg/dL',
      peso: '14.2 kg',
      talla: '0.94 m',
      imc: '16.0 (Eutrófico)',
    },
    receta: [
      '1. Paracetamol jarabe 120mg/5mL - 6 mL condicional a T > 38°C.',
      '2. Medios físicos con paños tibios.',
      '3. Observación neurológica durante 2 horas.',
    ],
    hash: '45d0-99aa-12e4-55c1',
    fecha: '19/09/2026',
  },
  {
    id: 4,
    ticket: 'T-105',
    dni: '48920194',
    paciente: 'RAMOS CONDORI, HILDA',
    edad: '31 años',
    sexo: 'F',
    comunidad: 'COMUNIDAD HUAYRONA',
    telefono: '984 771 204',
    prioridad: 'amarillo',
    prioridadLabel: 'P2 - Urgente (Atención < 15 min)',
    hora: '08:50 hrs',
    espera: '20 min',
    seguro: 'SIS Gratuito',
    alergias: 'Sulfas',
    antecedentes: 'Gestante de 28 semanas. G2 P1.',
    motivo: 'Gestante 28 sem con cefalea y acúfenos',
    detalles: 'Edema de miembros inferiores (+/+++), fotopsias ocasionales. Sospecha de preeclampsia leve en altura.',
    destino: 'CONSULTORIO 2 (GINECO-OBSTETRICIA)',
    medico: 'Dra. S. Mendoza Vargas',
    vitals: {
      pa: '130/85 mmHg',
      fc: '92 lpm',
      temp: '36.9 °C',
      spo2: '94% (Altitud)',
      fr: '18 rpm',
      gluc: '88 mg/dL',
      peso: '64.0 kg',
      talla: '1.55 m',
      imc: '26.6',
    },
    receta: [
      '1. Reposo relativo en decúbito lateral izquierdo.',
      '2. Examen de orina con tira reactiva para proteinuria.',
      '3. Control estricto de PA c/30 min.',
    ],
    hash: '77ac-44b2-09e1-2299',
    fecha: '19/09/2026',
  },
  {
    id: 5,
    ticket: 'T-107',
    dni: '23940182',
    paciente: 'YUPANQUI CHAMPI, PEDRO',
    edad: '45 años',
    sexo: 'M',
    comunidad: 'COMUNIDAD CACHICCATA',
    telefono: '982 119 400',
    prioridad: 'verde',
    prioridadLabel: 'P3 - Estándar (< 60 min)',
    hora: '08:20 hrs',
    espera: '50 min',
    seguro: 'SIS Gratuito',
    alergias: 'Ninguna',
    antecedentes: 'Agricultor, sin antecedentes de patología crónica',
    motivo: 'Control anual y solicitud de desparasitación',
    detalles: 'Asintomático al momento. Acude por campaña preventiva.',
    destino: 'CONSULTORIO 1 (MEDICINA GENERAL)',
    medico: 'Dr. M. Huamán Quispe',
    vitals: {
      pa: '120/80 mmHg',
      fc: '72 lpm',
      temp: '36.6 °C',
      spo2: '94% (Altitud)',
      fr: '16 rpm',
      gluc: '94 mg/dL',
      peso: '65.0 kg',
      talla: '1.65 m',
      imc: '23.8 (Normal)',
    },
    receta: [
      '1. Albendazol 400mg - 1 tableta dosis única.',
      '2. Sulfato ferroso + Ácido fólico 1 tab/día x 30 días.',
    ],
    hash: '12ef-88cd-77ab-4433',
    fecha: '19/09/2026',
  },
  {
    id: 6,
    ticket: 'T-108',
    dni: '03829104',
    paciente: 'CHAVEZ FLORES, MARÍA',
    edad: '62 años',
    sexo: 'F',
    comunidad: 'SECTOR PAUCARBAMBA',
    telefono: '984 002 911',
    prioridad: 'verde',
    prioridadLabel: 'P3 - Estándar (< 60 min)',
    hora: '08:35 hrs',
    espera: '35 min',
    seguro: 'EsSalud Agrario',
    alergias: 'Aspirina / AINEs menores',
    antecedentes: 'Artrosis de rodilla bilateral diagnosticada hace 5 años',
    motivo: 'Dolor articular de rodillas y lumbalgia mecánica',
    detalles: 'Dificultad moderada para marcha prolongada y subir pendientes.',
    destino: 'CONSULTORIO 1 (MEDICINA GENERAL)',
    medico: 'Dr. M. Huamán Quispe',
    vitals: {
      pa: '125/82 mmHg',
      fc: '76 lpm',
      temp: '36.7 °C',
      spo2: '93% (Altitud)',
      fr: '18 rpm',
      gluc: '102 mg/dL',
      peso: '61.5 kg',
      talla: '1.52 m',
      imc: '26.6',
    },
    receta: [
      '1. Paracetamol 1g - 1 tab c/8h x 5 días.',
      '2. Gel tópico de árnica / diclofenaco para frotación articular.',
      '3. Ejercicios de fortalecimiento de cuádriceps.',
    ],
    hash: '992a-33bc-6611-eec0',
    fecha: '19/09/2026',
  },
]

/**
 * Genera el payload JSON oficial y legible que se codifica en el código QR del ticket
 */
export function generatePatientQrPayload(patient: DetailedPatient): string {
  const qrObject = {
    sistema: 'SEMILLA_TRIAJE_MEDICO',
    tipo: 'FICHA_CLINICA_CAMPAÑA',
    version: '1.0',
    ticket: patient.ticket,
    dni: patient.dni,
    paciente: patient.paciente,
    edad: patient.edad,
    sexo: patient.sexo,
    comunidad: patient.comunidad,
    prioridad: patient.prioridad,
    prioridadLabel: patient.prioridadLabel,
    hora: patient.hora,
    seguro: patient.seguro,
    alergias: patient.alergias ?? 'Ninguna conocida',
    antecedentes: patient.antecedentes ?? 'Sin antecedentes registrados',
    motivo: patient.motivo,
    destino: patient.destino,
    medico: patient.medico,
    vitals: patient.vitals,
    receta: patient.receta ?? [],
    hash: patient.hash ?? '8f92-a1b4-7c3e-90df',
    fecha: patient.fecha ?? '19/09/2026',
  }
  return JSON.stringify(qrObject, null, 2)
}

/**
 * Busca o reconstruye un paciente detallado a partir de cualquier dato escaneado del QR
 */
export function parsePatientFromQr(raw: string): DetailedPatient | null {
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.trim()

  // 1. Intentar como JSON estructurado
  try {
    const data = JSON.parse(cleaned)
    if (data && (data.ticket || data.dni || data.paciente)) {
      // Buscar si ya existe en la base de datos para obtener datos completos o enriquecer
      const matched = PATIENT_DATABASE.find(
        (p) =>
          (data.ticket && p.ticket.toLowerCase() === String(data.ticket).toLowerCase()) ||
          (data.dni && p.dni === String(data.dni))
      )

      if (matched) {
        return matched
      }

      // Si es un QR externo o recién emitido con el JSON completo:
      return {
        id: Date.now(),
        ticket: data.ticket ?? 'T-QR',
        dni: data.dni ?? 'SIN DNI',
        paciente: data.paciente ?? 'PACIENTE IDENTIFICADO POR QR',
        edad: data.edad ?? 'No especificada',
        sexo: data.sexo ?? 'M',
        comunidad: data.comunidad ?? 'Comunidad no especificada',
        telefono: data.telefono,
        prioridad: data.prioridad === 'rojo' ? 'rojo' : data.prioridad === 'amarillo' ? 'amarillo' : 'verde',
        prioridadLabel: data.prioridadLabel ?? (data.prioridad === 'rojo' ? 'P1 - Emergencia' : data.prioridad === 'amarillo' ? 'P2 - Urgente' : 'P3 - Estándar'),
        hora: data.hora ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        espera: data.espera ?? '0 min',
        seguro: data.seguro ?? 'SIS Gratuito',
        alergias: data.alergias ?? 'Ninguna conocida',
        antecedentes: data.antecedentes ?? 'Sin antecedentes registrados',
        motivo: data.motivo ?? 'Atención médica en campaña',
        detalles: data.detalles ?? data.motivo ?? '',
        destino: data.destino ?? 'CONSULTORIO 1 (MEDICINA GENERAL)',
        medico: data.medico ?? 'Médico de Turno',
        vitals: data.vitals ?? {
          pa: '120/80 mmHg',
          fc: '75 lpm',
          temp: '36.8 °C',
          spo2: '94%',
          fr: '18 rpm',
          gluc: '100 mg/dL',
        },
        receta: Array.isArray(data.receta) ? data.receta : [],
        hash: data.hash ?? 'QR-LOCAL-SYNC',
        fecha: data.fecha ?? new Date().toLocaleDateString(),
      }
    }
  } catch {
    // No es JSON, continuar con otros formatos
  }

  // 2. Extraer parámetros si es una URL (ej: /tickets?t=T-104 o ?dni=42918274)
  if (cleaned.includes('http://') || cleaned.includes('https://') || cleaned.includes('?')) {
    try {
      const url = new URL(cleaned, 'http://localhost')
      const ticketParam = url.searchParams.get('ticket') || url.searchParams.get('t')
      const dniParam = url.searchParams.get('dni') || url.searchParams.get('d')

      if (ticketParam) {
        const found = PATIENT_DATABASE.find(p => p.ticket.toLowerCase() === ticketParam.toLowerCase())
        if (found) return found
      }
      if (dniParam) {
        const found = PATIENT_DATABASE.find(p => p.dni === dniParam)
        if (found) return found
      }
    } catch {
      // Ignorar error de parsing de URL
    }
  }

  // 3. Coincidencia por Ticket o DNI directo (ej: "T-104", "42918274")
  const directMatch = PATIENT_DATABASE.find(
    (p) =>
      p.ticket.toLowerCase() === cleaned.toLowerCase() ||
      p.ticket.replace('-', '').toLowerCase() === cleaned.replace('-', '').toLowerCase() ||
      p.dni === cleaned ||
      cleaned.toLowerCase().includes(p.ticket.toLowerCase()) ||
      cleaned.includes(p.dni)
  )

  if (directMatch) {
    return directMatch
  }

  // Si no se encuentra pero contiene formato de ticket (ej: "T-999")
  const ticketRegex = /T-?\d{2,4}/i.exec(cleaned)
  if (ticketRegex) {
    const code = ticketRegex[0].toUpperCase().replace('T', 'T-')
    const found = PATIENT_DATABASE.find(p => p.ticket.toUpperCase() === code)
    if (found) return found
  }

  return null
}
