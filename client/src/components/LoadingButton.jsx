import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({ 
  loading, 
  children, 
  loadingText, 
  className = "btn btn-primary", 
  type = "submit", 
  disabled, 
  onClick, 
  ...props 
}) => {
  return (
    <button
      type={type}
      className={className}
      disabled={loading || disabled}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', ...props.style }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? (loadingText || children) : children}
    </button>
  );
};

export default LoadingButton;
