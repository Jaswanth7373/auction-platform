import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiLock } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || {} });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.phone) fd.append('phone', form.phone);
      fd.append('address', JSON.stringify(form.address));
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await userAPI.updateProfile(fd);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 max-w-2xl">
          <h1 className="text-2xl font-black text-white mb-6">My Profile</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[['profile', 'Profile Info'], ['password', 'Password']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:text-white bg-dark-800/60'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-dark p-6 rounded-2xl">
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple overflow-hidden">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">{user?.name?.[0]?.toUpperCase()}</div>}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                    <FiCamera className="text-white text-xs" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-dark-400 text-sm">{user?.email}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 capitalize mt-1 inline-block">{user?.role}</span>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Full Name</label>
                  <div className="relative"><FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Email <span className="text-dark-600">(cannot change)</span></label>
                  <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input type="email" value={user?.email} disabled className="input-field pl-10 opacity-50 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Phone</label>
                  <div className="relative"><FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" className="input-field pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">City</label>
                    <input type="text" value={form.address?.city || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="New York" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Country</label>
                    <input type="text" value={form.address?.country || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} placeholder="US" className="input-field" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave />Save Changes</>}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'password' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-dark p-6 rounded-2xl">
              <form onSubmit={handlePasswordSave} className="space-y-4">
                {[
                  { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                  { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-sm text-dark-400 mb-1.5 block">{label}</label>
                    <div className="relative"><FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                      <input type="password" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })} placeholder={placeholder} className="input-field pl-10" required />
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiLock />Change Password</>}
                </button>
              </form>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
