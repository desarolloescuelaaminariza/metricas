import { Deal, AdvisorMetric, ProgramMetric, STATUS_WON, STATUS_LOST, STATUS_CONTACT, AggregatedStats } from '../types';

// Función robusta para normalizar estados
export const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "Desconocido";
  const lower = status.toLowerCase().trim();
  if (lower.includes("ganado") || lower.includes("won") || lower.includes("venta")) return STATUS_WON;
  if (lower.includes("perdido") || lower.includes("lost")) return STATUS_LOST;
  if (lower.includes("contacto") || lower.includes("contact")) return STATUS_CONTACT;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getCloseDate = (deal: Deal): string => deal["Fecha de Cierre"] || "";
const getCreationDate = (deal: Deal): string => deal["Fecha de Trato"] || deal["Fecha de Contacto"] || "";

// Lógica estricta solicitada:
// Si NO hay fecha desde: (!fechaDesde) → true → INCLUYE todos
// Si HAY fecha desde: (!fechaDesde) → false → evalúa (fechaTrato >= fechaDesde)
const isDateInRange = (date: string | null | undefined, start: string, end: string): boolean => {
  // Si la fecha a evaluar no existe (null/empty), no puede estar en un rango específico
  if (!date) return false;

  const cumpleDesde = !start || date >= start;
  const cumpleHasta = !end || date <= end;

  return cumpleDesde && cumpleHasta;
};

// Regla de Visualización (Tabla):
// Aparece si: (Fecha Creación en Rango) O (Está Cerrado Y Fecha Cierre en Rango)
export const getFilteredDeals = (data: Deal[], startDate: string, endDate: string): Deal[] => {
  // Si no hay filtros, devolver todo
  if (!startDate && !endDate) return data;

  return data.filter(d => {
    const normalizedState = normalizeStatus(d.Estado);
    
    // 1. Evaluar Fecha de Creación (Para tratos en Contacto o cualquier trato creado en este periodo)
    const creationDate = getCreationDate(d);
    const isCreatedInRange = isDateInRange(creationDate, startDate, endDate);
    
    // 2. Evaluar Fecha de Cierre (Solo si es Ganado o Perdido)
    // Ejemplo B: Creado Oct, Cerrado Nov. Filtro Nov -> TRUE
    let isClosedInRange = false;
    if (normalizedState === STATUS_WON || normalizedState === STATUS_LOST) {
      const closingDate = getCloseDate(d);
      isClosedInRange = isDateInRange(closingDate, startDate, endDate);
    }

    // Lógica OR: Cumple si se creó en el periodo O se cerró en el periodo
    return isCreatedInRange || isClosedInRange;
  }).sort((a, b) => {
    // Ordenar por fecha relevante (Cierre si existe, sino Creación)
    const dateA = getCloseDate(a) || getCreationDate(a);
    const dateB = getCloseDate(b) || getCreationDate(b);
    return dateB.localeCompare(dateA);
  });
};

// Calcular KPIs (Estadísticas)
export const calculateStats = (data: Deal[], startDate: string, endDate: string): AggregatedStats => {
  
  // Total Deals: Contamos los que se CREARON en el rango seleccionado
  // (Independiente de si se cerraron o no después)
  const dealsCreatedInPeriod = data.filter(d => 
    isDateInRange(getCreationDate(d), startDate, endDate)
  );

  // Ganados: Contamos los que se CERRARON GANADOS en el rango seleccionado
  // (Independiente de cuándo se crearon)
  const wonInPeriod = data.filter(d => 
    normalizeStatus(d.Estado) === STATUS_WON && 
    isDateInRange(getCloseDate(d), startDate, endDate)
  ).length;

  // Perdidos: Contamos los que se CERRARON PERDIDOS en el rango seleccionado
  const lostInPeriod = data.filter(d => 
    normalizeStatus(d.Estado) === STATUS_LOST && 
    isDateInRange(getCloseDate(d), startDate, endDate)
  ).length;
  
  const totalCreated = dealsCreatedInPeriod.length;

  // En Gestión: De los creados en este periodo, cuántos siguen abiertos
  const activeFromPeriod = dealsCreatedInPeriod.filter(d => {
    const s = normalizeStatus(d.Estado);
    return s !== STATUS_WON && s !== STATUS_LOST;
  }).length;
  
  const other = totalCreated - wonInPeriod - lostInPeriod - activeFromPeriod; // Ajuste residual

  return {
    totalDeals: totalCreated,
    won: wonInPeriod,
    lost: lostInPeriod,
    contact: activeFromPeriod,
    other: other > 0 ? other : 0,
    // Tasas calculadas sobre el flujo del periodo (aproximación)
    // Nota: Puede dar >100% si cerramos tratos viejos, es normal en ventas
    conversionRate: totalCreated > 0 ? (wonInPeriod / totalCreated) * 100 : 0,
    lossRate: totalCreated > 0 ? (lostInPeriod / totalCreated) * 100 : 0
  };
};

// Gráfico de Línea
export const getTimelineData = (data: Deal[], startDate: string, endDate: string) => {
  const timelineMap: Record<string, { date: string; created: number; won: number }> = {};

  data.forEach(deal => {
    const creationDate = getCreationDate(deal);
    const closeDate = getCloseDate(deal);
    const status = normalizeStatus(deal.Estado);

    // 1. Puntos de Creación
    if (isDateInRange(creationDate, startDate, endDate)) {
      if (!timelineMap[creationDate]) timelineMap[creationDate] = { date: creationDate, created: 0, won: 0 };
      timelineMap[creationDate].created += 1;
    }

    // 2. Puntos de Cierre (Ganado)
    if (status === STATUS_WON && isDateInRange(closeDate, startDate, endDate)) {
       if (!timelineMap[closeDate]) timelineMap[closeDate] = { date: closeDate, created: 0, won: 0 };
       timelineMap[closeDate].won += 1;
    }
  });

  return Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));
};

// Métricas por Asesora
export const getAdvisorMetrics = (data: Deal[], startDate: string, endDate: string): AdvisorMetric[] => {
  const advisorMap: Record<string, AdvisorMetric> = {};

  const getAdvisor = (name: string) => {
    if (!advisorMap[name]) advisorMap[name] = { name, total: 0, won: 0, lost: 0, conversionRate: 0, lossRate: 0 };
    return advisorMap[name];
  };

  data.forEach(deal => {
    const advisorName = deal["Asesora Comercial"] || "Desconocido";
    const metric = getAdvisor(advisorName);
    
    const creationDate = getCreationDate(deal);
    const closeDate = getCloseDate(deal);
    const status = normalizeStatus(deal.Estado);

    // Total: Se le asigna si el lead entró (se creó) en el periodo
    if (isDateInRange(creationDate, startDate, endDate)) {
      metric.total += 1;
    }

    // Ganado: Se le asigna si cerró la venta en el periodo
    if (status === STATUS_WON && isDateInRange(closeDate, startDate, endDate)) {
      metric.won += 1;
    }

    // Perdido: Se le asigna si perdió la venta en el periodo
    if (status === STATUS_LOST && isDateInRange(closeDate, startDate, endDate)) {
      metric.lost += 1;
    }
  });

  return Object.values(advisorMap)
    .map(metric => ({
      ...metric,
      conversionRate: metric.total > 0 ? (metric.won / metric.total) * 100 : 0,
      lossRate: metric.total > 0 ? (metric.lost / metric.total) * 100 : 0
    }))
    .filter(m => m.total > 0 || m.won > 0 || m.lost > 0) // Mostrar si tuvo alguna actividad
    .sort((a, b) => b.won - a.won);
};

// Métricas por Programa
export const getProgramMetrics = (data: Deal[], startDate: string, endDate: string): ProgramMetric[] => {
  const programMap: Record<string, ProgramMetric> = {};

  data.forEach(deal => {
    const progName = deal["Programa Académico"] || "Sin Programa";
    if (!programMap[progName]) programMap[progName] = { name: progName, count: 0, won: 0, conversionRate: 0 };

    // Interés (Count): Creación en rango
    if (isDateInRange(getCreationDate(deal), startDate, endDate)) {
      programMap[progName].count += 1;
    }

    // Venta (Won): Cierre en rango
    if (normalizeStatus(deal.Estado) === STATUS_WON && isDateInRange(getCloseDate(deal), startDate, endDate)) {
      programMap[progName].won += 1;
    }
  });

  return Object.values(programMap)
    .map(metric => ({
      ...metric,
      conversionRate: metric.count > 0 ? (metric.won / metric.count) * 100 : 0
    }))
    .filter(m => m.count > 0 || m.won > 0)
    .sort((a, b) => b.count - a.count);
};