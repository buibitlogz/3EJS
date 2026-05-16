'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';
import { User } from '@/stores/usersStore';
import { LayoutWrapper } from '@/components/common/LayoutWrapper';
import { PageContainer, Card, Button } from '@/components/common/PageContainer';
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer';
import { useUsersStore } from '@/stores/usersStore';
import { syncFromRemote } from '@/lib/unified-db';

type TabType = 'themes' | 'users';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('themes');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const { users, fetchUsers, addUser, updateUser, deleteUser, isSubmitting } = useUsersStore();
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: UserRole.VIEW_ONLY as UserRole });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) return;
    if (!editingUser && userForm.role !== UserRole.VIEW_ONLY && !userForm.password.trim()) {
      alert('Password is required for this role');
      return;
    }
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', role: UserRole.VIEW_ONLY });

    if (editingUser) {
      const ok = await updateUser(editingUser.id, userForm.username, userForm.password || undefined, userForm.role);
      if (ok) alert('User updated successfully');
    } else {
      const ok = await addUser(userForm.username, userForm.password, userForm.role);
      if (ok) alert('User added successfully');
    }
  };

  const handleSyncFromSupabase = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      await syncFromRemote();
      setSyncMsg('Synced from Supabase successfully');
    } catch (e) {
      setSyncMsg('Sync failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <LayoutWrapper>
        <PageContainer title="Settings" subtitle="Application settings and configuration">
          <Card>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-text mb-2">Admin Access Required</h2>
              <p className="text-text/50">You do not have permission to access this page.</p>
            </motion.div>
          </Card>
        </PageContainer>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <PageContainer title="Settings" subtitle="Application settings and configuration">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'themes' as TabType, label: 'Themes' },
            { key: 'users' as TabType, label: 'Users' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-text/60 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'themes' && (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">Sync from Supabase</h2>
                    <p className="text-sm text-text/50">Pull latest data from the cloud database</p>
                  </div>
                </div>

                <button
                  onClick={handleSyncFromSupabase}
                  disabled={syncing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Syncing...
                    </span>
                  ) : (
                    'Sync from Supabase'
                  )}
                </button>

                {syncMsg && (
                  <p className="mt-3 text-sm text-text/50">{syncMsg}</p>
                )}
              </Card>

              <ThemeCustomizer />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text">User Management</h2>
                      <p className="text-sm text-text/50">Manage user accounts and roles</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowUserModal(true)}>
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text/50">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text/50">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text/50">Created</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-text/50">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-background/50">
                          <td className="px-4 py-3 text-sm text-text font-medium">{u.username}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.role === UserRole.ADMIN ? 'bg-purple-500/20 text-purple-400' :
                              u.role === UserRole.TECHNICIAN ? 'bg-blue-500/20 text-blue-400' :
                              u.role === UserRole.E_LOAD ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                              className="text-blue-400 hover:text-blue-300 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                  deleteUser(u.id, u.username).then(() => {
                                    alert('User deleted successfully');
                                  }).catch((err) => {
                                    alert('Failed to delete user: ' + (err.message || err));
                                  });
                                }
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showUserModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text">
                          {editingUser ? 'Edit User' : 'Add New User'}
                        </h3>
                        <button onClick={() => { setShowUserModal(false); setEditingUser(null); setUserForm({ username: '', password: '', role: UserRole.VIEW_ONLY }); }} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-background/80">
                          <svg className="w-5 h-5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text/70 mb-1">Username</label>
                          <input
                            type="text"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text"
                          />
                        </div>
                        {userForm.role !== UserRole.VIEW_ONLY && (
                          <div>
                            <label className="block text-sm font-medium text-text/70 mb-1">
                              Password {!editingUser && <span className="text-red-400">*</span>}
                            </label>
                            <input
                              type="password"
                              value={userForm.password}
                              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text"
                              placeholder={editingUser ? 'Leave blank to keep current' : ''}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-text/70 mb-1">Role</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole, password: '' })}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text"
                          >
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.TECHNICIAN}>Technician</option>
                            <option value={UserRole.E_LOAD}>E-Load</option>
                            <option value={UserRole.VIEW_ONLY}>View Only</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button onClick={handleSaveUser} disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Saving...
                            </span>
                          ) : editingUser ? 'Update' : 'Add User'}
                        </Button>
                        <Button variant="secondary" onClick={() => { setShowUserModal(false); setEditingUser(null); setUserForm({ username: '', password: '', role: UserRole.VIEW_ONLY }); }} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </LayoutWrapper>
  );
}