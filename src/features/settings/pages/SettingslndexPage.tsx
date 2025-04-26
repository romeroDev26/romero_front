import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Esta página simplemente redirige a la página de usuarios del sistema
const SettingsIndexPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/settings/users');
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-full">
      <p className="text-gray-500">Redirigiendo...</p>
    </div>
  );
};

export default SettingsIndexPage;