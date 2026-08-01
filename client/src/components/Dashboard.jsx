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
  token,
  addToHistory, 
  removeFromHistory, 
  navigateToAnalytics, 
  isSyncingHistory, 
  syncHistoryClicks,
  openAuthModal
}) {
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [result, setResult] = useState(null);
  const [showQr, setShowQr] = useState(false);
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
        body: JSON.stringify({ longUrl }),
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
        createdAt: data.data.createdAt
      };

      setResult(newUrl);
      addToHistory(newUrl);
      setLongUrl('');
      


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
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortUrl)}`;
      const response = await fetch(qrUrl);
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

  const filteredHistory = history.filter(
    (item) =>
      item.longUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                <button className="btn-secondary" onClick={() => setShowQr(!showQr)}>
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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(result.shortUrl)}`}
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
              onClick={syncHistoryClicks}
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
              />
            </div>
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
        ) : filteredHistory.length === 0 ? (
          <div className="glass-card empty-history">
            <Search size={36} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No matching links found</p>
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
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
