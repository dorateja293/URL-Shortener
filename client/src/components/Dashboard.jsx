import React, { useState } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  QrCode, 
  BarChart3, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  Download
} from 'lucide-react';


function Dashboard({ 
  history, 
  pagination,
  query,
  token,
  addToHistory, 
  removeFromHistory, 
  navigateToAnalytics, 
  isSyncingHistory, 
  syncHistoryClicks,
  openAuthModal
}) {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(query.search || '');
  const [sortBy, setSortBy] = useState(query.sort || 'createdAt');
  const [copiedCode, setCopiedCode] = useState('');
  const [result, setResult] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  // Instant local validation
  const validateUrl = (url) => {
    if (!url) return 'Please enter a URL to shorten';
    
    // Quick regex check for http/https protocol and base format
    const pattern = /^https?:\/\/.+/i;
    if (!pattern.test(url)) {
      return 'URL must start with http:// or https://';
    }
    
    try {
      new URL(url);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setShowQr(false);
    setQrPreviewUrl('');

    if (!token) {
      setError('Please sign in to create and manage your links.');
      openAuthModal();
      return;
    }

    const validationMsg = validateUrl(longUrl);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/url/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          longUrl,
          customAlias: customAlias.trim() || undefined,
          expiresIn: expiresIn || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to shorten URL');
      }

      const newUrl = {
        longUrl: data.data.longUrl,
        shortCode: data.data.shortCode,
        shortUrl: data.data.shortUrl,
        clicks: data.data.clickCount || 0,
        expiresAt: data.data.expiresAt,
        isCustomAlias: data.data.isCustomAlias,
        createdAt: data.data.createdAt
      };

      setResult(newUrl);
      addToHistory(newUrl);
      setLongUrl('');
      setCustomAlias('');
      setExpiresIn('');
      setExpiresAt('');
      


    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortUrl, shortCode) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const downloadQrCode = async (shortUrl, shortCode) => {
    setIsDownloadingQr(true);
    try {
      const response = await fetch(`/api/url/${shortCode}/qrcode`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qr_${shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code', err);
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const toggleQrPreview = async () => {
    if (showQr) {
      setShowQr(false);
      return;
    }

    if (qrPreviewUrl) {
      setShowQr(true);
      return;
    }

    try {
      const response = await fetch(`/api/url/${result.shortCode}/qrcode`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const blob = await response.blob();
      setQrPreviewUrl(URL.createObjectURL(blob));
      setShowQr(true);
    } catch (err) {
      setError(err.message || 'Failed to generate QR code');
    }
  };

  const refreshHistory = (page = 1) => {
    syncHistoryClicks({
      page,
      limit: query.limit,
      search: searchQuery.trim(),
      sort: sortBy,
    });
  };

  return (
    <div>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Shorten. Track. Optimize.
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
          Create clean, trackable links instantly. Monitor browser, operating system, and geolocation click statistics in real-time.
        </p>
      </div>

      {/* Main Glassmorphic Panel */}
      <div className="glass-card glow-indigo">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link2 size={20} className="logo-glow" />
          Shorten a Long Link
        </h2>

        <form onSubmit={handleShorten} className="form-group">
          <div className="input-glow-wrapper">
            <input
              type="text"
              placeholder="Paste your long link here (e.g., https://example.com/deep/path/page)"
              className="url-input"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                Shortening...
              </>
            ) : (
              'Shorten Link'
            )}
          </button>
        </form>

        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <div className="input-glow-wrapper">
            <input
              type="text"
              placeholder="Custom alias (optional, e.g. openai)"
              className="url-input"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              disabled={loading}
            />
          </div>
          <select
            className="url-input"
            value={expiresIn}
            onChange={(e) => { setExpiresIn(e.target.value); setExpiresAt(''); }}
            disabled={loading}
            style={{ maxWidth: '180px' }}
          >
            <option value="">No expiry</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
          <input
            type="date"
            className="url-input"
            value={expiresAt}
            onChange={(e) => { setExpiresAt(e.target.value); setExpiresIn(''); }}
            disabled={loading}
            style={{ maxWidth: '170px' }}
          />
        </div>

        {error && (
          <div className="validation-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Shorten Success Display */}
        {result && (
          <div className="result-panel">
            <div className="result-main">
              <div className="result-row">
                <span className="result-url-text">{result.shortUrl}</span>
                <button
                  className={`btn-action ${copiedCode === result.shortCode ? 'success' : ''}`}
                  onClick={() => copyToClipboard(result.shortUrl, result.shortCode)}
                  title="Copy to Clipboard"
                >
                  {copiedCode === result.shortCode ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div className="result-buttons">
                <button className="btn-secondary" onClick={toggleQrPreview}>
                  <QrCode size={18} />
                  {showQr ? 'Hide QR Code' : 'Generate QR Code'}
                </button>
                <button className="btn-secondary" onClick={() => navigateToAnalytics(result.shortCode)}>
                  <BarChart3 size={18} />
                  Detailed Analytics
                </button>
              </div>
            </div>

            {showQr && (
              <div className="qr-panel">
                <div className="qr-code-wrapper">
                  <img
                    src={qrPreviewUrl}
                    alt="QR Code"
                    width="130"
                    height="130"
                  />
                </div>
                <button 
                  className="qr-download-link" 
                  onClick={() => downloadQrCode(result.shortUrl, result.shortCode)}
                  disabled={isDownloadingQr}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <Download size={14} />
                  {isDownloadingQr ? 'Downloading...' : 'Download PNG'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local History Section */}
      <div className="history-section">
        <div className="section-header">
          <div className="section-title">
            <span>Your Shortened Links</span>
            <button
              className="btn-action"
              onClick={() => refreshHistory(query.page)}
              disabled={isSyncingHistory || history.length === 0}
              title="Refresh Clicks"
              style={{ width: '32px', height: '32px', border: 'none', background: 'rgba(255,255,255,0.03)' }}
            >
              <RefreshCw size={14} className={isSyncingHistory ? 'spinner' : ''} />
            </button>
          </div>

          {history.length > 0 && (
            <div className="history-search-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search history..."
                className="history-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') refreshHistory(1);
                }}
              />
            </div>
          )}
          {history.length > 0 && (
            <select
              className="history-search"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                syncHistoryClicks({
                  page: 1,
                  limit: query.limit,
                  search: searchQuery.trim(),
                  sort: e.target.value,
                });
              }}
              style={{ width: '170px', paddingLeft: '1rem' }}
            >
              <option value="createdAt">Newest</option>
              <option value="clicks">Most clicks</option>
              <option value="expiresAt">Expiry date</option>
            </select>
          )}
        </div>

        {history.length === 0 ? (
          <div className="glass-card empty-history">
            <Link2 size={36} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No links shortened yet</p>
              <p style={{ fontSize: '0.85rem' }}>Your shortened URLs will appear here so you can copy and track them easily.</p>
            </div>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Original Link</th>
                  <th>Short Link</th>
                  <th>Clicks</th>
                  <th>Expires</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.shortCode}>
                    <td className="original-url-cell" title={item.longUrl}>
                      {item.longUrl}
                    </td>
                    <td className="short-url-cell">
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer">
                        {item.shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                    <td>
                      <span className={`clicks-badge ${isSyncingHistory ? 'syncing' : ''}`}>
                        <BarChart3 size={12} />
                        {item.clicks}
                      </span>
                    </td>
                    <td className="date-cell">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="date-cell">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={`btn-action ${copiedCode === item.shortCode ? 'success' : ''}`}
                          onClick={() => copyToClipboard(item.shortUrl, item.shortCode)}
                          title="Copy Link"
                          style={{ width: '32px', height: '32px' }}
                        >
                          {copiedCode === item.shortCode ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => navigateToAnalytics(item.shortCode)}
                          title="View Analytics"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <BarChart3 size={14} />
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => removeFromHistory(item.shortCode)}
                          title="Delete from History"
                          style={{ width: '32px', height: '32px', color: 'rgba(239, 68, 68, 0.7)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Page {pagination.page} of {pagination.totalPages} - {pagination.total} links
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => refreshHistory(pagination.page - 1)}>
                    Previous
                  </button>
                  <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => refreshHistory(pagination.page + 1)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
