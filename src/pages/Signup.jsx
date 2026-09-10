import { Container, Card, TextInput, PasswordInput, Button, Text, Stack, Alert, PasswordStrength } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (!value.includes('@') ? 'Invalid email' : null),
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    try {
      await signup(values.name, values.email, values.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
      
        
          
Create Account

          
            Join Sales Pipeline Intelligence
          

          {error && (
            } color="red" mb="lg">
              {error}
            
          )}

          

            
              

              

              

              
                Create Account
              
            
          


          
            Already have an account? Sign in
          
        
      
    
  );
};