import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumbs from '../common/Breadcrumbs';
import { 
  Bars3Icon, 
  TicketIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon,
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';
import Sidebar from './Sidebar';
import { useWebSocketNotifications } from '../../hooks/useWebSocketNotifications';
import SellerNotificationsModal from '../common/SellerNotificationsModal';
import { CancellationRequestListItem } from '../../features/accounting/types/cancellationRequests';

// Ya no necesitamos declarar el timeout global ni las keys de scroll
const STORAGE_KEY_SIDEBAR_HIDDEN = 'dashboard_sidebar_hidden';

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
    name: 'Ventas Rápidas',
    path: '/fluvial/operations/quick-sales',
    icon: BriefcaseIcon,
    bgColor: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
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

  // Verificar roles
  const isSupervisor = currentUser?.role?.name?.toLowerCase() === 'supervisor' || 
                       currentUser?.role_name?.toLowerCase() === 'supervisor' ||
                       currentUser?.role?.name?.toLowerCase() === 'admin' ||
                       currentUser?.role_name?.toLowerCase() === 'admin';
  const isSeller = currentUser?.role?.name?.toLowerCase() === 'sales' || 
                   currentUser?.role_name?.toLowerCase() === 'sales';

  // Estado para el contador de solicitudes pendientes (solo supervisores)
  const [pendingCount, setPendingCount] = useState(0);

  // Estado para vendedores: contador de respuestas y modal
  const [sellerResponsesCount, setSellerResponsesCount] = useState(0);
  const [sellerRequests, setSellerRequests] = useState<CancellationRequestListItem[]>([]);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loadingSellerRequests, setLoadingSellerRequests] = useState(false);

  // Función para obtener el contador de pendientes (supervisores)
  const fetchPendingCount = useCallback(async () => {
    if (!isSupervisor) return;
    
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      const count = await cancellationRequestsService.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error al obtener solicitudes pendientes:', err);
    }
  }, [isSupervisor, currentUser]);

  // Función para obtener las respuestas del vendedor
  const fetchSellerResponses = useCallback(async () => {
    if (!isSeller) return;
    
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      const count = await cancellationRequestsService.getUnreadResolvedCount();
      setSellerResponsesCount(count);
    } catch (err) {
      console.error('Error al obtener respuestas del vendedor:', err);
    }
  }, [isSeller]);

  // Función para cargar las solicitudes del vendedor cuando abre el modal
  const handleOpenSellerModal = async () => {
    setShowSellerModal(true);
    setLoadingSellerRequests(true);
    
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      const requests = await cancellationRequestsService.getMyRequests();
      setSellerRequests(requests);
      
      // Marcar todas las respuestas resueltas como vistas
      cancellationRequestsService.markResolvedAsViewed(requests);
      
      // Actualizar el contador a 0 inmediatamente
      setSellerResponsesCount(0);
    } catch (err) {
      console.error('Error al cargar solicitudes del vendedor:', err);
      toast.error('No se pudieron cargar tus solicitudes');
    } finally {
      setLoadingSellerRequests(false);
    }
  };

  // Handlers para eventos WebSocket (memoizados con dependencias correctas)
  const handleCancellationRequestCreated = useCallback(() => {
    if (isSupervisor) {
      // Incrementar contador cuando se crea una nueva solicitud
      setPendingCount(prev => prev + 1);
    }
  }, [isSupervisor]);

  const handleCancellationRequestResolved = useCallback(() => {
    if (isSupervisor) {
      // Decrementar contador cuando se resuelve una solicitud
      setPendingCount(prev => Math.max(0, prev - 1));
    } else if (isSeller) {
      // El vendedor recibe una notificación de respuesta
      fetchSellerResponses();
    }
  }, [isSupervisor, isSeller, fetchSellerResponses]);

  // WebSocket para notificaciones en tiempo real (para todos los usuarios)
  // Los vendedores recibirán notificaciones cuando sus solicitudes sean resueltas
  // Los supervisores recibirán notificaciones y se actualizará el contador
  const { isConnected } = useWebSocketNotifications({
    enabled: !!currentUser,
    onCancellationRequestCreated: handleCancellationRequestCreated,
    onCancellationRequestResolved: handleCancellationRequestResolved
  });

  // Cargar contadores iniciales
  useEffect(() => {
    if (isSupervisor) {
      fetchPendingCount();
    }
  }, [isSupervisor, fetchPendingCount]);

  useEffect(() => {
    if (isSeller) {
      fetchSellerResponses();
    }
  }, [isSeller, fetchSellerResponses]);

  // Escuchar evento personalizado cuando se resuelve una solicitud localmente
  useEffect(() => {
    if (!isSupervisor) return;

    const handleLocalResolution = () => {
      // Actualizar contador cuando se resuelve una solicitud localmente
      fetchPendingCount();
    };

    window.addEventListener('cancellation-request-resolved', handleLocalResolution);

    return () => {
      window.removeEventListener('cancellation-request-resolved', handleLocalResolution);
    };
  }, [isSupervisor, fetchPendingCount]);

  // Sincronizar contador cuando la ventana recupera el foco (para evitar desincronización)
  useEffect(() => {
    if (!isSupervisor) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-sincronizar contador cuando el usuario vuelve a la pestaña
        fetchPendingCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupervisor, fetchPendingCount]);

  // Usamos useCallback para que estas funciones no se re-creen en cada render,
  // lo que es importante para la optimización con React.memo en el Sidebar.
  const handleLogout = useCallback(() => {
    // Usar el servicio de autenticación que ya incluye la limpieza completa
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
        <header className="bg-white shadow-sm rounded-xl mb-4 lg:mb-5">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center space-x-3 lg:space-x-4">
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
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-32 lg:w-48"></div>
                ) : error ? (
                  <span className="text-sm text-red-500">Error</span>
                ) : currentUser ? (
                  <span className="text-sm text-gray-600">
                    <span className="hidden sm:inline">Bienvenido, </span><strong>{currentUser.first_name || currentUser.full_name}</strong>
                  </span>
                ) : null}
              </div>

              {/* Separador vertical */}
              {(isSupervisor || isSeller) && (
                <div className="h-8 w-px bg-gray-300"></div>
              )}

              {/* Campanita de notificaciones (solo para supervisores) */}
              {isSupervisor && (
                <button
                  onClick={() => navigate('/supervisor/cancellation-requests')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Ver solicitudes de anulación pendientes"
                >
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Solicitudes de Anulación</span>
                  <div className="relative">
                    <BellAlertIcon className="w-6 h-6 text-red-500" />
                    {pendingCount > 0 && (
                      <>
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                        <span className="absolute -top-1 -right-1 inline-flex w-5 h-5 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      </>
                    )}
                  </div>
                </button>
              )}

              {/* Ícono de mensajes (solo para vendedores) */}
              {isSeller && (
                <button
                  onClick={handleOpenSellerModal}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Ver respuestas a tus solicitudes de anulación"
                >
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Mis Respuestas</span>
                  <div className="relative">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
                    {sellerResponsesCount > 0 && (
                      <>
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                          {sellerResponsesCount > 99 ? '99+' : sellerResponsesCount}
                        </span>
                        <span className="absolute -top-1 -right-1 inline-flex w-5 h-5 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                      </>
                    )}
                  </div>
                </button>
              )}
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
          <div className="p-4 lg:p-6">
            <Breadcrumbs />
            <div className="mt-4">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Modal de respuestas para vendedores */}
      {isSeller && (
        <SellerNotificationsModal
          isOpen={showSellerModal}
          onClose={() => setShowSellerModal(false)}
          requests={sellerRequests}
          isLoading={loadingSellerRequests}
        />
      )}
    </div>
  );
};
