import React, { useState, useEffect } from 'react';
import { Users, Mail, ShieldAlert, Award } from 'lucide-react';

function AdminPanel({ apiFetch, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/users/all');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          const errData = await res.json();
          addToast(errData.message || 'Failed to load user directory', 'error');
        }
      } catch (err) {
        addToast('Network error loading users', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [apiFetch, addToast]);

  return (
    <div className="glass-panel" style={{ padding: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div className="logo-icon" style={{ background: 'var(--color-primary)' }}>
          <Users size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            User Directory
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Database overview of all registered StudentOS accounts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving user database...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert className="empty-icon" size={48} />
          <h3 className="empty-title">Access Restricted</h3>
          <p className="empty-desc">No accounts found or database query failed.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>System Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    {u.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: 'var(--text-dim)' }} />
                      {u.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.role === 'ADMIN' ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        background: 'rgba(139, 92, 246, 0.15)', 
                        color: 'var(--color-primary)', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}>
                        <Award size={12} />
                        ADMIN
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-flex', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: 'var(--text-muted)', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        USER
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
