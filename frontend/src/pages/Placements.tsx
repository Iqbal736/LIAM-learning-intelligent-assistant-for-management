import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { placementsApi } from '../services/api.ts';
import { motion } from 'framer-motion';

// Types for stats endpoint
type YearStats = {
  year: number;
  totalPlacements: number;
  fullTimeOffers: number;
  internshipsCount: number;
  numCompanies: number;
  tier1Offers: number | null;
  tier2Offers: number | null;
  multipleOffersCount: number;
  ctc: { highest: number | null; average: number | null; lowest: number | null; currency: string };
  offersByCompany: { name: string; value: number }[];
};

type YearKey = '2024' | '2025';

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-2 text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{value}</div>
  </div>
);

const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center space-x-3">
          <div className="w-44 text-sm text-gray-600 dark:text-gray-300 truncate" title={d.label}>{d.label}</div>
          <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-12 text-right text-sm text-gray-600 dark:text-gray-300">{d.value}</div>
        </div>
      ))}
    </div>
  );
};

const DonutChart: React.FC<{ parts: { label: string; value: number; color: string }[] }> = ({ parts }) => {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let cumulative = 0;
  const arcs = parts.map((p, idx) => {
    const start = (cumulative / total) * 2 * Math.PI;
    cumulative += p.value;
    const end = (cumulative / total) * 2 * Math.PI;
    const largeArc = end - start > Math.PI ? 1 : 0;
    const radius = 38;
    const cx = 40, cy = 40;
    const x1 = cx + radius * Math.cos(start), y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end), y2 = cy + radius * Math.sin(end);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={idx} d={d} fill={p.color} />;
  });
  return (
    <div className="flex items-center space-x-4">
      <svg width="160" height="80" viewBox="0 0 80 80" className="-rotate-90">{arcs}</svg>
      <div className="space-y-1">
        {parts.map(p => (
          <div key={p.label} className="flex items-center space-x-2 text-sm">
            <span className="inline-block w-3 h-3 rounded" style={{ background: p.color }} />
            <span className="text-gray-700 dark:text-gray-200">{p.label}</span>
            <span className="text-gray-500 dark:text-gray-400">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineCompare: React.FC<{ series: { year: string; value: number }[]; label: string }> = ({ series, label }) => {
  const max = Math.max(1, ...series.map(s => s.value));
  const points = series.map((s, i) => {
    const x = 20 + i * 100;
    const y = 80 - (s.value / max) * 60;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      <svg width="220" height="100" className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <polyline fill="none" stroke="#a855f7" strokeWidth="3" points={points} />
        {series.map((s, i) => {
          const x = 20 + i * 100;
          const y = 80 - (s.value / max) * 60;
          return <circle key={s.year} cx={x} cy={y} r={4} fill="#a855f7" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
        {series.map(s => <span key={s.year}>{s.year}</span>)}
      </div>
    </div>
  );
};

// CSV export intentionally removed per confidentiality requirements

const Placements: React.FC = () => {
  const [year, setYear] = useState<YearKey>('2025');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

  const { data: statsLatest } = useQuery(['placements-stats-latest'], async () => {
    const res = await fetch('/api/placements/stats');
    return (await res.json()).data as YearStats;
  });
  const { data: stats2024 } = useQuery(['placements-stats-2024'], async () => {
    const res = await fetch('/api/placements/stats?year=2024');
    return (await res.json()).data as YearStats;
  });
  const { data: stats2025 } = useQuery(['placements-stats-2025'], async () => {
    const res = await fetch('/api/placements/stats?year=2025');
    return (await res.json()).data as YearStats;
  });
  const { data: placements } = useQuery(['placements-all'], () => placementsApi.getAll());

  const stats: YearStats | undefined = year === '2024' ? stats2024 : stats2025 ?? statsLatest;
  const offersPerCompany = useMemo(() => (stats?.offersByCompany || []).slice(0, 12).map(c => ({ label: c.name, value: c.value })), [stats]);

  const companiesList = useMemo(() => {
    const data = placements?.data;
    if (!data) return [] as { name: string; offers: number; tier?: string }[];
    const y = data.years?.[year] as any;
    if (!y) return [];
    if (y.companies) return y.companies;
    return (stats?.offersByCompany || []).map(c => ({ name: c.name, offers: c.value }));
  }, [placements, stats, year]);

  const filteredCompanies = companiesList.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const donutParts = useMemo(() => ([
    { label: 'Full-time', value: stats?.fullTimeOffers || 0, color: '#a855f7' },
    { label: 'Internships', value: stats?.internshipsCount || 0, color: '#ec4899' },
  ]), [stats]);

  const compareSeries = useMemo(() => ({
    total: [
      { year: '2024', value: stats2024?.totalPlacements || 0 },
      { year: '2025', value: stats2025?.totalPlacements || 0 },
    ],
    highest: [
      { year: '2024', value: stats2024?.ctc.highest || 0 },
      { year: '2025', value: stats2025?.ctc.highest || 0 },
    ],
  }), [stats2024, stats2025]);

  // downloadCompaniesCSV removed

  // Build student rows for selected year
  const studentRows = useMemo(() => {
    const data = placements?.data as any;
    const rows: Array<{ name: string; usn: string; companies: string; highestCtc: number | string; offersCount: number; hasInternship: string; details?: string }>
      = [];
    if (!data) return rows;
    const y = data.years?.[year];
    if (!y) return rows;
    if (year === '2025' && Array.isArray(y.students)) {
      y.students.forEach((s: any) => {
        const offers = Array.isArray(s.offers) ? s.offers : [];
        const companies = offers.map((o: any) => o.company).join(', ');
        const ctcValues = offers.filter((o: any) => o.ctcLpa).map((o: any) => Number(o.ctcLpa));
        const highest = ctcValues.length ? Math.max(...ctcValues) : '—';
        const hasIntern = offers.some((o: any) => (o.offerType || '').toUpperCase().includes('SI') || o.stipendPerMonth || o.stipendLumpsum);
        rows.push({ name: s.name, usn: s.usn || '', companies, highestCtc: highest, offersCount: offers.length, hasInternship: hasIntern ? 'Yes' : 'No' });
      });
    } else if (year === '2024' && y.placementDetails?.studentPlacements) {
      y.placementDetails.studentPlacements.forEach((s: any) => {
        rows.push({ name: s.fullName, usn: s.usn || '', companies: '-', highestCtc: '—', offersCount: 1, hasInternship: /internship/i.test(s.details) ? 'Yes' : 'No', details: s.details });
      });
    }
    return rows;
  }, [placements, year]);

  const filteredStudents = studentRows.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.usn.toLowerCase().includes(search.toLowerCase()));

  // downloadStudentsCSV removed

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">AIML Placements</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Showcasing stellar outcomes across top recruiters with competitive compensation and meaningful internships.</p>
        <div className="flex justify-center gap-2">
          {(['2025', '2024'] as YearKey[]).map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${year === y ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
            >{y}</button>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {(['overview','students'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${activeTab === tab ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
            >{tab === 'overview' ? 'Overview' : 'Students'}</button>
          ))}
        </div>
      </div>

      {!stats && (
        <div className="text-center text-gray-600 dark:text-gray-300">Loading placements...</div>
      )}

      {stats && activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard label={`Total Placements (${year})`} value={stats.totalPlacements} />
            <StatCard label="Full-time Offers" value={stats.fullTimeOffers} />
            <StatCard label="Internships" value={stats.internshipsCount} />
            <StatCard label="Companies" value={stats.numCompanies} />
            <StatCard label="Multiple Offers" value={stats.multipleOffersCount} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Top Recruiters by Offers</h2>
              </div>
              <BarChart data={offersPerCompany} />
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Compensation (LPA)</div>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Highest" value={stats.ctc.highest ?? '—'} />
                  <StatCard label="Average" value={stats.ctc.average ?? '—'} />
                  <StatCard label="Lowest" value={stats.ctc.lowest ?? '—'} />
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Offer Mix</div>
                <DonutChart parts={donutParts} />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Year-over-Year Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LineCompare label="Total Placements" series={compareSeries.total} />
              <LineCompare label="Highest CTC (LPA)" series={compareSeries.highest} />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Company-wise Breakdown</h3>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search company..."
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Offers</th>
                    <th className="py-2 pr-4">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c) => (
                    <tr key={c.name} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">{c.name}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{c.offers}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{c.tier ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <motion.div 
            className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-gray-700 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">A showcase of excellence</div>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Leading roles, strong PPO conversions, and sustained performance across recruiters.</div>
          </motion.div>
        </>
      )}

      {activeTab === 'students' && (
        <>
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Student Finder</h3>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or USN..."
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">USN</th>
                    <th className="py-2 pr-4">Companies</th>
                    <th className="py-2 pr-4">Highest CTC</th>
                    <th className="py-2 pr-4">Offers</th>
                    <th className="py-2 pr-4">Internship</th>
                    {year === '2024' && <th className="py-2 pr-4">Details</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((r, idx) => (
                    <tr key={`${r.usn}-${idx}`} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">{r.name}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.usn || '—'}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.companies || '—'}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.highestCtc}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.offersCount}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.hasInternship}</td>
                      {year === '2024' && <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{r.details}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Placements;


