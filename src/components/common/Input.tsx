import React, { forwardRef, useEffect, useRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', type, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    
    // Prevenir cambio de valor al hacer scroll sobre inputs numéricos
    useEffect(() => {
      if (type === 'number') {
        const inputElement = (ref as React.RefObject<HTMLInputElement>)?.current || internalRef.current;
        
        if (!inputElement) return;
        
        const handleWheel = (e: WheelEvent) => {
          // Prevenir el cambio de valor solo si el input está enfocado
          if (document.activeElement === inputElement) {
            e.preventDefault();
          }
        };
        
        inputElement.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
          inputElement.removeEventListener('wheel', handleWheel);
        };
      }
    }, [type, ref]);
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref || internalRef}
          type={type}
          className={`block ${
            fullWidth ? 'w-full' : ''
          } rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20 transition ${
            error ? 'border-error' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
