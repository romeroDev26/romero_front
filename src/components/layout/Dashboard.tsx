// src/components/layout/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumbs from '../common/Breadcrumbs';
import { 
  Bars3Icon, 
  TicketIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';
import Sidebar from './Sidebar'; // Importa el nuevo componente

// Ya no necesitamos declarar el timeout global ni las keys de scroll
const STORAGE_KEY_SIDEBAR_HIDDEN = 'dashboard_sidebar_hidden';
const STORAGE_KEY_EXPANDED_MENUS = 'dashboard_expanded_menus';

// Accesos rápidos para las funciones más comerciales
const quickAccessItems = [
  {
    name: 'Punto de Venta',
    path: '/fluvial/operations/sales-point',
    icon: TicketIcon,
    bgColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    textColor: 'text-white'
  },
  {
    name: 'Encomiendas',
    path: '/fluvial/operations/cargo-sale',
    icon: CubeIcon,
    bgColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    textColor: 'text-white'
  },
  {
    name: 'Reservas',
    path: '/fluvial/operations/reservations',
    icon: ClipboardDocumentListIcon,
    bgColor: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    textColor: 'text-white'
  },
  {
    name: 'Manifiestos',
    path: '/fluvial/operations/manifests',
    icon: DocumentTextIcon,
    bgColor: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    textColor: 'text-white'
  }
];


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Estado para el sidebar móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para el sidebar en desktop (persistente)
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    if (window.innerWidth < 1024) return true;
    const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR_HIDDEN);
    return saved ? JSON.parse(saved) : false;
  });

  // Efecto para persistir el estado del sidebar en desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_HIDDEN, JSON.stringify(sidebarHidden));
    }
  }, [sidebarHidden]);
  
  // Efecto para manejar el cambio de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarHidden(true);
        setSidebarOpen(false); // Asegúrate de que el overlay móvil se cierre
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: currentUser, isLoading, error } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      try {
        const data = await authService.getProfile();
        return data;
      } catch (error: any) {
        console.error('Error al obtener el perfil del usuario:', error);
        if (error.response?.status === 401) {
          handleLogout(); // Llama a la función de logout directamente
        } else {
          toast.error('No se pudo cargar la información del usuario');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  // Usamos useCallback para que estas funciones no se re-creen en cada render,
  // lo que es importante para la optimización con React.memo en el Sidebar.
  const handleLogout = useCallback(() => {
    // Limpiamos todo el localStorage relevante
    localStorage.removeItem(STORAGE_KEY_EXPANDED_MENUS);
    localStorage.removeItem(STORAGE_KEY_SIDEBAR_HIDDEN);
    localStorage.removeItem('dashboard_sidebar_scroll'); // Limpiamos el scroll
    authService.logout();
    navigate('/login');
  }, [navigate]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarHidden(!sidebarHidden);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-5">
      {/* Sidebar para móvil (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 flex flex-col w-80 max-w-xs m-5">
                <Sidebar 
                    currentUser={currentUser} 
                    onLogout={handleLogout} 
                    onCloseMobile={() => setSidebarOpen(false)}
                />
            </div>
        </div>
      )}

      {/* Sidebar para escritorio */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${sidebarHidden ? 'w-0' : 'w-80'}`}>
        <div className={`flex flex-col w-80 transition-opacity duration-300 ${sidebarHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Sidebar 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onCloseMobile={() => {}} // No necesita hacer nada en desktop
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${!sidebarHidden && 'lg:ml-5'}`}>
        {/* Barra superior */}
        <header className="bg-white shadow-sm rounded-xl mb-5">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
              >
                <Bars3Icon className="w-6 h-6 text-gray-700" />
              </button>
              
              {/* Info de usuario en la barra superior */}
               <div>
                {isLoading ? (
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-48"></div>
                ) : error ? (
                  <span className="text-sm text-red-500">Error al cargar usuario</span>
                ) : currentUser ? (
                  <span className="text-sm text-gray-600">
                    Bienvenido, <strong>{currentUser.first_name || currentUser.full_name}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-500 font-medium mr-2">Accesos Rápidos:</span>
              {quickAccessItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${item.bgColor} ${item.hoverColor} ${item.textColor} shadow-sm hover:shadow-md`}
                  title={`Ir a ${item.name}`}
                >
                  <item.icon className="w-4 h-4 mr-1.5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <Breadcrumbs />
            <div className="mt-4">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};