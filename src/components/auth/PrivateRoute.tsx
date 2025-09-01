// src/components/auth/PrivateRoute.tsx
import React, { JSX, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { usePermissions } from '../../hooks/usePermissions';
import { Spinner } from '../common/Spinner';

interface PrivateRouteProps {
  children: JSX.Element;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();
  const { hasRoutePermission } = usePermissions();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // Obtener el rol del usuario desde el servicio de auth o localStorage
        const user = authService.getCurrentUser();
        const userRole = user?.role?.name || user?.role_name;

        // Verificar permisos para la ruta actual
        const hasPermission = hasRoutePermission(location.pathname, userRole);
        setHasAccess(hasPermission);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [location.pathname, hasRoutePermission]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a la página de login pero guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to="/" replace />;
  }

  return children;
};