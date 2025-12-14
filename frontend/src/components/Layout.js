import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Button,
  Toolbar,
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const DRAWER_WIDTH = 280;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = user
    ? [
        { text: t('nav.tournamentPlatform'), icon: <HomeIcon />, path: '/' },
        { text: t('nav.createTournament'), icon: <EmojiEventsIcon />, path: '/tournaments/create' },
        { text: t('nav.friends'), icon: <PeopleIcon />, path: '/friends' },
        { text: t('nav.profile'), icon: <PersonIcon />, path: '/profile' },
      ]
    : [
        { text: t('nav.tournamentPlatform'), icon: <HomeIcon />, path: '/' },
        { text: t('nav.login'), icon: <LoginIcon />, path: '/login' },
        { text: t('nav.register'), icon: <PersonAddIcon />, path: '/register' },
      ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar
          sx={{
            minHeight: '80px !important',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(91, 159, 255, 0.4)',
              '&:hover': {
                textShadow: '0 0 15px rgba(91, 159, 255, 0.6)',
              },
              transition: 'all 0.3s ease',
              textAlign: 'center',
            }}
          >
            {t('nav.tournamentPlatform')}
          </Typography>
        </Toolbar>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List sx={{ pt: 2 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/profile' && location.pathname.startsWith('/profile'));
              
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5, px: 2 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? 'primary.contrastText' : 'text.secondary',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <LanguageSelector />
          {user && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 40, height: 40 }} src={user.avatar_url} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.username}
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'error.main',
                    color: 'error.main',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {t('nav.logout')}
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

