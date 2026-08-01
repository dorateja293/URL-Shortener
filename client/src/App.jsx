import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, BarChart3, Link2, LogOut, Moon, Sun } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AuthModal from './components/AuthModal';
import { apiUrl } from './utils/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAnalyticsCode, setSelectedAnalyticsCode] = useState('');
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [historyQuery, setHistoryQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    sort: 'createdAt',
  });
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);

  // Authentication States
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('snipurl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('snipurl_token') || '';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('snipurl_theme') || 'dark';
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('snipurl_theme', theme);
  }, [theme]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken('');
    setHistory([]);
    localStorage.removeItem('snipurl_user');
    localStorage.removeItem('snipurl_token');
    setIsUserDropdownOpen(false);
  }, []);

  // Fetch user profile using token
  const fetchProfile = useCallback(async (authToken) => {
    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.data.user);
        localStorage.setItem('snipurl_user', JSON.stringify(data.data.user));
      } else {
        // Token is invalid/expired
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to verify profile', err);
    }
  }, [handleLogout]);

  // Google OAuth callback logic & Token Verification on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');

    if (oauthToken) {
      // Save OAuth token
      setToken(oauthToken);
      localStorage.setItem('snipurl_token', oauthToken);
      fetchProfile(oauthToken);

      // Clean query parameters from URL bar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token) {
      // Validate existing local token on startup
      fetchProfile(token);
    }
  }, [fetchProfile, token]);

  // Sync user-owned links from the server
  const syncHistoryClicks = useCallback(async (queryOverrides = {}) => {
    if (!token) {
      setHistory([]);
      return;
    }

    const nextQuery = {
      page: 1,
      limit: 10,
      search: '',
      sort: 'createdAt',
      ...queryOverrides,
    };
    const params = new URLSearchParams();
    Object.entries(nextQuery).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setIsSyncingHistory(true);
    try {
      const res = await fetch(apiUrl(`/api/url/my?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to load links');
      }

      setHistory(data.data);
      setHistoryPagination(data.pagination);
      setHistoryQuery(nextQuery);
    } catch (err) {
      console.error('Error syncing history', err);
    } finally {
      setIsSyncingHistory(false);
    }
  }, [token]);

  // Sync links whenever auth changes
  useEffect(() => {
    syncHistoryClicks();
  }, [syncHistoryClicks]);

  const navigateToAnalytics = (shortCode) => {
    setSelectedAnalyticsCode(shortCode);
    setActiveTab('analytics');
  };

  const addToHistory = (urlObj) => {
    setHistory((prev) => {
      const exists = prev.some((item) => item.shortCode === urlObj.shortCode);
      if (exists) return prev;
      return [urlObj, ...prev];
    });
  };

  const removeFromHistory = async (shortCode) => {
    if (!token) return;

    try {
      const res = await fetch(apiUrl(`/api/url/${shortCode}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Unable to delete link');
      }

      setHistory((prev) => prev.filter((item) => item.shortCode !== shortCode));
    } catch (err) {
      console.error('Failed to delete link', err);
    }
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('snipurl_user', JSON.stringify(userData));
    localStorage.setItem('snipurl_token', authToken);
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    const names = user.name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <header className="navbar">
        <a href="/" className="logo-container" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
          <Link2 className="logo-glow" size={28} />
          <span>Snip<span className="logo-glow">URL</span></span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <nav className="nav-links">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
          </nav>

          <button
            className="theme-toggle"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Widget */}
          {user ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button 
                className="avatar-btn" 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                title="Account Settings"
              >
                {getUserInitials()}
              </button>
              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user.name}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="nav-btn active" 
              onClick={() => setIsAuthModalOpen(true)}
              style={{ padding: '0.6rem 1.4rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1 }}>
        {user && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.5s ease-out' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 6px var(--secondary-glow)' }}></span>
            Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</span>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <Dashboard
            history={history}
            pagination={historyPagination}
            query={historyQuery}
            token={token}
            addToHistory={addToHistory}
            removeFromHistory={removeFromHistory}
            navigateToAnalytics={navigateToAnalytics}
            isSyncingHistory={isSyncingHistory}
            syncHistoryClicks={syncHistoryClicks}
            openAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : (
          <Analytics
            selectedCode={selectedAnalyticsCode}
            setSelectedCode={setSelectedAnalyticsCode}
            navigateToDashboard={() => setActiveTab('dashboard')}
            token={token}
            openAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">SnipURL</div>
        <div>
          Premium URL Shortener & Analytics System
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Terms</a>
          <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Privacy</a>
        </div>
      </footer>

      {/* Auth Dialog Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

export default App;
