import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';
import Sidebar from './Sidebar';
import { useWebSocketNotifications } from '../../hooks/useWebSocketNotifications';
import SellerNotificationsModal from '../common/SellerNotificationsModal';
import { CancellationRequestListItem } from '../../features/accounting/types/cancellationRequests';
import { useSystemUpdates } from '../../features/updates/hooks/useSystemUpdates';
import SystemUpdatesModal from '../../features/updates/components/SystemUpdatesModal';

// Ya no necesitamos declarar el timeout global ni las keys de scroll
const STORAGE_KEY_SIDEBAR_HIDDEN = 'dashboard_sidebar_hidden';
const PENDING_SYNC_TTL_MS = 30000;

// Accesos rápidos para las funciones más comerciales
const quickAccessItems = [
  {
    name: 'Punto de Venta',
    path: '/fluvial/operations/sales-point',
    icon: TicketIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-700',
    activeBg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  {
    name: 'Encomiendas',
    path: '/fluvial/operations/cargo-sale',
    icon: CubeIcon,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-700',
    activeBg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  {
    name: 'Venta Rápida',
    path: '/fluvial/operations/quick-sales',
    icon: BriefcaseIcon,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    activeBorder: 'border-violet-500',
    activeText: 'text-violet-700',
    activeBg: 'bg-violet-50',
    dot: 'bg-violet-500',
  },
  {
    name: 'Reservas',
    path: '/fluvial/operations/reservations',
    icon: ClipboardDocumentListIcon,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    activeBorder: 'border-indigo-500',
    activeText: 'text-indigo-700',
    activeBg: 'bg-indigo-50',
    dot: 'bg-indigo-500',
  },
  {
    name: 'Manifiestos',
    path: '/fluvial/operations/manifests',
    icon: DocumentTextIcon,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    activeBorder: 'border-orange-500',
    activeText: 'text-orange-700',
    activeBg: 'bg-orange-50',
    dot: 'bg-orange-500',
  },
];


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const lastPendingSyncRef = useRef(0);

  // Novedades del sistema
  const { updates, hasNew, markAsSeen } = useSystemUpdates();
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  // Auto-abrir modal de novedades si hay actualizaciones no vistas
  const autoOpenedRef = React.useRef(false);
  useEffect(() => {
    if (!autoOpenedRef.current && hasNew && updates.length > 0) {
      autoOpenedRef.current = true;
      setShowUpdatesModal(true);
    }
  }, [hasNew, updates]);

  const handleCloseUpdates = () => {
    setShowUpdatesModal(false);
    markAsSeen();
  };

  // Estado para vendedores: contador de respuestas y modal
  const [sellerResponsesCount, setSellerResponsesCount] = useState(0);
  const [sellerRequests, setSellerRequests] = useState<CancellationRequestListItem[]>([]);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loadingSellerRequests, setLoadingSellerRequests] = useState(false);

  // Función para obtener el contador de pendientes (supervisores)
  const fetchPendingCount = useCallback(async () => {
    if (!isSupervisor) return;
    const now = Date.now();
    if (now - lastPendingSyncRef.current < PENDING_SYNC_TTL_MS) return;
    lastPendingSyncRef.current = now;
    
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      const count = await cancellationRequestsService.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error al obtener solicitudes pendientes:', err);
    }
  }, [isSupervisor]);

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
    } catch (err) {
      console.error('Error al cargar solicitudes del vendedor:', err);
      toast.error('No se pudieron cargar tus solicitudes');
    } finally {
      setLoadingSellerRequests(false);
    }
  };

  // Función para marcar todas las solicitudes como leídas
  const handleMarkAllAsRead = async () => {
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      await cancellationRequestsService.markMultipleAsRead(sellerRequests);
      
      // Recargar las solicitudes para reflejar el cambio
      const updatedRequests = await cancellationRequestsService.getMyRequests();
      setSellerRequests(updatedRequests);
      
      // Actualizar el contador
      const count = await cancellationRequestsService.getUnreadResolvedCount();
      setSellerResponsesCount(count);
      
      toast.success('Todas las respuestas han sido marcadas como leídas');
    } catch (err) {
      console.error('Error al marcar como leídas:', err);
      toast.error('No se pudieron marcar las solicitudes como leídas');
    }
  };

  // Función para marcar una sola solicitud como leída
  const handleMarkOneAsRead = async (requestId: number) => {
    try {
      const { cancellationRequestsService } = await import('../../features/accounting/services/cancellationRequests.service');
      await cancellationRequestsService.markAsRead(requestId);
      
      // Actualizar la solicitud en el estado local
      setSellerRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, requester_read_at: new Date().toISOString() }
            : req
        )
      );
      
      // Actualizar el contador
      setSellerResponsesCount(prev => Math.max(0, prev - 1));
      
      toast.success('Mensaje marcado como leído');
    } catch (err) {
      console.error('Error al marcar como leída:', err);
      toast.error('No se pudo marcar el mensaje como leído');
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
      lastPendingSyncRef.current = 0;
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
      lastPendingSyncRef.current = 0;
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
                  pendingCount={pendingCount}
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
            pendingCount={pendingCount}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${!sidebarHidden && 'lg:ml-5'}`}>
        {/* Barra superior */}
        <header className="bg-white rounded-xl mb-4 lg:mb-5 border border-slate-200 shadow-sm overflow-hidden">
          {/* Fila superior: saludo + banner notificaciones + seller */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 lg:px-6 py-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
              >
                <Bars3Icon className="w-6 h-6 text-slate-600" />
              </button>

              <div>
                {isLoading ? (
                  <div className="space-y-1.5">
                    <div className="animate-pulse h-4 bg-slate-200 rounded w-36"></div>
                    <div className="animate-pulse h-3 bg-slate-100 rounded w-48"></div>
                  </div>
                ) : currentUser ? (
                  <>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      ¡Hola, {currentUser.first_name || currentUser.full_name}!
                    </h2>
                    <p className="text-xs text-slate-500">Bienvenido al panel de control de transporte.</p>
                  </>
                ) : null}
              </div>
            </div>

            {/* Banner de solicitudes de anulación (supervisores) */}
            {isSupervisor && (
              <div className="flex-1 max-w-md">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
                      <BellAlertIcon className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Solicitudes de Anulación</p>
                      <p className="text-sm text-slate-700 font-medium truncate">
                        {pendingCount > 0
                          ? `${pendingCount} revisión${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''} hoy`
                          : 'Sin pendientes por el momento'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/supervisor/cancellation-requests')}
                    className="flex-shrink-0 bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    Ver
                    {pendingCount > 0 && (
                      <span className="bg-white text-primary text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Botón de Novedades (visible para todos) */}
            <button
              onClick={() => { setShowUpdatesModal(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors relative"
              title="Ver novedades del sistema"
            >
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">Novedades</span>
              <div className="relative">
                <SparklesIcon className="w-5 h-5 text-amber-500" />
                {hasNew && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
            </button>

            {/* Separador */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Respuestas del vendedor */}
            {isSeller && (
              <button
                onClick={handleOpenSellerModal}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Ver respuestas a tus solicitudes de anulación"
              >
                <span className="text-sm font-medium text-slate-700 hidden sm:inline">Mis Respuestas</span>
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

          {/* Navegación de accesos rápidos (tabs estilo log.md) */}
          <nav className="border-t border-slate-200 bg-slate-50/50 px-4 lg:px-6">
            <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {quickAccessItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? `${item.activeBorder} ${item.activeText} ${item.activeBg}`
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 ${item.iconBg}`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                    </span>
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>
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

      {/* Modal de novedades del sistema */}
      <SystemUpdatesModal
        isOpen={showUpdatesModal}
        onClose={handleCloseUpdates}
        updates={updates}
      />

      {/* Modal de respuestas para vendedores */}
      {isSeller && (
        <SellerNotificationsModal
          isOpen={showSellerModal}
          onClose={() => setShowSellerModal(false)}
          requests={sellerRequests}
          isLoading={loadingSellerRequests}
          onMarkAllAsRead={handleMarkAllAsRead}
          onMarkOneAsRead={handleMarkOneAsRead}
        />
      )}
    </div>
  );
};
