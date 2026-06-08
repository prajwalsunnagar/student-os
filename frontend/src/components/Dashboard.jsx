import React, { useState, useEffect, useCallback } from 'react';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  LogOut, 
  ClipboardList,
  Shield,
  Users
} from 'lucide-react';
import AdminPanel from './AdminPanel';

function Dashboard({ user, logout, apiFetch, addToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states for Admin: 'tasks' or 'users'
  const [activeView, setActiveView] = useState('tasks');

  // Stats states
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalMatching, setTotalMatching] = useState(0);

  // Task creation/editing state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page on search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Fetch all tasks for stats & pagination counts
  const fetchStatsAndCounts = useCallback(async () => {
    try {
      // Fetch overall list (limit=100000) to calculate dashboard stats
      const statsRes = await apiFetch('/tasks?limit=100000');
      if (statsRes.ok) {
        const allTasks = await statsRes.json();
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.completed).length;
        const pending = total - completed;
        setStats({ total, completed, pending });

        // Calculate totalMatching count based on current filter & search
        const matching = allTasks.filter(t => {
          const matchesSearch = t.title.toLowerCase().includes(debouncedSearch.toLowerCase());
          const matchesFilter = 
            filter === 'all' || 
            (filter === 'completed' && t.completed) || 
            (filter === 'pending' && !t.completed);
          return matchesSearch && matchesFilter;
        });
        setTotalMatching(matching.length);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [apiFetch, debouncedSearch, filter]);

  // Fetch paginated tasks for display
  const fetchPaginatedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const completedQuery = filter === 'all' ? '' : `&completed=${filter === 'completed'}`;
      const url = `/tasks?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}${completedQuery}`;
      
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        addToast('Failed to load tasks', 'error');
      }
    } catch (err) {
      addToast('Network error loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, currentPage, limit, debouncedSearch, filter, addToast]);

  // Fetch everything initially and when dependencies change
  useEffect(() => {
    if (activeView === 'tasks') {
      fetchPaginatedTasks();
      fetchStatsAndCounts();
    }
  }, [fetchPaginatedTasks, fetchStatsAndCounts, activeView]);

  // Create task handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      addToast('Task title cannot be empty', 'error');
      return;
    }

    try {
      const res = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: newTaskTitle })
      });

      const data = await res.json();

      if (res.ok) {
        addToast('Task created successfully', 'success');
        setNewTaskTitle('');
        fetchPaginatedTasks();
        fetchStatsAndCounts();
      } else {
        addToast(data.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      addToast('Network error creating task', 'error');
    }
  };

  // Toggle completion checkbox handler
  const handleToggleComplete = async (task) => {
    try {
      const res = await apiFetch(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          title: task.title, 
          completed: !task.completed 
        })
      });

      if (res.ok) {
        addToast(
          !task.completed ? 'Task completed! Good job!' : 'Task set to pending', 
          'success'
        );
        fetchPaginatedTasks();
        fetchStatsAndCounts();
      } else {
        const data = await res.json();
        addToast(data.message || 'Failed to update task', 'error');
      }
    } catch (err) {
      addToast('Network error updating task status', 'error');
    }
  };

  // Start inline editing
  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Cancel inline editing
  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  // Save inline edit
  const handleSaveEdit = async (task) => {
    if (!editingTitle.trim()) {
      addToast('Task title cannot be empty', 'error');
      return;
    }

    try {
      const res = await apiFetch(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          title: editingTitle, 
          completed: task.completed 
        })
      });

      if (res.ok) {
        addToast('Task title updated', 'success');
        setEditingTaskId(null);
        fetchPaginatedTasks();
        fetchStatsAndCounts();
      } else {
        const data = await res.json();
        addToast(data.message || 'Failed to rename task', 'error');
      }
    } catch (err) {
      addToast('Network error renaming task', 'error');
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addToast('Task deleted successfully', 'success');
        // If we delete the last item on a page, navigate back
        if (tasks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchPaginatedTasks();
          fetchStatsAndCounts();
        }
      } else {
        const data = await res.json();
        addToast(data.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      addToast('Network error deleting task', 'error');
    }
  };

  // Pagination calculation helper
  const totalPages = Math.ceil(totalMatching / limit) || 1;
  const startRange = totalMatching === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRange = Math.min(currentPage * limit, totalMatching);

  // Avatar initial letter
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Completion percentage
  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header glass-panel">
        <div className="logo-section">
          <div className="logo-icon">
            <ListTodo size={22} />
          </div>
          <span className="logo-text">StudentOS</span>
        </div>

        {/* Navigation Tabs for Admins */}
        {user.role === 'ADMIN' && (
          <div className="filter-tabs" style={{ margin: '0 auto' }}>
            <button 
              className={`filter-tab ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveView('tasks')}
            >
              <ListTodo size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              My Tasks
            </button>
            <button 
              className={`filter-tab ${activeView === 'users' ? 'active' : ''}`}
              onClick={() => setActiveView('users')}
            >
              <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              User Directory
            </button>
          </div>
        )}

        <div className="user-profile">
          <div className="user-info">
            <span className="welcome-msg">Welcome back,</span>
            <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {user.name}
              {user.role === 'ADMIN' && (
                <span title="Administrator" style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
                  <Shield size={14} />
                </span>
              )}
            </div>
          </div>
          <div className="avatar">{userInitial}</div>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {activeView === 'users' ? (
        <AdminPanel apiFetch={apiFetch} addToast={addToast} />
      ) : (
        <>
          {/* Stats Cards */}
          <section className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span className="stat-title">Total Tasks</span>
                <ListTodo className="stat-icon" size={18} />
              </div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-card-glow" style={{ background: 'rgba(139, 92, 246, 0.08)' }}></div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span className="stat-title">Completed Tasks</span>
                <CheckCircle2 className="stat-icon" size={18} style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.completed}</div>
              <div className="stat-card-glow" style={{ background: 'rgba(16, 185, 129, 0.08)' }}></div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span className="stat-title">Pending Tasks</span>
                <Clock className="stat-icon" size={18} style={{ color: 'var(--color-warning)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.pending}</div>
              <div className="stat-card-glow" style={{ background: 'rgba(245, 158, 11, 0.06)' }}></div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span className="stat-title">Task Completion</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {completionPercentage}%
                </span>
              </div>
              <div className="stat-value">{completionPercentage}%</div>
              <div className="stat-progress-container">
                <div className="stat-progress-bar-bg">
                  <div 
                    className="stat-progress-bar-fill" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="stat-card-glow" style={{ background: 'rgba(79, 70, 229, 0.08)' }}></div>
            </div>
          </section>

          {/* Task Controls & Create Input */}
          <section className="glass-panel task-controls">
            <div className="controls-row">
              <div className="search-wrapper">
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="search-icon" size={18} />
              </div>

              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Add Task Row */}
            <form className="add-task-row" onSubmit={handleCreateTask}>
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                className="add-task-input"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <button type="submit" className="btn-add">
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            </form>
          </section>

          {/* Tasks List */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            {loading ? (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)' }}>Retrieving tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <ClipboardList className="empty-icon" size={48} />
                <h3 className="empty-title">No tasks here</h3>
                <p className="empty-desc">
                  {debouncedSearch 
                    ? `No tasks match your search "${debouncedSearch}"` 
                    : filter === 'completed' 
                    ? "You haven't completed any tasks yet. Keep going!" 
                    : "Create a task above to kickstart your schedule!"}
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
                          onChange={() => handleToggleComplete(task)}
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
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            className={`task-title ${task.completed ? 'completed' : ''}`}
                            onDoubleClick={() => startEdit(task)}
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
                            onClick={() => handleSaveEdit(task)}
                            title="Save changes"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="task-btn" 
                            onClick={cancelEdit}
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="task-btn task-btn-edit" 
                            onClick={() => startEdit(task)}
                            title="Edit task name"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            className="task-btn task-btn-delete" 
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                <span>
                  Showing {startRange}–{endRange} of {totalMatching} tasks
                </span>
                <div className="limit-select-wrapper">
                  <span>Show:</span>
                  <select 
                    className="limit-select"
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="pagination-buttons">
                <button 
                  className="btn-page"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>
                
                <span className="btn-page" style={{ cursor: 'default', background: 'none', borderColor: 'transparent' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button 
                  className="btn-page"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
