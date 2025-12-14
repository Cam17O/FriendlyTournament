import React from 'react';
import { Button, Menu, MenuItem, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    handleClose();
  };

  return (
    <Box>
      <Button
        fullWidth
        onClick={handleClick}
        sx={{
          color: 'text.secondary',
          justifyContent: 'flex-start',
          textTransform: 'none',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        startIcon={<LanguageIcon />}
      >
        {i18n.language === 'en' ? 'English' : 'Français'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={i18n.language === 'en'}
        >
          English
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('fr')}
          selected={i18n.language === 'fr'}
        >
          Français
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
