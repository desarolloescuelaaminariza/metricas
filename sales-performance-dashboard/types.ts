export interface Deal {
  "Fecha de Contacto": string;
  "Fecha de Trato": string;
  "Asesora Comercial": string;
  "Nombre de Trato": string;
  "Estado": string;
  "Programa Académico": string;
  "Fecha de Cierre": string | null;
}

export interface AggregatedStats {
  totalDeals: number;
  won: number;
  lost: number;
  contact: number;
  other: number;
  conversionRate: number;
  lossRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface AdvisorMetric {
  name: string;
  total: number;
  won: number;
  lost: number;
  conversionRate: number;
  lossRate: number;
}

export interface ProgramMetric {
  name: string;
  count: number;
  won: number;
  conversionRate: number;
}

export const STATUS_WON = "Cerrado Ganado";
export const STATUS_LOST = "Cerrado Perdido";
export const STATUS_CONTACT = "Contacto";
