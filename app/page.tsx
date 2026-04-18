'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

// ── Island config ─────────────────────────────────────────────────────────────
const ISLANDS: Record<string, { label: string; emoji: string; color: string; dark: string }> = {
  sunny: { label: 'Happy', emoji: '☀️', color: '#FFD166', dark: '#B8920A' },
  stormy: { label: 'Angry', emoji: '⛈️', color: '#7C6AF7', dark: '#4A3FBF' },
  foggy: { label: 'Confused', emoji: '🌫️', color: '#90A4AE', dark: '#546E7A' },
  volcano: { label: 'Overwhelmed', emoji: '🌋', color: '#FF7757', dark: '#CC4433' },
  rainy: { label: 'Sad', emoji: '🌧️', color: '#64B5F6', dark: '#1976D2' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'emotions', label: 'Emotions', icon: '◉' },
  { id: 'routines', label: 'Routines', icon: '◫' },
  { id: 'insights', label: 'AI Insights', icon: '◈' },
  { id: 'logs', label: 'Logs', icon: '◧' },
];

// ── PDF Export ────────────────────────────────────────────────────────────────
async function exportPDF({ child, emotionData, routineData, insights, selectedDate }: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('Helvetica');

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MX = 16;
  const CW = PAGE_W - MX * 2;
  let y = 0;

  const PURPLE_D: [number, number, number] = [90, 74, 200];
  const PURPLE: [number, number, number] = [124, 106, 247];
  const CORAL: [number, number, number] = [255, 119, 87];
  const GOLD: [number, number, number] = [255, 209, 102];
  const BG_SOFT: [number, number, number] = [248, 246, 255];
  const WHITE: [number, number, number] = [255, 255, 255];
  const DARK: [number, number, number] = [32, 28, 60];
  const MUTED: [number, number, number] = [130, 124, 160];
  const BORDER: [number, number, number] = [220, 215, 245];

  const EMOTION_CFG: Record<string, { label: string; color: [number, number, number] }> = {
    sunny: { label: 'Happy', color: [255, 209, 102] },
    stormy: { label: 'Angry', color: [124, 106, 247] },
    foggy: { label: 'Confused', color: [176, 190, 197] },
    volcano: { label: 'Overwhelmed', color: [255, 119, 87] },
    rainy: { label: 'Sad', color: [100, 181, 246] },
  };

  const divider = (dy: number) => {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(MX, dy, MX + CW, dy);
  };

  const sectionHeading = (label: string, dy: number) => {
    doc.setFillColor(...PURPLE);
    doc.rect(MX, dy - 3.5, 3, 5.5, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(label.toUpperCase(), MX + 6, dy);
    return dy + 8;
  };

  const roundRect = (rx: number, ry: number, rw: number, rh: number, fill: [number, number, number], stroke?: [number, number, number]) => {
    doc.setFillColor(...fill);
    if (stroke) { doc.setDrawColor(...stroke); doc.roundedRect(rx, ry, rw, rh, 2, 2, 'FD'); }
    else doc.roundedRect(rx, ry, rw, rh, 2, 2, 'F');
  };

  // Header
  doc.setFillColor(...PURPLE_D);
  doc.rect(0, 0, PAGE_W, 54, 'F');
  doc.setFillColor(255, 255, 255);
  for (let gx = 10; gx < PAGE_W; gx += 12) {
    for (let gy = 6; gy < 54; gy += 12) doc.circle(gx, gy, 0.5, 'F');
  }
  doc.setFillColor(...CORAL);
  doc.rect(0, 0, PAGE_W, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('Helvetica', 'bold');
  doc.text('ROAMLY', MX, 20);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(200, 190, 255);
  doc.text('Weekly Care Report', MX, 27);
  const childName = child?.name || 'Child';
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(childName, PAGE_W - MX, 20, { align: 'right' });
  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 6);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(180, 170, 240);
  doc.text(`${selectedDate}  →  ${endDate.toISOString().split('T')[0]}`, PAGE_W - MX, 28, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(160, 150, 220);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, MX, 48);

  y = 62;

  // AI Summary
  if (insights?.summary) {
    const lines = doc.splitTextToSize(insights.summary, CW - 14);
    const cardH = lines.length * 5 + 16;
    roundRect(MX, y, CW, cardH, BG_SOFT, BORDER);
    doc.setFillColor(...GOLD);
    doc.rect(MX, y, 4, cardH, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('AI Summary', MX + 8, y + 7);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 55, 90);
    doc.text(lines, MX + 8, y + 13);
    y += cardH + 10;
  }

  // Stats row
  const totalCheckins = emotionData.length;
  const totalRoutines = routineData.length;
  const avgCompletion = routineData.length > 0
    ? Math.round(routineData.reduce((acc: number, r: any) => {
      const t = r.steps?.length || 0;
      const d = r.steps?.filter((s: any) => s.completed).length || 0;
      return acc + (t > 0 ? d / t : 0);
    }, 0) / routineData.length * 100)
    : 0;

  const statW = (CW - 8) / 3;
  [
    { label: 'Check-ins', value: String(totalCheckins), color: PURPLE },
    { label: 'Routine Days', value: String(totalRoutines), color: CORAL },
    { label: 'Avg Completion', value: `${avgCompletion}%`, color: GOLD },
  ].forEach((stat, i) => {
    const sx = MX + i * (statW + 4);
    roundRect(sx, y, statW, 22, BG_SOFT, BORDER);
    doc.setFillColor(...stat.color);
    doc.rect(sx, y, statW, 4, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(stat.value, sx + statW / 2, y + 14, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(stat.label, sx + statW / 2, y + 20, { align: 'center' });
  });
  y += 30;

  // Emotions
  const counts: Record<string, number> = {};
  emotionData.forEach((e: any) => { counts[e.island] = (counts[e.island] || 0) + 1; });
  const maxCount = Math.max(...Object.values(counts), 1);
  y = sectionHeading('Emotion Check-ins', y);
  Object.entries(counts).forEach(([island, count]) => {
    const cfg = EMOTION_CFG[island] || { label: island, color: MUTED };
    const barW = ((count as number) / maxCount) * (CW - 60);
    roundRect(MX, y - 3, CW, 8, [250, 249, 255]);
    roundRect(MX + 42, y - 2, barW, 5.5, cfg.color as [number, number, number]);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(cfg.label, MX + 2, y + 2);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(`${count}x`, MX + CW - 2, y + 2, { align: 'right' });
    y += 10;
  });
  y += 6; divider(y); y += 8;

  // Routines
  y = sectionHeading('Routine Completion', y);
  routineData.slice(0, 7).forEach((r: any) => {
    const total = r.steps?.length || 0;
    const done = r.steps?.filter((s: any) => s.completed).length || 0;
    const pct = total > 0 ? done / total : 0;
    const date = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    roundRect(MX, y - 3, CW, 9, [250, 249, 255]);
    doc.setTextColor(...DARK);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(date, MX + 2, y + 2.5);
    const trackX = MX + 44;
    const trackW = CW - 60;
    roundRect(trackX, y - 1, trackW, 5, [220, 215, 245]);
    const fillColor: [number, number, number] = pct >= 0.8 ? [82, 199, 136] : pct >= 0.4 ? GOLD : CORAL;
    if (pct > 0) roundRect(trackX, y - 1, trackW * pct, 5, fillColor);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(`${Math.round(pct * 100)}%`, MX + CW - 1, y + 2.5, { align: 'right' });
    y += 11;
  });
  y += 4; divider(y); y += 8;

  // Patterns
  if (insights?.patterns?.length) {
    y = sectionHeading('Patterns Observed', y);
    insights.patterns.forEach((p: string, i: number) => {
      const lines = doc.splitTextToSize(p, CW - 14);
      const rowH = lines.length * 5 + 6;
      roundRect(MX, y, CW, rowH, i % 2 === 0 ? BG_SOFT : WHITE, BORDER);
      doc.setFillColor(...PURPLE);
      doc.circle(MX + 5, y + rowH / 2, 1.2, 'F');
      doc.setTextColor(60, 55, 90);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(lines, MX + 10, y + 5);
      y += rowH + 2;
    });
    y += 4; divider(y); y += 8;
  }

  // Suggestions
  if (insights?.suggestions?.length) {
    y = sectionHeading('Recommendations', y);
    insights.suggestions.forEach((s: string) => {
      const lines = doc.splitTextToSize(s, CW - 14);
      const rowH = lines.length * 5 + 6;
      roundRect(MX, y, CW, rowH, [255, 250, 246], [255, 200, 180]);
      doc.setFillColor(...CORAL);
      doc.rect(MX, y, 3, rowH, 'F');
      doc.setTextColor(60, 40, 30);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(lines, MX + 7, y + 5);
      y += rowH + 3;
    });
    y += 4; divider(y); y += 8;
  }

  // Resources
  if (insights?.resources?.length) {
    y = sectionHeading('Helpful Resources', y);
    insights.resources.forEach((r: any) => {
      const descLines = doc.splitTextToSize(r.description || '', CW - 10);
      const cardH = descLines.length * 4.5 + 16;
      roundRect(MX, y, CW, cardH, WHITE, BORDER);
      doc.setTextColor(...DARK);
      doc.setFontSize(9.5);
      doc.setFont('Helvetica', 'bold');
      doc.text(r.title, MX + 5, y + 7);
      doc.setTextColor(...PURPLE);
      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'normal');
      doc.text(r.url || '', MX + 5, y + 12);
      doc.setTextColor(...MUTED);
      doc.setFontSize(8);
      doc.text(descLines, MX + 5, y + 17);
      y += cardH + 4;
    });
  }

  // Footer
  const footerY = Math.max(y + 10, PAGE_H - 12);
  doc.setFillColor(...PURPLE_D);
  doc.rect(0, footerY - 4, PAGE_W, 16, 'F');
  doc.setFillColor(...CORAL);
  doc.rect(0, footerY + 10, PAGE_W, 2, 'F');
  doc.setTextColor(200, 190, 255);
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.text("Generated by Roamly · Supporting every child's journey", PAGE_W / 2, footerY + 4, { align: 'center' });

  doc.save(`roamly-report-${childName}-${selectedDate}.pdf`);
}

// ── Orbit background decoration ───────────────────────────────────────────────
function OrbitBg() {
  return (
    <div className="orbit-bg" aria-hidden>
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="600" cy="100" rx="220" ry="100" fill="none" stroke="#7C6AF7" strokeWidth="0.6" strokeDasharray="4 8" opacity="0.25" />
        <ellipse cx="600" cy="100" rx="320" ry="160" fill="none" stroke="#7C6AF7" strokeWidth="0.4" strokeDasharray="4 12" opacity="0.15" />
        <ellipse cx="100" cy="500" rx="180" ry="80" fill="none" stroke="#FF7757" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.18" />
        <line x1="580" y1="20" x2="640" y2="80" stroke="#7C6AF7" strokeWidth="0.8" opacity="0.3" />
        <polygon points="640,80 634,68 648,72" fill="#7C6AF7" opacity="0.3" />
        <line x1="120" y1="480" x2="60" y2="420" stroke="#FF7757" strokeWidth="0.8" opacity="0.25" />
        <polygon points="60,420 72,426 66,412" fill="#FF7757" opacity="0.25" />
        {[[520, 60, '#FFD166'], [620, 130, '#7C6AF7'], [680, 90, '#FF7757'], [560, 160, '#52C788'], [490, 110, '#64B5F6'], [80, 520, '#FF7757'], [140, 460, '#FFD166'], [170, 530, '#7C6AF7']].map(([cx, cy, color], i) => (
          <circle key={i} cx={cx as number} cy={cy as number} r={i % 3 === 0 ? 4 : 3} fill={color as string} opacity="0.5" />
        ))}
        {[[550, 200, '#7C6AF7'], [700, 300, '#FF7757'], [200, 100, '#FFD166'], [50, 200, '#52C788']].map(([cx, cy, color], i) => (
          <circle key={`sm${i}`} cx={cx as number} cy={cy as number} r="1.5" fill={color as string} opacity="0.3" />
        ))}
      </svg>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="stat-card" style={{ '--accent': accent } as any}>
      <div className="stat-card-bar" />
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [routineData, setRoutineData] = useState<any[]>([]);
  const [gameData, setGameData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('child').select('*').eq('caregiver_id', session.user.id).then(({ data }) => {
      setChildren(data || []);
      if (data?.length) setActiveChild(data[0]);
    });
  }, [session]);

  useEffect(() => {
    if (!activeChild) return;
    loadChildData(activeChild.id);
  }, [activeChild, selectedDate]);

  async function loadChildData(childId: string) {
    setDataLoading(true);
    const start = selectedDate;
    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];
    const [{ data: emotions }, { data: routines }, { data: games }] = await Promise.all([
      supabase.from('emotion_checkin').select('*').eq('child_id', childId).gte('logged_at', start).lte('logged_at', endDate + 'T23:59:59').order('logged_at', { ascending: true }),
      supabase.from('routine').select('*').eq('child_id', childId).gte('date', start).lte('date', endDate).order('date', { ascending: true }),
      supabase.from('game_log').select('*').eq('child_id', childId).gte('date', start).lte('date', endDate).order('logged_at', { ascending: false }),
    ]);
    setEmotionData(emotions || []);
    setRoutineData(routines || []);
    setGameData(games || []);
    setDataLoading(false);
    fetchInsights(activeChild.name, emotions || [], routines || [], undefined, games || []);
  }

  async function fetchInsights(childName: string, emotions: any[], routines: any[], customPrompt?: string, games?: any[]) {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName, emotionData: emotions, routineData: routines, gameData: games, customPrompt }),
      });
      const { insights: data } = await res.json();
      setInsights(data);
    } catch (_) { setInsights(null); }
    setInsightsLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActiveChild(null); setChildren([]); setEmotionData([]); setRoutineData([]); setGameData([]); setInsights(null);
  }

  async function handleExportPDF() {
    setExportingPdf(true);
    await exportPDF({ child: activeChild, emotionData, routineData, insights, selectedDate });
    setExportingPdf(false);
  }

  // Computed stats
  const totalCheckins = emotionData.length;
  const avgCompletion = routineData.length > 0
    ? Math.round(routineData.reduce((acc, r) => {
      const t = r.steps?.length || 0;
      const d = r.steps?.filter((s: any) => s.completed).length || 0;
      return acc + (t > 0 ? d / t : 0);
    }, 0) / routineData.length * 100)
    : 0;
  const emotionCounts = emotionData.reduce((acc: Record<string, number>, e) => {
    acc[e.island] = (acc[e.island] || 0) + 1;
    return acc;
  }, {});
  const topEmotion = Object.entries(emotionCounts).length > 0
    ? Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]
    : null;

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (!session) return (
    <>
      <style>{globalStyles}</style>
      <div className="auth-screen">
        <OrbitBg />
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-dot" />
            <span className="auth-logo-text">Roamly</span>
          </div>
          <h1 className="auth-title">Caregiver Dashboard</h1>
          <p className="auth-sub">Sign in to view your child's progress</p>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {authError && <p className="auth-error">{authError}</p>}
            <button className="auth-btn" type="submit" disabled={authLoading}>
              {authLoading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </>
  );

  // ── Main dashboard ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div className="dashboard">
        <OrbitBg />

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="sidebar-logo-dot" />
            <span className="sidebar-logo-text">Roamly</span>
          </div>

          {/* Child selector */}
          <div className="child-section">
            <p className="sidebar-section-label">Child Profile</p>
            <div className="child-list">
              {children.map(child => (
                <button
                  key={child.id}
                  className={`child-btn ${activeChild?.id === child.id ? 'active' : ''}`}
                  onClick={() => setActiveChild(child)}
                >
                  <div className="child-avatar">
                    {child.name[0].toUpperCase()}
                  </div>
                  <div className="child-info">
                    <span className="child-name">{child.name}</span>
                    <span className="child-meta">
                      {child.avatar_config?.age || '—'} · {child.avatar_config?.commLevel || 'Nonverbal'}
                    </span>
                  </div>
                  {activeChild?.id === child.id && <span className="child-active-dot" />}
                </button>
              ))}
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="sidebar-nav">
            <p className="sidebar-section-label">Navigation</p>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="sidebar-bottom">
            <button
              className="export-btn"
              onClick={handleExportPDF}
              disabled={exportingPdf}
            >
              {exportingPdf ? 'Generating...' : '↓ Export PDF'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="main">
          {/* Header */}
          <div className="main-header">
            <div>
              <h1 className="main-title">
                {activeChild ? `${activeChild.name}'s Week` : 'Dashboard'}
              </h1>
              <p className="main-sub">
                {activeChild?.avatar_config?.focusAreas?.join(' · ') || 'Roamly Caregiver Portal'}
              </p>
            </div>
            <div className="header-right">
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
              <div className="header-user">
                <span className="header-user-dot" />
                <span className="header-user-email">{session.user.email?.split('@')[0]}</span>
              </div>
            </div>
          </div>

          {dataLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* ── Overview tab ── */}
              {activeTab === 'overview' && (
                <div className="tab-content">
                  {/* Stat cards */}
                  <div className="stats-grid">
                    <StatCard label="Emotion Check-ins" value={totalCheckins} sub="this week" accent="#7C6AF7" />
                    <StatCard label="Routine Days" value={routineData.length} sub="tracked" accent="#FF7757" />
                    <StatCard label="Avg Completion" value={`${avgCompletion}%`} sub="daily routine" accent="#FFD166" />
                    <StatCard
                      label="Top Emotion"
                      value={topEmotion && ISLANDS[topEmotion[0]] ? `${ISLANDS[topEmotion[0]].emoji} ${ISLANDS[topEmotion[0]].label}` : '—'}
                      sub={topEmotion ? `${topEmotion[1]}x this week` : 'no data'}
                      accent="#52C788"
                    />
                  </div>

                  {/* Emotion timeline */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Emotion Timeline</h2>
                      <span className="card-badge">{totalCheckins} entries</span>
                    </div>
                    <div className="emotion-timeline">
                      {emotionData.length === 0 ? (
                        <p className="empty-state">No emotion check-ins this week</p>
                      ) : emotionData.slice(-20).map((e, i) => {
                        const cfg = ISLANDS[e.island];
                        return (
                          <div key={i} className="emotion-dot-wrap" title={`${cfg?.label} — ${new Date(e.logged_at).toLocaleDateString()}`}>
                            <div className="emotion-dot" style={{ backgroundColor: cfg?.color || '#ccc' }}>
                              <span className="emotion-dot-emoji">{cfg?.emoji}</span>
                            </div>
                            <span className="emotion-dot-time">
                              {new Date(e.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Routine progress bars */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Routine Completion</h2>
                    </div>
                    {routineData.length === 0 ? (
                      <p className="empty-state">No routines this week</p>
                    ) : routineData.map((r, i) => {
                      const total = r.steps?.length || 0;
                      const done = r.steps?.filter((s: any) => s.completed).length || 0;
                      const pct = total > 0 ? Math.round(done / total * 100) : 0;
                      const color = pct >= 80 ? '#52C788' : pct >= 40 ? '#FFD166' : '#FF7757';
                      return (
                        <div key={i} className="routine-row">
                          <span className="routine-date">
                            {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="routine-track">
                            <div className="routine-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <span className="routine-pct" style={{ color }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Game Performance */}
                  {gameData.length > 0 && (
                    <div className="card">
                      <div className="card-header">
                        <h2 className="card-title">Learning & Memory</h2>
                        <span className="card-badge">{gameData.length} sessions</span>
                      </div>
                      <div className="game-stats-grid">
                        {['simon', 'fix', 'sequence'].map((type: string) => {
                          const logs = gameData.filter(g => g.game_type === type);
                          const best = logs.length > 0 ? Math.max(...logs.map(g => g.best_score)) : null;
                          const avgAccuracy = logs.filter(g => g.accuracy).length > 0
                            ? Math.round(logs.filter(g => g.accuracy).reduce((a, g) => a + g.accuracy, 0) / logs.filter(g => g.accuracy).length)
                            : null;
                          const gameConfigs: Record<string, { label: string; skill: string; color: string; emoji: string }> = {
                            simon: { label: 'Memory Lights', skill: 'Working Memory', color: '#7C6AF7', emoji: '💡' },
                            fix: { label: 'Fix It!', skill: 'Grammar Comprehension', color: '#FF7757', emoji: '✏️' },
                            sequence: { label: "What's Next?", skill: 'Sequential Reasoning', color: '#52C788', emoji: '🔮' },
                          };
                          const config = gameConfigs[type];
                          if (!config) return null;
                          return (
                            <div key={type} className="game-stat-card" style={{ '--game-color': config.color } as any}>
                              <div className="game-stat-top">
                                <span className="game-stat-emoji">{config.emoji}</span>
                                <div>
                                  <p className="game-stat-label">{config.label}</p>
                                  <p className="game-stat-skill">{config.skill}</p>
                                </div>
                              </div>
                              {best !== null ? (
                                <div className="game-stat-scores">
                                  <div className="game-stat-number">
                                    <span className="game-stat-value">{best}</span>
                                    <span className="game-stat-unit">best score</span>
                                  </div>
                                  {avgAccuracy !== null && (
                                    <div className="game-stat-number">
                                      <span className="game-stat-value">{avgAccuracy}%</span>
                                      <span className="game-stat-unit">accuracy</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="game-stat-empty">No sessions yet</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Emotions tab ── */}
              {activeTab === 'emotions' && (
                <div className="tab-content">
                  <div className="emotions-grid">
                    {Object.entries(ISLANDS).map(([key, cfg]) => {
                      const count = emotionCounts[key] || 0;
                      const max = Math.max(...Object.values(emotionCounts), 1);
                      return (
                        <div key={key} className="emotion-card" style={{ '--emotion-color': cfg.color } as any}>
                          <div className="emotion-card-top">
                            <span className="emotion-card-emoji">{cfg.emoji}</span>
                            <span className="emotion-card-count">{count}</span>
                          </div>
                          <p className="emotion-card-label">{cfg.label}</p>
                          <div className="emotion-card-bar-track">
                            <div
                              className="emotion-card-bar-fill"
                              style={{ width: `${(count / max) * 100}%`, backgroundColor: cfg.color }}
                            />
                          </div>
                          <p className="emotion-card-sub">{count === 1 ? '1 time' : `${count} times`} this week</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Full Check-in Log</h2>
                    </div>
                    <div className="log-list">
                      {emotionData.length === 0 ? (
                        <p className="empty-state">No check-ins recorded</p>
                      ) : emotionData.map((e, i) => {
                        const cfg = ISLANDS[e.island];
                        return (
                          <div key={i} className="log-row">
                            <div className="log-emoji-badge" style={{ backgroundColor: cfg?.color + '22', borderColor: cfg?.color + '44' }}>
                              {cfg?.emoji}
                            </div>
                            <div className="log-info">
                              <span className="log-label">{cfg?.label}</span>
                              <span className="log-time">{new Date(e.logged_at).toLocaleString()}</span>
                            </div>
                            {e.follow_up?.intensity && (
                              <span className="log-badge">{e.follow_up.intensity.replace('_', ' ')}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Routines tab ── */}
              {activeTab === 'routines' && (
                <div className="tab-content">
                  {routineData.length === 0 ? (
                    <div className="card"><p className="empty-state">No routines recorded this week</p></div>
                  ) : routineData.map((r, i) => {
                    const total = r.steps?.length || 0;
                    const done = r.steps?.filter((s: any) => s.completed).length || 0;
                    return (
                      <div key={i} className="card routine-card">
                        <div className="card-header">
                          <h2 className="card-title">
                            {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h2>
                          <span className="card-badge">{done}/{total} done</span>
                        </div>
                        <div className="steps-list">
                          {(r.steps || []).map((step: any, j: number) => (
                            <div key={j} className={`step-row ${step.completed ? 'done' : ''}`}>
                              <div className={`step-check ${step.completed ? 'checked' : ''}`}>
                                {step.completed && '✓'}
                              </div>
                              <div className="step-info">
                                <span className="step-label">{step.label}</span>
                                {step.time && <span className="step-time">{step.time}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Insights tab ── */}
              {activeTab === 'insights' && (
                <div className="tab-content">
                  {/* Gemini prompt box */}
                  <div className="card gemini-card">
                    <div className="gemini-header">
                      <div className="gemini-logo">✦ Gemini AI</div>
                      <span className="gemini-badge">Powered by Google</span>
                    </div>
                    <p className="gemini-sub">
                      Ask Gemini anything about {activeChild?.name}'s week, or request a specific type of analysis.
                    </p>
                    <div className="gemini-input-row">
                      <input
                        className="gemini-input"
                        value={geminiPrompt}
                        onChange={e => setGeminiPrompt(e.target.value)}
                        placeholder="e.g. What patterns do you see in the emotional check-ins? Should I adjust the routine?"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && geminiPrompt.trim()) {
                            fetchInsights(activeChild?.name, emotionData, routineData, geminiPrompt);
                            setGeminiPrompt('');
                          }
                        }}
                      />
                      <button
                        className="gemini-btn"
                        onClick={() => { fetchInsights(activeChild?.name, emotionData, routineData, geminiPrompt); setGeminiPrompt(''); }}
                        disabled={insightsLoading}
                      >
                        {insightsLoading ? '...' : '→'}
                      </button>
                    </div>
                  </div>

                  {insightsLoading ? (
                    <div className="card loading-card">
                      <div className="loading-spinner" />
                      <p>Gemini is analyzing {activeChild?.name}'s data...</p>
                    </div>
                  ) : insights ? (
                    <>
                      {insights.summary && (
                        <div className="card insight-card gold">
                          <h3 className="insight-heading">📋 Weekly Summary</h3>
                          <p className="insight-text">{insights.summary}</p>
                        </div>
                      )}
                      {insights.patterns?.length > 0 && (
                        <div className="card insight-card purple">
                          <h3 className="insight-heading">🔍 Patterns Observed</h3>
                          <ul className="insight-list">
                            {insights.patterns.map((p: string, i: number) => (
                              <li key={i} className="insight-list-item">{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.suggestions?.length > 0 && (
                        <div className="card insight-card coral">
                          <h3 className="insight-heading">💡 Recommendations</h3>
                          <ul className="insight-list">
                            {insights.suggestions.map((s: string, i: number) => (
                              <li key={i} className="insight-list-item">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.resources?.length > 0 && (
                        <div className="card insight-card mint">
                          <h3 className="insight-heading">📚 Helpful Resources</h3>
                          <div className="resources-list">
                            {insights.resources.map((r: any, i: number) => (
                              <a key={i} href={r.url} target="_blank" rel="noreferrer" className="resource-link">
                                <div>
                                  <p className="resource-title">{r.title}</p>
                                  <p className="resource-desc">{r.description}</p>
                                </div>
                                <span className="resource-arrow">↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="card">
                      <p className="empty-state">Click the generate button to get AI insights</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Logs tab ── */}
              {activeTab === 'logs' && (
                <div className="tab-content">
                  <div className="logs-filter-row">
                    <p className="logs-heading">All Activity Logs</p>
                  </div>
                  <div className="card">
                    <div className="log-list">
                      {[...emotionData.map(e => ({ ...e, _type: 'emotion' })),
                      ...routineData.map(r => ({ ...r, _type: 'routine' }))]
                        .sort((a, b) => new Date(b.logged_at || b.date).getTime() - new Date(a.logged_at || a.date).getTime())
                        .map((item, i) => {
                          if (item._type === 'emotion') {
                            const cfg = ISLANDS[item.island];
                            return (
                              <div key={i} className="log-row">
                                <div className="log-emoji-badge" style={{ backgroundColor: cfg?.color + '22', borderColor: cfg?.color + '44' }}>
                                  {cfg?.emoji}
                                </div>
                                <div className="log-info">
                                  <span className="log-label">Feeling {cfg?.label}</span>
                                  <span className="log-time">{new Date(item.logged_at).toLocaleString()}</span>
                                </div>
                                <span className="log-type-badge emotion">Emotion</span>
                              </div>
                            );
                          }
                          const done = item.steps?.filter((s: any) => s.completed).length || 0;
                          const total = item.steps?.length || 0;
                          return (
                            <div key={i} className="log-row">
                              <div className="log-emoji-badge" style={{ backgroundColor: '#7C6AF722', borderColor: '#7C6AF744' }}>
                                📋
                              </div>
                              <div className="log-info">
                                <span className="log-label">Routine — {done}/{total} steps</span>
                                <span className="log-time">{new Date(item.date).toLocaleDateString()}</span>
                              </div>
                              <span className="log-type-badge routine">Routine</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

// ── Global styles ─────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0A0916;
    color: #E8E4FF;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .orbit-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
  }

  /* Auth */
  .auth-screen {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 1;
  }
  .auth-card {
    background: #13112A; border: 1px solid rgba(124,106,247,0.25);
    border-radius: 24px; padding: 48px 40px; width: 100%; max-width: 420px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  }
  .auth-logo {
    display: flex; align-items: center; gap: 10px; margin-bottom: 32px;
  }
  .auth-logo-dot {
    width: 10px; height: 10px; border-radius: 50%; background: #7C6AF7;
    box-shadow: 0 0 12px #7C6AF7;
  }
  .auth-logo-text {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff;
  }
  .auth-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    color: #fff; margin-bottom: 8px;
  }
  .auth-sub { color: #6B6894; font-size: 14px; margin-bottom: 32px; }
  .auth-form { display: flex; flex-direction: column; gap: 16px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-size: 12px; font-weight: 600; color: #8B87B8; text-transform: uppercase; letter-spacing: 0.8px; }
  .field-input {
    background: #0F0E1A; border: 1px solid rgba(124,106,247,0.2);
    border-radius: 12px; padding: 14px 16px; color: #E8E4FF; font-size: 15px;
    font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #7C6AF7; }
  .auth-error { color: #FF7757; font-size: 13px; }
  .auth-btn {
    background: #7C6AF7; color: #fff; border: none; border-radius: 12px;
    padding: 16px; font-size: 16px; font-weight: 700; font-family: 'Syne', sans-serif;
    cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
  }
  .auth-btn:hover { opacity: 0.88; }
  .auth-btn:disabled { opacity: 0.5; }

  /* Dashboard layout */
  .dashboard {
    display: flex; min-height: 100vh; position: relative; z-index: 1;
  }

  /* Sidebar */
  .sidebar {
    width: 260px; min-height: 100vh; background: #0F0E1A;
    border-right: 1px solid rgba(124,106,247,0.15);
    display: flex; flex-direction: column; padding: 28px 16px; flex-shrink: 0;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
  }
  .sidebar-logo {
    display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 36px;
  }
  .sidebar-logo-dot {
    width: 9px; height: 9px; border-radius: 50%; background: #7C6AF7; box-shadow: 0 0 10px #7C6AF7;
  }
  .sidebar-logo-text {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff;
  }
  .sidebar-section-label {
    font-size: 10px; font-weight: 700; color: #4A4870; text-transform: uppercase;
    letter-spacing: 1.2px; padding: 0 8px; margin-bottom: 8px;
  }
  .child-section { margin-bottom: 32px; }
  .child-list { display: flex; flex-direction: column; gap: 4px; }
  .child-btn {
    display: flex; align-items: center; gap: 10px; padding: 10px 10px;
    border-radius: 12px; border: 1px solid transparent; background: transparent;
    cursor: pointer; text-align: left; transition: all 0.15s; width: 100%;
    color: #8B87B8;
  }
  .child-btn:hover { background: rgba(124,106,247,0.08); color: #E8E4FF; }
  .child-btn.active { background: rgba(124,106,247,0.15); border-color: rgba(124,106,247,0.3); color: #E8E4FF; }
  .child-avatar {
    width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #7C6AF7, #FF7757);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; color: #fff; flex-shrink: 0;
  }
  .child-info { flex: 1; }
  .child-name { display: block; font-size: 14px; font-weight: 600; }
  .child-meta { display: block; font-size: 11px; color: #6B6894; margin-top: 2px; }
  .child-active-dot { width: 7px; height: 7px; border-radius: 50%; background: #7C6AF7; flex-shrink: 0; }

  .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .nav-btn {
    display: flex; align-items: center; gap: 10px; padding: 11px 12px;
    border-radius: 10px; border: none; background: transparent; cursor: pointer;
    font-size: 14px; font-family: 'DM Sans', sans-serif; color: #6B6894;
    text-align: left; transition: all 0.15s; width: 100%;
  }
  .nav-btn:hover { background: rgba(124,106,247,0.08); color: #E8E4FF; }
  .nav-btn.active { background: rgba(124,106,247,0.18); color: #E8E4FF; font-weight: 600; }
  .nav-icon { font-size: 16px; }

  .sidebar-bottom { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
  .export-btn {
    background: #7C6AF7; color: #fff; border: none; border-radius: 10px;
    padding: 12px; font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
  }
  .export-btn:hover { opacity: 0.85; }
  .export-btn:disabled { opacity: 0.4; }
  .logout-btn {
    background: transparent; border: 1px solid rgba(255,119,87,0.25);
    color: #FF7757; border-radius: 10px; padding: 10px; font-size: 13px;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
  }
  .logout-btn:hover { background: rgba(255,119,87,0.08); }

  /* Main */
  .main { flex: 1; padding: 32px; overflow-y: auto; min-width: 0; }
  .main-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
  }
  .main-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #fff;
    line-height: 1.1;
  }
  .main-sub { color: #6B6894; font-size: 13px; margin-top: 6px; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .date-input {
    background: #13112A; border: 1px solid rgba(124,106,247,0.2);
    border-radius: 10px; padding: 10px 14px; color: #E8E4FF;
    font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
    cursor: pointer;
  }
  .header-user {
    display: flex; align-items: center; gap: 7px;
    background: #13112A; border: 1px solid rgba(124,106,247,0.2);
    border-radius: 10px; padding: 10px 14px;
  }
  .header-user-dot { width: 7px; height: 7px; border-radius: 50%; background: #52C788; }
  .header-user-email { font-size: 13px; color: #8B87B8; }

  /* Loading */
  .loading-state {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    padding: 80px 0; color: #6B6894;
  }
  .loading-spinner {
    width: 32px; height: 32px; border: 2px solid rgba(124,106,247,0.2);
    border-top-color: #7C6AF7; border-radius: 50; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Tab content */
  .tab-content { display: flex; flex-direction: column; gap: 20px; }

  /* Stat cards */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .stat-card {
    background: #13112A; border: 1px solid rgba(124,106,247,0.12);
    border-radius: 16px; padding: 20px; position: relative; overflow: hidden;
  }
  .stat-card-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--accent);
  }
  .stat-label { font-size: 11px; color: #6B6894; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 10px; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; line-height: 1; }
  .stat-sub { font-size: 11px; color: #4A4870; margin-top: 6px; }

  /* Card */
  .card {
    background: #13112A; border: 1px solid rgba(124,106,247,0.12);
    border-radius: 16px; padding: 24px;
  }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
  .card-badge {
    background: rgba(124,106,247,0.15); color: #A89EFF;
    border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600;
  }
  .empty-state { color: #4A4870; font-size: 14px; text-align: center; padding: 24px 0; }

  /* Emotion timeline */
  .emotion-timeline { display: flex; flex-wrap: wrap; gap: 12px; }
  .emotion-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .emotion-dot {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; transition: transform 0.15s;
  }
  .emotion-dot:hover { transform: scale(1.1); }
  .emotion-dot-emoji { font-size: 22px; line-height: 1; }
  .emotion-dot-time { font-size: 10px; color: #4A4870; }

  /* Routine rows */
  .routine-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .routine-date { font-size: 13px; color: #8B87B8; width: 140px; flex-shrink: 0; }
  .routine-track { flex: 1; height: 8px; background: rgba(124,106,247,0.1); border-radius: 4px; overflow: hidden; }
  .routine-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .routine-pct { font-size: 13px; font-weight: 700; width: 40px; text-align: right; flex-shrink: 0; }

  /* Emotion cards */
  .emotions-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .emotion-card {
    background: #13112A; border: 1px solid rgba(124,106,247,0.12);
    border-radius: 16px; padding: 20px; text-align: center;
  }
  .emotion-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
  .emotion-card-emoji { font-size: 28px; }
  .emotion-card-count { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; }
  .emotion-card-label { font-size: 13px; font-weight: 600; color: #E8E4FF; margin-bottom: 12px; }
  .emotion-card-bar-track { height: 4px; background: rgba(124,106,247,0.1); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
  .emotion-card-bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
  .emotion-card-sub { font-size: 11px; color: #4A4870; }

  /* Logs */
  .logs-filter-row { margin-bottom: 16px; }
  .logs-heading { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #fff; }
  .log-list { display: flex; flex-direction: column; gap: 2px; }
  .log-row {
    display: flex; align-items: center; gap: 14px; padding: 12px;
    border-radius: 10px; transition: background 0.1s;
  }
  .log-row:hover { background: rgba(124,106,247,0.06); }
  .log-emoji-badge {
    width: 40px; height: 40px; border-radius: 12px; border: 1px solid;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .log-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .log-label { font-size: 14px; font-weight: 600; color: #E8E4FF; }
  .log-time { font-size: 12px; color: #4A4870; }
  .log-badge {
    background: rgba(124,106,247,0.12); color: #A89EFF;
    border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 600;
  }
  .log-type-badge {
    border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700;
  }
  .log-type-badge.emotion { background: rgba(255,209,102,0.12); color: #FFD166; }
  .log-type-badge.routine { background: rgba(124,106,247,0.12); color: #A89EFF; }

  /* Routine card */
  .steps-list { display: flex; flex-direction: column; gap: 8px; }
  .step-row {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 10px; background: rgba(124,106,247,0.05);
    border: 1px solid rgba(124,106,247,0.08);
  }
  .step-row.done { opacity: 0.6; }
  .step-check {
    width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(124,106,247,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #7C6AF7; flex-shrink: 0;
  }
  .step-check.checked { background: #7C6AF7; border-color: #7C6AF7; color: #fff; }
  .step-info { flex: 1; }
  .step-label { font-size: 14px; font-weight: 500; color: #E8E4FF; }
  .step-time { font-size: 11px; color: #4A4870; margin-left: 8px; }

  /* Gemini */
  .gemini-card { border-color: rgba(124,106,247,0.35); background: linear-gradient(135deg, #13112A, #1A1535); }
  .gemini-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .gemini-logo { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #A89EFF; }
  .gemini-badge {
    background: rgba(124,106,247,0.15); color: #7C6AF7;
    border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600;
  }
  .gemini-sub { color: #6B6894; font-size: 13px; margin-bottom: 16px; }
  .gemini-input-row { display: flex; gap: 10px; }
  .gemini-input {
    flex: 1; background: #0A0916; border: 1px solid rgba(124,106,247,0.25);
    border-radius: 12px; padding: 14px 16px; color: #E8E4FF; font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .gemini-input:focus { border-color: #7C6AF7; }
  .gemini-btn {
    background: #7C6AF7; color: #fff; border: none; border-radius: 12px;
    width: 52px; font-size: 20px; cursor: pointer; transition: opacity 0.2s; flex-shrink: 0;
  }
  .gemini-btn:hover { opacity: 0.85; }
  .gemini-btn:disabled { opacity: 0.4; }
  .loading-card { display: flex; align-items: center; gap: 16px; color: #6B6894; }

  /* Insight cards */
  .insight-card { }
  .insight-card.gold { border-left: 3px solid #FFD166; }
  .insight-card.purple { border-left: 3px solid #7C6AF7; }
  .insight-card.coral { border-left: 3px solid #FF7757; }
  .insight-card.mint { border-left: 3px solid #52C788; }
  .insight-heading { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 12px; }
  .insight-text { color: #A09CC0; font-size: 14px; line-height: 1.7; }
  .insight-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .insight-list-item {
    color: #A09CC0; font-size: 14px; line-height: 1.6; padding-left: 16px; position: relative;
  }
  .insight-list-item::before { content: '·'; position: absolute; left: 0; color: #7C6AF7; font-size: 20px; line-height: 1; }

  /* Resources */
  .resources-list { display: flex; flex-direction: column; gap: 10px; }
  .resource-link {
    display: flex; align-items: center; gap: 14px; padding: 14px;
    background: rgba(82,199,136,0.06); border: 1px solid rgba(82,199,136,0.15);
    border-radius: 12px; text-decoration: none; transition: background 0.15s;
  }
  .resource-link:hover { background: rgba(82,199,136,0.1); }
  .resource-title { font-size: 14px; font-weight: 600; color: #E8E4FF; margin-bottom: 3px; }
  .resource-desc { font-size: 12px; color: #6B6894; }
  .resource-arrow { font-size: 18px; color: #52C788; flex-shrink: 0; }

  /* Game Stats */
  .game-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .game-stat-card {
    background: rgba(124,106,247,0.05); border: 1px solid rgba(124,106,247,0.12);
    border-radius: 14px; padding: 16px;
    border-left: 3px solid var(--game-color);
  }
  .game-stat-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .game-stat-emoji { font-size: 24px; flex-shrink: 0; }
  .game-stat-label { font-size: 13px; font-weight: 700; color: #E8E4FF; }
  .game-stat-skill { font-size: 11px; color: #4A4870; margin-top: 3px; }
  .game-stat-scores { display: flex; gap: 16px; }
  .game-stat-number { display: flex; flex-direction: column; gap: 2px; }
  .game-stat-value { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #fff; }
  .game-stat-unit { font-size: 11px; color: #4A4870; }
  .game-stat-empty { font-size: 13px; color: #4A4870; }

  @media (max-width: 1100px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .emotions-grid { grid-template-columns: repeat(3, 1fr); }
    .game-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { padding: 20px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .emotions-grid { grid-template-columns: repeat(2, 1fr); }
    .game-stats-grid { grid-template-columns: 1fr; }
  }
`;
