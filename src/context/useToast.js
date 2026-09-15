import { useContext } from 'react';
import toastContext from './toastContext';

export const useToast = () => {
  const ctx = useContext(toastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export default useToast;
