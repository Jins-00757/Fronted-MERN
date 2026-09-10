import { Container, Card, TextInput, PasswordInput, Button, Text, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (!value.includes('@') ? 'Invalid email' : null),
      password: (value) => (!value ? 'Password is required' : null),
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
      
        
          
Sales Pipeline

          
            Sign in to your account
          

          {error && (
            } color="red" mb="lg">
              {error}
            
          )}

          

            
              

              

              
                Sign In
              
            
          


          
            Don't have an account? Sign up
          
        
      
    
  );
};