import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { getTeacherClasses, getWeeklyWaste, getClassStudents, getChallenges, getGroupStats, getAllBinsHealth } from '../firebase/db';
import { useDemo } from '../hooks/useDemo';
import toast from 'react-hot-toast';

export default function WeeklyReport({ teacherId }) {
  const [generating, setGenerating] = useState(false);
  const { isDemo } = useDemo();

  const generatePDF = async () => {
    if (isDemo) {
      toast.error('Ikke tilgjengelig i demo-modus');
      return;
    }

    setGenerating(true);
    try {
      const classes = await getTeacherClasses(teacherId);
      const now = new Date();
      const weekNumber = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
      
      let reportText = `BIOBIN X UKESRAPPORT\n`;
      reportText += `Uke ${weekNumber} - ${now.toLocaleDateString('no-NO')}\n`;
      reportText += `═══════════════════════════════════════\n\n`;
      
      for (const cls of classes) {
        const weeklyKg = await getWeeklyWaste(null, cls.id);
        const students = await getClassStudents(cls.id);
        const challenges = await getChallenges();
        const weeklyChallenges = challenges.filter(c => c.completedBy?.includes(cls.id));
        
        reportText += `KLASSE: ${cls.name}\n`;
        reportText += `─────────────────────────────────────\n`;
        reportText += `Total matavfall denne uken: ${weeklyKg.toFixed(1)} kg\n`;
        reportText += `Antall elever: ${students.length}\n`;
        reportText += `Utfordringer fullført: ${weeklyChallenges.length}\n\n`;
      }
      
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BioBinX-rapport-uke${weekNumber}.txt`;
      link.click();
      
      toast.success('Rapport lastet ned!');
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Klarte ikke generere rapport');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="btn-primary flex items-center gap-2 text-sm"
    >
      {generating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <FileText size={16} />
      )}
      Last ned ukesrapport
    </button>
  );
}