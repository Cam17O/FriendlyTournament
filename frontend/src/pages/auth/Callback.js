import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser().then(() => {
        navigate('/');
      });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, fetchUser]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
};

export default Callback;

