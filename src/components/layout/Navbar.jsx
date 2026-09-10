import { Flex, Button, Avatar, Menu, useMantineColorScheme, ActionIcon } from '@mantine/core';
import { IconMoon, IconSun, IconLogout, IconSettings } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ user, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still redirect even if logout fails
      navigate('/login');
    }
  };

  return (
    
      
Sales Pipeline


      
         toggleColorScheme()}
          title="Toggle color scheme"
        >
          {colorScheme === 'dark' ?  : }
        

        {user && (
          

            
              
            
            
              {user.email}
               navigate('/settings')} leftSection={}>
                Settings
              
              
              } color="red">
                Logout
              
            
          

        )}
      
    
  );
};