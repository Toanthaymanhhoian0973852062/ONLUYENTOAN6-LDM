
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  let variantStyles = '';
  let sizeStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-primary text-white hover:bg-blue-500 focus:ring-primary';
      break;
    case 'secondary':
      variantStyles = 'bg-secondary text-white hover:bg-violet-500 focus:ring-secondary';
      break;
    case 'outline':
      variantStyles = 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-primary hover:bg-blue-100 focus:ring-primary';
      break;
    case 'danger':
      variantStyles = 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500';
      break;
  }

  switch (size) {
    case 'sm':
      sizeStyles = 'px-3 py-1 text-sm';
      break;
    case 'md':
      sizeStyles = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyles = 'px-5 py-3 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
