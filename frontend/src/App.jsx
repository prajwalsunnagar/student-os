import { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  LogOut,
  User,
  ListTodo,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  UserCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('student_os_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('student_os_user') || 'null'));
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Auth form states
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App/Dashboard states
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, rate: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Search, Filter, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterState, setFilterState] = useState('all'); // all, active, completed
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Custom Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Ref for search debounce
  const debounceTimerRef = useRef(null);

  // Show Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 3500); // 350ms debounce

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterState, limit]);

  // Fetch tasks and statistics
  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchStats();
    }
  }, [token, page, limit, filterState, debouncedSearch]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/tasks?limit=10000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const allTasks = await res.json();
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.completed).length;
        const active = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        setStats({ total, completed, active, rate });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `/tasks?page=${page}&limit=${limit}`;
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      if (filterState === 'completed') {
        url += `&completed=true`;
      } else if (filterState === 'active') {
        url += `&completed=false`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        handleLogout();
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        // If data length is equal to limit, we assume there might be more tasks
        setHasMore(data.length === limit);
      } else {
        const errData = await res.json();
        showToast(errData.message || "Failed to fetch tasks", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auth: Login / Register handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast("Email and password are required.", "error");
      return;
    }
    if (isRegistering && !authName) {
      showToast("Name is required.", "error");
      return;
    }

    setAuthLoading(true);
    try {
      if (isRegistering) {
        const res = await fetch('/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Registration successful! Please log in.", "success");
          setIsRegistering(false);
          setAuthPassword(''); // Keep email, clear password
        } else {
          showToast(data.message || "Registration failed", "error");
        }
      } else {
        const res = await fetch('/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('student_os_token', data.token);
          localStorage.setItem('student_os_user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          showToast(`Welcome back, ${data.user.name}!`, "success");
          // Clear inputs
          setAuthName('');
          setAuthEmail('');
          setAuthPassword('');
        } else {
          showToast(data.message || "Invalid credentials", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Check connection.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_os_token');
    localStorage.removeItem('student_os_user');
    setToken('');
    setUser(null);
    setTasks([]);
    setStats({ total: 0, completed: 0, active: 0, rate: 0 });
    showToast("Logged out successfully.", "info");
  };

  // Task Operations
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || newTaskTitle.trim() === '') {
      showToast("Task title cannot be empty.", "error");
      return;
    }

    try {
      const res = await fetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTaskTitle })
      });
      const data = await res.json();
      if (res.ok) {
        setNewTaskTitle('');
        showToast("Task created successfully!", "success");
        // Refresh
        fetchTasks();
        fetchStats();
      } else {
        showToast(data.message || "Failed to create task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error creating task.", "error");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const res = await fetch(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: task.title,
          completed: !task.completed
        })
      });
      if (res.ok) {
        // Toggle locally immediately for snappy responsiveness
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
        showToast(task.completed ? "Task marked active" : "Task completed! Well done.", "success");
        fetchStats();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating task.", "error");
    }
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = async (task) => {
    if (!editingTitle || editingTitle.trim() === '') {
      showToast("Task title cannot be empty.", "error");
      return;
    }

    try {
      const res = await fetch(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTitle,
          completed: task.completed
        })
      });
      if (res.ok) {
        setEditingTaskId(null);
        showToast("Task renamed successfully.", "success");
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to rename task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error renaming task.", "error");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast("Task deleted.", "success");
        fetchTasks();
        fetchStats();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting task.", "error");
    }
  };

  return (
    <>
      {/* Background ambient glow shapes */}
      <div className="ambient-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="app-container">
        {!token ? (
          /* Authentication View */
          <div className="auth-wrapper">
            <div className="auth-card glass-panel">
              <div className="auth-header">
                <div className="auth-logo">
                  <ListTodo size={30} />
                </div>
                <h2 className="auth-title">StudentOS</h2>
                <p className="auth-subtitle">Organize your academic life seamlessly</p>
              </div>

              <div className="auth-tabs">
                <button
                  className={`auth-tab ${!isRegistering ? 'active' : ''}`}
                  onClick={() => setIsRegistering(false)}
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab ${isRegistering ? 'active' : ''}`}
                  onClick={() => setIsRegistering(true)}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth}>
                {isRegistering && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-container">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="John Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required={isRegistering}
                      />
                      <User className="input-icon" size={18} />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-container">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@university.edu"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                    <Mail className="input-icon" size={18} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-container">
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                    <Lock className="input-icon" size={18} />
                  </div>
                </div>

                <button type="submit" className="btn" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 className="spinner" size={18} />
                  ) : isRegistering ? (
                    <>
                      <UserCheck size={18} />
                      <span>Create Account</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Dashboard View */
          <div className="dashboard-wrapper">
            {/* Header Panel */}
            <header className="dashboard-header glass-panel">
              <div className="logo-section">
                <div className="logo-icon">
                  <ListTodo size={22} />
                </div>
                <h1 className="logo-text">StudentOS</h1>
              </div>

              <div className="user-profile">
                <div className="user-info">
                  <p className="welcome-msg">Logged in as</p>
                  <p className="user-name">{user?.name || "Student"}</p>
                </div>
                <div className="avatar">
                  {(user?.name || "S").charAt(0).toUpperCase()}
                </div>
                <button
                  className="btn-icon"
                  title="Logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            {/* Statistics Cards */}
            <section className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-card-glow" style={{ background: 'rgba(139, 92, 246, 0.15)' }}></div>
                <div className="stat-header">
                  <span className="stat-title">Total Tasks</span>
                  <ListTodo className="stat-icon" size={20} />
                </div>
                <div className="stat-value">
                  {statsLoading ? <Loader2 className="spinner" size={24} /> : stats.total}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-card-glow" style={{ background: 'rgba(16, 185, 129, 0.15)' }}></div>
                <div className="stat-header">
                  <span className="stat-title">Completed Tasks</span>
                  <CheckCircle2 className="stat-icon" size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <div className="stat-value">
                  {statsLoading ? <Loader2 className="spinner" size={24} /> : stats.completed}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-card-glow" style={{ background: 'rgba(245, 158, 11, 0.15)' }}></div>
                <div className="stat-header">
                  <span className="stat-title">Pending Tasks</span>
                  <AlertCircle className="stat-icon" size={20} style={{ color: 'var(--color-warning)' }} />
                </div>
                <div className="stat-value">
                  {statsLoading ? <Loader2 className="spinner" size={24} /> : stats.active}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-card-glow" style={{ background: 'rgba(79, 70, 229, 0.15)' }}></div>
                <div className="stat-header">
                  <span className="stat-title">Completion Rate</span>
                  <TrendingUp className="stat-icon" size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="stat-value">
                  {statsLoading ? <Loader2 className="spinner" size={24} /> : `${stats.rate}%`}
                </div>
                <div className="stat-progress-container">
                  <div className="stat-progress-bar-bg">
                    <div
                      className="stat-progress-bar-fill"
                      style={{ width: `${statsLoading ? 0 : stats.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Task Controls & Lists */}
            <main className="task-controls glass-panel">
              <div className="controls-row">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="search-icon" size={18} />
                </div>

                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${filterState === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterState('all')}
                  >
                    All Tasks
                  </button>
                  <button
                    className={`filter-tab ${filterState === 'active' ? 'active' : ''}`}
                    onClick={() => setFilterState('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`filter-tab ${filterState === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilterState('completed')}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {/* Add task bar */}
              <form onSubmit={handleCreateTask} className="add-task-row">
                <input
                  type="text"
                  placeholder="What needs to be done? Enter task..."
                  className="add-task-input"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button type="submit" className="btn-add">
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </form>

              {/* Task list render */}
              <div style={{ marginTop: '24px' }}>
                {loading && tasks.length === 0 ? (
                  <div className="loading-overlay">
                    <Loader2 className="spinner" size={32} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Retrieving tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <ListTodo size={48} />
                    </div>
                    <p className="empty-title">No tasks found</p>
                    <p className="empty-desc">
                      {debouncedSearch
                        ? `No matches found for "${debouncedSearch}". Try adjusting your keywords.`
                        : filterState === 'completed'
                        ? "You haven't completed any tasks yet. Keep going!"
                        : filterState === 'active'
                        ? "Hooray! No pending tasks left."
                        : "Start by writing your first task in the input bar above!"}
                    </p>
                  </div>
                ) : (
                  <div className="tasks-list-container">
                    {tasks.map(task => (
                      <div key={task.id} className="task-item">
                        <div className="task-left">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(task)}
                            />
                            <span className="checkmark"></span>
                          </label>

                          <div className="task-content-wrapper">
                            {editingTaskId === task.id ? (
                              <input
                                type="text"
                                className="task-edit-input"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(task);
                                  if (e.key === 'Escape') setEditingTaskId(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`task-title ${task.completed ? 'completed' : ''}`}
                                onDoubleClick={() => !task.completed && handleStartEdit(task)}
                              >
                                {task.title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-actions">
                          {editingTaskId === task.id ? (
                            <>
                              <button
                                className="task-btn task-btn-save"
                                title="Save changes"
                                onClick={() => handleSaveEdit(task)}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="task-btn"
                                title="Cancel editing"
                                onClick={() => setEditingTaskId(null)}
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {!task.completed && (
                                <button
                                  className="task-btn task-btn-edit"
                                  title="Edit task title"
                                  onClick={() => handleStartEdit(task)}
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                  className="task-btn task-btn-delete"
                                  title="Delete task"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {tasks.length > 0 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    <span>
                      Page {page} {(!hasMore && page === 1) ? '' : '(showing up to ' + limit + ' tasks)'}
                    </span>
                    <div className="limit-select-wrapper">
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Show:</span>
                      <select
                        className="limit-select"
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={55}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="pagination-buttons">
                    <button
                      className="btn-page"
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>
                    <button
                      className="btn-page"
                      disabled={!hasMore}
                      onClick={() => setPage(prev => prev + 1)}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}

export default App;