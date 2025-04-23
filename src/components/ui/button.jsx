import React from 'react';

export function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  ...props 
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'outline':
        return 'bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      default: // default variant
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
