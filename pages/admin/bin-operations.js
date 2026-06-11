import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  db,
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from '../../lib/firebase';
import { getBinHistory } from '../../firebase/db';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Loader2, Search, History } from 'lucide-react';
import toast from 'react-hot-toast';

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fillStatus(fillLevel) {
  if (fillLevel > 85) return { label: 'Kritisk', className: 'text-red-300 bg-red-500/15 border-red-500/30' };
  if (fillLevel >= 60) return { label: 'Advarsel', className: 'text-amber-300 bg-amber-500/15 border-amber-500/30' };
  return { label: 'Normal', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' };
}

function buildHistorySeries(logs) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString('nb-NO', { weekday: 'short' }), fill: 0 };
  });

  const dayMap = new Map(days.map((day) => [day.key, day]));

  logs.forEach((entry) => {
    const date = toDate(entry.timestamp);
    if (!date) return;
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
    if (!dayMap.has(key)) return;
    const existing = dayMap.get(key);
    const value = entry.fillLevel ?? Math.min(100, Math.round((entry.weight || 0) * 8));
    existing.fill = Math.max(existing.fill, value);
  });

  return days.map((day) => ({ day: day.label, fill: day.fill }));
}

export default function BinOperationsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [bins, setBins] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [historyBin, setHistoryBin] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || !['admin', 'municipality'].includes(userData?.role))) {
      router.push('/auth/login');
    }
  }, [loading, user, userData, router]);

  useEffect(() => {
    if (!userData || !['admin', 'municipality'].includes(userData.role)) return undefined;

    // Realtime Firestore subscription for bin operations.
    const binsQuery = query(collection(db, 'bins'), orderBy('lastUpdated', 'desc'));
    const unsubscribe = onSnapshot(
      binsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setBins(data);
        setError('');
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError('Klarte ikke hente sanntidsdata for bøtter.');
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const schoolIds = useMemo(() => [...new Set(bins.map((bin) => bin.schoolId).filter(Boolean))], [bins]);

  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      const value = `${bin.id} ${bin.binId || ''} ${bin.name || ''} ${bin.location || ''}`.toLowerCase();
      const matchesSearch = !search || value.includes(search.toLowerCase());
      const status = fillStatus(bin.fillLevel || 0).label;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSchool = schoolFilter === 'all' || bin.schoolId === schoolFilter;
      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [bins, search, statusFilter, schoolFilter]);

  const handleMarkEmptied = async (bin) => {
    try {
      await updateDoc(doc(db, 'bins', bin.id), {
        fillLevel: 0,
        status: 'emptied',
        lastUpdated: serverTimestamp(),
      });
      toast.success(`Bøtte ${bin.name || bin.id} markert som tømt.`);
    } catch (markError) {
      console.error(markError);
      toast.error('Klarte ikke oppdatere bøttestatus.');
    }
  };

  const handleViewHistory = async (bin) => {
    setHistoryBin(bin);
    setHistoryLoading(true);
    try {
      const history = await getBinHistory(bin.id, 200);
      setHistoryData(buildHistorySeries(history));
    } catch (historyError) {
      console.error(historyError);
      toast.error('Klarte ikke hente historikk.');
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-bio-500/30 border-t-bio-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-700 text-white text-2xl">Bin Operations Dashboard</h1>
          <p className="text-slate-400 text-sm">Sanntidsoversikt over alle registrerte søppelbøtter.</p>
        </div>

        <div className="bio-card p-4 grid md:grid-cols-4 gap-3">
          <label className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="bio-input pl-9" placeholder="Søk etter skole, bin-ID eller navn" />
          </label>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bio-input">
            <option value="all">Alle statuser</option>
            <option value="Normal">Normal</option>
            <option value="Advarsel">Advarsel</option>
            <option value="Kritisk">Kritisk</option>
          </select>

          <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className="bio-input">
            <option value="all">Alle skoler</option>
            {schoolIds.map((schoolId) => <option key={schoolId} value={schoolId}>{schoolId}</option>)}
          </select>
        </div>

        {error && <div className="bio-card p-4 border border-red-500/20 text-red-300">{error}</div>}

        <div className="bio-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="text-left p-3">Bin</th>
                  <th className="text-left p-3">Plassering</th>
                  <th className="text-left p-3">Fyllingsgrad</th>
                  <th className="text-left p-3">Siste registrering</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {filteredBins.map((bin) => {
                  const status = fillStatus(bin.fillLevel || 0);
                  const updated = toDate(bin.lastUpdated);
                  return (
                    <tr key={bin.id} className="border-t border-white/5">
                      <td className="p-3">
                        <div className="text-white font-600">{bin.name || bin.binId || bin.id}</div>
                        <div className="text-xs text-slate-500">{bin.id}</div>
                      </td>
                      <td className="p-3 text-slate-300">{bin.location || `${bin.lat || '-'}, ${bin.lng || '-'}`}</td>
                      <td className="p-3">
                        <div className="w-36 h-2 rounded-full bg-white/10 overflow-hidden mb-1">
                          <div
                            className={`h-full ${bin.fillLevel > 85 ? 'bg-red-500' : bin.fillLevel >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, bin.fillLevel || 0))}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-400">{bin.fillLevel || 0}%</div>
                      </td>
                      <td className="p-3 text-slate-400">{updated ? updated.toLocaleString('nb-NO') : 'Ingen data'}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full border text-xs ${status.className}`}>{status.label}</span></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleMarkEmptied(bin)} className="px-3 py-1.5 rounded-lg bg-bio-500/20 border border-bio-500/30 text-bio-200 text-xs">Merk som tømt</button>
                          <button onClick={() => handleViewHistory(bin)} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200 text-xs flex items-center gap-1"><History size={12} /> Se historikk</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {historyBin && (
          <div className="bio-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-display font-700">Historikk: {historyBin.name || historyBin.id}</h2>
              <button onClick={() => setHistoryBin(null)} className="text-slate-400 hover:text-white text-sm">Lukk</button>
            </div>
            {historyLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" size={16} />Henter historikk...</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="fill" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
