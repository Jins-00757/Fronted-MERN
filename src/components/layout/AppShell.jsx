import { AppShell as MantineAppShell, Navbar, Header, useMantineColorScheme } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { Navbar as NavbarComponent } from './Navbar';
import { Outlet } from 'react-router-dom';

export const AppShell = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useAuth();

  return (
    
      

        
      

      

        
      

    
  );
}