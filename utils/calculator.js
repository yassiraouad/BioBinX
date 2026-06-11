// utils/calculator.js

export function calculateEnergy(weightKg) {
  // 1 kg food waste → ~0.5 kWh biogas energy
  return weightKg * 0.5;
}

export function calculateCO2Saved(weightKg) {
  // 1 kg food waste composted/biogassed → ~0.8 kg CO2 saved vs landfill
  return weightKg * 0.8;
}

export function calculatePoints(weightKg) {
  return Math.round(weightKg * 10);
}

export function formatNumber(num, decimals = 1) {
  if (num >= 1000) return `${(num / 1000).toFixed(decimals)}k`;
  return num.toFixed(decimals);
}

export function energyEquivalent(kwh) {
  // What can you power with this energy?
  if (kwh < 0.1) return `${(kwh * 1000).toFixed(0)} Wh`;
  if (kwh < 1) return `${kwh.toFixed(2)} kWh – lader ${Math.round(kwh / 0.01)} telefoner`;
  return `${kwh.toFixed(2)} kWh – driver en TV i ${Math.round(kwh / 0.1)} timer`;
}

export function getRank(points) {
  if (points < 50) return { name: 'Spire', icon: '🌱', color: '#86efac' };
  if (points < 200) return { name: 'Grønn Kriger', icon: '🌿', color: '#4ade80' };
  if (points < 500) return { name: 'Miljøvenn', icon: '♻️', color: '#22c55e' };
  if (points < 1000) return { name: 'Klimahelt', icon: '🌍', color: '#16a34a' };
  return { name: 'BioLegende', icon: '👑', color: '#facc15' };
}

export function getWeeklyData(logs) {
  const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return days.map((day, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayLogs = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      return logDate.toDateString() === date.toDateString();
    });
    const weight = dayLogs.reduce((sum, l) => sum + (l.weight || 0), 0);
    return { day, weight: parseFloat(weight.toFixed(2)), date: date.toLocaleDateString('no-NO') };
  });
}

export function exportToCSV(data, filename, headers) {
  if (!data || data.length === 0) return false;
  
  const headerRow = headers.map(h => h.label).join(';');
  const rows = data.map(item => 
    headers.map(h => {
      let value = item[h.key];
      if (value === null || value === undefined) value = '';
      if (typeof value === 'string' && value.includes(';')) value = `"${value}"`;
      if (value instanceof Date) value = value.toLocaleDateString('no-NO');
      if (h.format === 'decimal') value = value.toString().replace('.', ',');
      return value;
    }).join(';')
  );
  
  const csv = '\ufeff' + [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
}

export function exportLogsToCSV(logs) {
  const headers = [
    { key: 'date', label: 'Dato' },
    { key: 'student', label: 'Elev' },
    { key: 'weight', label: 'Vekt (kg)', format: 'decimal' },
    { key: 'points', label: 'Poeng' },
    { key: 'co2Saved', label: 'CO₂ spart (kg)', format: 'decimal' },
    { key: 'energy', label: 'Energi (kWh)', format: 'decimal' },
  ];
  
  const data = logs.map(log => ({
    date: log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp),
    student: log.userName || log.userId || 'Ukjent',
    weight: log.weight || 0,
    points: log.points || 0,
    co2Saved: calculateCO2Saved(log.weight || 0),
    energy: calculateEnergy(log.weight || 0),
  }));
  
  return exportToCSV(data, 'biobin_avfall', headers);
}

export function exportStudentsToCSV(students) {
  const headers = [
    { key: 'name', label: 'Navn' },
    { key: 'email', label: 'E-post' },
    { key: 'totalWaste', label: 'Totalt avfall (kg)', format: 'decimal' },
    { key: 'points', label: 'Poeng' },
    { key: 'ecoPoints', label: 'EcoPoints' },
    { key: 'badges', label: 'Badges' },
  ];
  
  const data = students.map(s => ({
    ...s,
    badges: (s.badges || []).length,
  }));
  
  return exportToCSV(data, 'biobin_elever', headers);
}

export function exportClassStatsToCSV(classData, students, logs) {
  const headers = [
    { key: 'className', label: 'Klassenavn' },
    { key: 'studentCount', label: 'Antall elever' },
    { key: 'totalWaste', label: 'Totalt avfall (kg)', format: 'decimal' },
    { key: 'totalPoints', label: 'Totale poeng' },
    { key: 'avgWaste', label: 'Gjennomsnitt (kg/elev)', format: 'decimal' },
    { key: 'co2Saved', label: 'CO₂ spart (kg)', format: 'decimal' },
    { key: 'energyGenerated', label: 'Energi (kWh)', format: 'decimal' },
  ];
  
  const avgWaste = students.length > 0 ? classData.totalWaste / students.length : 0;
  const data = [{
    className: classData.name,
    studentCount: students.length,
    totalWaste: classData.totalWaste || 0,
    totalPoints: students.reduce((s, st) => s + (st.points || 0), 0),
    avgWaste,
    co2Saved: calculateCO2Saved(classData.totalWaste || 0),
    energyGenerated: calculateEnergy(classData.totalWaste || 0),
  }];
  
  return exportToCSV(data, 'biobin_klassestatistikk', headers);
}
