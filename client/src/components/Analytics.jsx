import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  ExternalLink, 
  Globe, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Clock,
  Compass
} from 'lucide-react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const CHART_COLORS = ['#58A6FF', '#3FB950', '#8957e5', '#d29922', '#f85149'];

function Analytics({
  selectedCode,
  setSelectedCode,
  navigateToDashboard,
  token,
  openAuthModal
}) {
  const [inputCode, setInputCode] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract shortCode from various forms (full URL, code only, etc.)
  const cleanShortCode = (val) => {
    const trimmed = val.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      return parts[parts.length - 1] || parts[parts.length - 2];
    }
    return trimmed;
  };

  const fetchAnalytics = useCallback(async (code) => {
    if (!code) return;

    if (!token) {
      setError('Please sign in to view your link analytics.');
      setData(null);
      openAuthModal();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cleanCode = cleanShortCode(code);
      const res = await fetch(`/api/url/${cleanCode}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Could not fetch analytics for this link.');
      }
      
      setData(resData.data);
      setSelectedCode(cleanCode); // Set active code globally
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [openAuthModal, setSelectedCode, token]);

  useEffect(() => {
    if (selectedCode) {
      fetchAnalytics(selectedCode);
    }
  }, [fetchAnalytics, selectedCode]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    fetchAnalytics(inputCode);
  };

  const getRelativeTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (deviceType) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes('mobile') || lower.includes('phone')) return <Smartphone size={14} />;
    if (lower.includes('tablet') || lower.includes('ipad')) return <Tablet size={14} />;
    return <Laptop size={14} />;
  };

  // Helper to render breakdown progress meters
  const renderBreakdown = (title, items, total, colorClass, defaultIcon) => {
    if (!items || items.length === 0) {
      return (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No data logged yet.
        </div>
      );
    }

    return (
      <div className="breakdown-list">
        {items.map((item) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.name} className="breakdown-item">
              <div className="breakdown-info">
                <span className="breakdown-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {defaultIcon}
                  {item.name}
                </span>
                <span className="breakdown-count">
                  {item.count} click{item.count !== 1 && 's'} ({percentage}%)
                </span>
              </div>
              <div className="progress-bar-wrapper">
                <div 
                  className={`progress-fill ${colorClass}`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPieCard = (title, items) => (
    <div className="glass-card breakdown-card glow-indigo">
      <h3 className="breakdown-header">{title}</h3>
      {!items || items.length === 0 ? (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No data logged yet.
        </div>
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="count"
                nameKey="name"
                outerRadius={78}
                innerRadius={42}
                paddingAngle={2}
              >
                {items.map((item, index) => (
                  <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: 6,
                  color: '#E6EDF3'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // 1. Initial State: No code selected
  if (!selectedCode && !data) {
    return (
      <div style={{ maxWidth: '650px', margin: '2rem auto 0 auto' }}>
        <div className="glass-card glow-indigo" style={{ textAlign: 'center' }}>
          <BarChart3 size={44} className="logo-glow" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>View Link Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Enter a shortened URL or short code to fetch detailed visitor graphs, browser breakdowns, and OS stats.
          </p>

          <form onSubmit={handleSearch} className="form-group" style={{ marginBottom: '1rem' }}>
            <div className="input-glow-wrapper">
              <input
                type="text"
                placeholder="Enter short code or short link (e.g. abcd or http://localhost:5000/abcd)"
                className="url-input"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="validation-error" style={{ justifyContent: 'center' }}>
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={navigateToDashboard} style={{ margin: '0 auto' }}>
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading state (whilst fetching code details)
  if (loading && !data) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <svg className="spinner" viewBox="0 0 50 50" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }}>
            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="var(--primary)"></circle>
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  // 3. Error state with back options
  if (error && !data) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto' }}>
        <div className="glass-card glow-teal" style={{ textAlign: 'center' }}>
          <div className="validation-error" style={{ justifyContent: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
            <span>Error: {error}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => { setError(''); setSelectedCode(''); }}>
              Try Another Code
            </button>
            <button className="btn-primary" onClick={navigateToDashboard}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Analytics statistics dashboard
  if (!data) return null;

  return (
    <div className="analytics-container">
      {/* Back button and quick actions */}
      <div className="analytics-back-row">
        <button className="btn-secondary" onClick={() => { setData(null); setSelectedCode(''); }}>
          <ArrowLeft size={16} />
          Change Link
        </button>
        <button className="btn-secondary" onClick={navigateToDashboard}>
          Create New Link
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className="glass-card glow-indigo">
        <div className="analytics-title-group">
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 600 }}>
            Shortcode: {data.shortCode}
          </span>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--secondary)' }}>
            /{data.shortCode}
          </h2>
          <div className="analytics-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span>Target:</span>
            <a 
              href={data.longUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {data.longUrl}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="analytics-grid">
        <div className="stat-box">
          <div className="stat-icon-wrapper indigo">
            <BarChart3 size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.clickCount}</span>
            <span className="stat-label">Total Clicks</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper teal">
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.2rem', fontWeight: 700, padding: '0.25rem 0' }}>
              {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="stat-label">Created Date</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper purple">
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">
              {data.recentClicks ? data.recentClicks.length : 0}
            </span>
            <span className="stat-label">Logged Clicks</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper teal">
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.todayClicks || 0}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper purple">
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.yesterdayClicks || 0}</span>
            <span className="stat-label">Yesterday</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper indigo">
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.weekClicks || 0}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      <div className="glass-card glow-indigo">
        <h3 className="breakdown-header">
          <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
          Clicks Over Time
        </h3>
        <div style={{ height: 260, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyClicks || []}>
              <XAxis dataKey="date" stroke="#8b949e" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#8b949e" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: 6,
                  color: '#E6EDF3'
                }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#58A6FF"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="breakdown-grid">
        {renderPieCard('Browser Pie Chart', data.browsers)}
        {renderPieCard('OS Pie Chart', data.operatingSystems)}
        {renderPieCard('Device Pie Chart', data.devices)}
        {renderPieCard('Top Referrers', data.referrers)}
      </div>

      {/* breakdowns */}
      <div className="breakdown-grid">
        {/* Device breakdown */}
        <div className="glass-card breakdown-card glow-indigo">
          <h3 className="breakdown-header">
            <Laptop size={18} style={{ color: 'var(--primary)' }} />
            Device Breakdown
          </h3>
          {renderBreakdown(
            'Device', 
            data.devices, 
            data.totalClicks, 
            'indigo', 
            <Laptop size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        {/* Browser breakdown */}
        <div className="glass-card breakdown-card glow-teal">
          <h3 className="breakdown-header">
            <Globe size={18} style={{ color: 'var(--secondary)' }} />
            Browser Distribution
          </h3>
          {renderBreakdown(
            'Browser', 
            data.browsers, 
            data.totalClicks, 
            'indigo', 
            <Globe size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        {/* Operating Systems */}
        <div className="glass-card breakdown-card glow-teal">
          <h3 className="breakdown-header">
            <Laptop size={18} style={{ color: 'var(--secondary)' }} />
            Operating Systems
          </h3>
          {renderBreakdown(
            'OS', 
            data.operatingSystems, 
            data.totalClicks, 
            'indigo', 
            <Laptop size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        {/* Referrers */}
        <div className="glass-card breakdown-card glow-indigo">
          <h3 className="breakdown-header">
            <Compass size={18} style={{ color: 'var(--primary)' }} />
            Referrers / Traffic Sources
          </h3>
          {renderBreakdown(
            'Referrer', 
            data.referrers, 
            data.totalClicks, 
            'indigo', 
            <Compass size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      {/* Click stream timeline */}
      <div className="glass-card recent-clicks-card glow-indigo">
        <h3 className="breakdown-header" style={{ marginBottom: '1.25rem' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          Recent Clicks (Timeline Log)
        </h3>

        {!data.recentClicks || data.recentClicks.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No clicks recorded yet. Share your short URL to start collecting analytics!
          </div>
        ) : (
          <div className="timeline">
            {data.recentClicks.map((click, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-header">
                  <div className="timeline-badges">
                    <span className="badge badge-device">
                      {getDeviceIcon(click.device)}
                      {click.device}
                    </span>
                    <span className="badge badge-browser">
                      <Globe size={10} />
                      {click.browser}
                    </span>
                    <span className="badge badge-os">
                      <Laptop size={10} />
                      {click.os}
                    </span>
                    <span className="badge badge-referrer" title={`Referrer: ${click.referrer}`}>
                      <Compass size={10} />
                      {click.referrer}
                    </span>
                  </div>
                  <span className="timeline-time">
                    {getRelativeTime(click.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
