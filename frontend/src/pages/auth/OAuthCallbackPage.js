import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { initSocket, joinNotifications } from '../../services/socket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    const handleOAuth = async () => {
      try {
        localStorage.setItem('token', token);
        const { data } = await authAPI.getMe();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        const sock = initSocket(token);
        sock.on('connect', () => joinNotifications());

        toast.success(`Welcome back, ${data.user.name}!`);
        const role = data.user.role;
        navigate(role === 'admin' ? '/admin/dashboard' : role === 'seller' ? '/seller/dashboard' : '/dashboard');
      } catch {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleOAuth();
  }, [navigate, searchParams, setUser]);

  return <LoadingSpinner fullScreen text="Completing sign in..." />;
};

export default OAuthCallbackPage;
