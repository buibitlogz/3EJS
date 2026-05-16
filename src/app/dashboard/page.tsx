'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { LayoutWrapper } from '@/components/common/LayoutWrapper';
import { useSubscribersStore } from '@/stores/subscribersStore';
import { useAuth } from '@/hooks/useAuth';
import { useELoadStore } from '@/stores/eloadStore';
import { useTechniciansStore } from '@/stores/techniciansStore';
import { Card } from '@/components/common/PageContainer';
import { AnimatePresence, motion } from 'framer-motion';
import { Installation } from '@/lib/types';
import { formatDateDisplay } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from '@/components/common/RechartsLazy';

export default function DashboardPage() {
  const { user } = useAuth();
  // Use stores directly so Dashboard reacts to add/delete in real time
  const { subscribers: installations, fetchSubscribers } = useSubscribersStore();
  const { transactions: eloadTransactions, fetchTransactions: fetchELoad } = useELoadStore();
  const { technicians, fetchTechnicians } = useTechniciansStore();
  const [selectedItem, setSelectedItem] = useState<Installation | null>(null);
  const [eloadFilter, setEloadFilter] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');


  // ALL subscriber data grouped by month — zoomable with Brush
  const subscriberGraphData = useMemo(() => {
    const monthly: Record<string, number> = {};
    installations.forEach(inst => {
      const raw = inst.dateInstalled as string | number;
      if (!raw && raw !== 0) return;
      let date: Date | null = null;

      // Excel serial date (number like 45325)
      if (typeof raw === 'number' || /^\d{5,6}$/.test(String(raw).trim())) {
        const serial = typeof raw === 'number' ? raw : parseInt(String(raw).trim());
        date = new Date((serial - 25569) * 86400 * 1000);
      } else {
        const s = String(raw).trim();
        if (!s) return;
        if (/^\d{4}-\d{2}/.test(s)) {
          date = new Date(s.substring(0, 10));
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
          const parts = s.split('/');
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (s.includes(' ')) {
          const datePart = s.replace(/GMT[+-]\d{4}.*/i, '').replace(/\(.*\)/, '').trim();
          date = new Date(datePart);
        }
      }

      if (!date || isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        const [yr, mo] = month.split('-').map(Number);
        const label = isNaN(yr) || isNaN(mo) ? month
          : new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { month, label, count };
      });
  }, [installations]);

  // ALL e-load data grouped by week/month/year — zoomable with Brush
  const eloadGraphData = useMemo(() => {
    const grouped: Record<string, number> = {};
    eloadTransactions.forEach(t => {
      const raw = t.dateLoaded as string | number;
      if (!raw && raw !== 0) return;
      let date: Date | null = null;
      
      // Excel serial date (number like 45325)
      if (typeof raw === 'number' || /^\d{5,6}$/.test(String(raw).trim())) {
        const serial = typeof raw === 'number' ? raw : parseInt(String(raw).trim());
        date = new Date((serial - 25569) * 86400 * 1000);
      } else {
        const s = String(raw).trim();
        if (!s) return;
        if (/^\d{4}-\d{2}/.test(s)) {
          date = new Date(s.substring(0, 10));
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
          const parts = s.split('/');
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (s.includes(' ')) {
          const datePart = s.replace(/GMT[+-]\d{4}.*/i, '').replace(/\(.*\)/, '').trim();
          date = new Date(datePart);
        }
      }
      
      if (!date || isNaN(date.getTime())) return;
      
      let key = '';
      if (eloadFilter === 'yearly') {
        key = String(date.getFullYear());
      } else if (eloadFilter === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => {
        let label = period;
        if (eloadFilter === 'yearly') {
          label = period;
        } else if (eloadFilter === 'weekly') {
          const [yr, week] = period.split('-W');
          label = `W${week} '${yr.slice(-2)}`;
        } else {
          const [yr, mo] = period.split('-').map(Number);
          label = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        return { period, label, count };
      });
  }, [eloadTransactions, eloadFilter]);

  useEffect(() => {
    fetchSubscribers();
    fetchELoad();
    fetchTechnicians();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when a sync or add/delete happens in another tab/page
  useEffect(() => {
    const handleSync = () => {
      fetchSubscribers();
      fetchELoad();
      fetchTechnicians();
    };
    window.addEventListener('db-synced', handleSync);
    window.addEventListener('records-updated', handleSync);
    return () => {
      window.removeEventListener('db-synced', handleSync);
      window.removeEventListener('records-updated', handleSync);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const totalSubscribers = installations.length;
  // E-Load Incentive = sum of all incentive values
  const eLoadIncentive = eloadTransactions.reduce((sum, t) => sum + parseNum(t.incentive), 0);
  // Total E-Load Revenue = sum of (markedUp + incentive) for non-TOPER transactions
  const totalEloadRevenue = eloadTransactions
    .filter(t => !t.remarks || !t.remarks.toLowerCase().includes('toper'))
    .reduce((sum, t) => sum + parseNum(t.markedUp) + parseNum(t.incentive), 0);
  const recentInstallations = [...installations]
    .sort((a, b) => {
      const dateA = a.dateInstalled ? new Date(a.dateInstalled).getTime() : 0;
      const dateB = b.dateInstalled ? new Date(b.dateInstalled).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);
  const topTechnicians = technicians.slice(0, 5);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Welcome back, {user?.name}</h1>
            <p className="text-sm text-text/50 mt-1">Here is your overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.784-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text/50 uppercase tracking-wider">Total Subscribers</p>
                <p className="text-2xl font-bold text-text">{totalSubscribers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text/50 uppercase tracking-wider">E-Load Incentive</p>
                <p className="text-2xl font-bold text-purple-600">₱{eLoadIncentive.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75a.75.75 0 00-.75-.75H2.25" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text/50 uppercase tracking-wider">E-Load Transactions</p>
                <p className="text-2xl font-bold text-emerald-600">{eloadTransactions.length}</p>
                <p className="text-xs text-text/40 mt-0.5">Total completed</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text/50 uppercase tracking-wider">Total E-Load Revenue</p>
                <p className="text-2xl font-bold text-amber-600">₱{totalEloadRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-text/40 mt-0.5">Markup + Incentives (excl. TOPER)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Two separate line graphs side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscriber Growth Graph */}
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-text">Subscriber Installations</h2>
              <p className="text-xs text-text/40 mt-0.5">
                Monthly new installs — all time
                {subscriberGraphData.length > 0 && (
                  <span className="ml-1 text-indigo-500">({subscriberGraphData.length} months)</span>
                )}
              </p>
            </div>
            {subscriberGraphData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-text/30 text-sm">
                No installation data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={subscriberGraphData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [value, 'New Installs']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} name="count" />
                  <Brush dataKey="label" height={20} stroke="var(--color-border)" fill="var(--color-background)" travellerWidth={8} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* E-Load Transactions Graph */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text">E-Load Transactions</h2>
                <p className="text-xs text-text/40 mt-0.5">
                  {eloadFilter === 'weekly' ? 'Weekly' : eloadFilter === 'monthly' ? 'Monthly' : 'Yearly'} count — all time
                  {eloadGraphData.length > 0 && (
                    <span className="ml-1 text-purple-500">({eloadGraphData.length} {eloadFilter === 'weekly' ? 'weeks' : eloadFilter === 'monthly' ? 'months' : 'years'})</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                {(['weekly', 'monthly', 'yearly'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setEloadFilter(f)}
                    className={`px-3 py-1 text-xs rounded-lg capitalize transition-all ${
                      eloadFilter === f
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-text/60 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {eloadGraphData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-text/30 text-sm">
                No E-Load data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={eloadGraphData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [value, 'Transactions']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} name="count" />
                  <Brush dataKey="label" height={20} stroke="var(--color-border)" fill="var(--color-background)" travellerWidth={8} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4">Latest Installations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text/40 border-b border-border">
                      <th className="pb-2 font-medium">Subscriber</th>
                      <th className="pb-2 font-medium">Account #</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInstallations.map((inst, i) => (
                      <tr key={inst.id || i} onDoubleClick={() => setSelectedItem(inst)} className="border-b border-border/30 hover:bg-primary/5 cursor-pointer">
                        <td className="py-3 font-medium text-text">{inst.subscriberName || 'N/A'}</td>
                        <td className="py-3 text-text/60">{String(inst.accountNumber || '').replace(/\.0$/, '')}</td>
                        <td className="py-3 text-text/60">{formatDateDisplay(inst.dateInstalled)}</td>
                      </tr>
                    ))}
                    {recentInstallations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-text/40">No installations yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4">Top Technicians</h2>
              <div className="space-y-3">
                {topTechnicians.map((tech, i) => (
                  <div key={tech.name || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-primary/10 text-text/60'}`}>
                        {i + 1}
                      </div>
                      <span className="font-medium text-text text-sm">{tech.name}</span>
                    </div>
                    <span className="text-sm text-text/50">{tech.count} jobs</span>
                  </div>
                ))}
                {topTechnicians.length === 0 && <p className="text-center text-text/40 py-4">No technicians yet</p>}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4">Recent Load Expiry</h2>
              <div className="space-y-2">
                {[...installations].filter(inst => inst.loadExpire).sort((a, b) => new Date(a.loadExpire).getTime() - new Date(b.loadExpire).getTime()).slice(0, 5).map((inst, i) => {
                  const expiryDate = new Date(inst.loadExpire);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isExpired = expiryDate < today;
                  return (
                    <div key={inst.id || i} className="flex items-center justify-between p-2 rounded-lg">
                      <div>
                        <p className="font-medium text-text text-sm">{inst.subscriberName}</p>
                        <p className="text-xs text-text/50">{formatDateDisplay(inst.loadExpire)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                  );
                })}
                {installations.filter(i => i.loadExpire).length === 0 && <p className="text-center text-text/40 py-4">No load expiry data</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{selectedItem.subscriberName}</h2>
                  <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-text/50">Account #</p><p className="font-medium">{String(selectedItem.accountNumber || '').replace(/\.0$/, '')}</p></div>
                  <div><p className="text-xs text-text/50">Date Installed</p><p className="font-medium">{formatDateDisplay(selectedItem.dateInstalled)}</p></div>
                  <div><p className="text-xs text-text/50">Contact</p><p className="font-medium">{selectedItem.contactNumber1 || '-'}</p></div>
                  <div><p className="text-xs text-text/50">Technician</p><p className="font-medium">{selectedItem.assignedTechnician || '-'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-text/50">Address</p><p className="font-medium">{selectedItem.address || '-'}</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutWrapper>
  );
}
