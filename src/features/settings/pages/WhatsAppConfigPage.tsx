// src/features/settings/pages/WhatsAppConfigPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/utils/sileo-toast';
import {
  BuildingOffice2Icon,
  QrCodeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  LinkSlashIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { useBranchOffices } from '../../../hooks/useBranchOffices';
import {
  useCreateWhatsAppInstance,
  useGetQRCode,
  useLogoutInstance,
  useRestartInstance,
  useWhatsAppEventPolling,
  useCheckConnectionStatus,
} from '../../../hooks/useWhatsAppConfig';
import { whatsappConfigService } from '../../../services/whatsappConfig.service';
import { BranchOffice } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { Modal } from '../../../components/common/Modal';

type ConnectionState = 'open' | 'close' | 'connecting' | 'unknown';

interface BranchWithStatus extends BranchOffice {
  connectionState?: ConnectionState;
  isLoading?: boolean;
}

export const WhatsAppConfigPage: React.FC = () => {
  const companyId = Number(localStorage.getItem('company_id')) || 1;
  
  // Estados
  const [selectedBranch, setSelectedBranch] = useState<BranchWithStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showChangePhoneModal, setShowChangePhoneModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({});
  const [checkingInstances, setCheckingInstances] = useState<Set<string>>(new Set());
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  // Queries y mutations
  const { data: branchOffices = [], isLoading: loadingBranches, refetch: refetchBranches } = useBranchOffices(companyId);
  const createInstanceMutation = useCreateWhatsAppInstance();
  const getQRCodeMutation = useGetQRCode();
  const logoutMutation = useLogoutInstance();
  const restartMutation = useRestartInstance();
  const checkStatusMutation = useCheckConnectionStatus();

  const handleOpenCreateFromHeader = useCallback(() => {
    const branchWithoutInstance = branchOffices.find((branch) => !branch.whatsapp_instance_name);

    if (!branchWithoutInstance) {
      toast.info('Todas las sucursales ya tienen instancia de WhatsApp');
      return;
    }

    setSelectedBranch(branchWithoutInstance);
    setNewInstanceName(whatsappConfigService.generateInstanceName(branchWithoutInstance.name));
    setShowCreateModal(true);
  }, [branchOffices]);

  // Verificar estados de conexión para sucursales con instancia
  const checkConnectionStates = useCallback(async () => {
    const branchesWithInstance = branchOffices.filter(b => b.whatsapp_instance_name);
    const newStates: Record<string, ConnectionState> = {};
    
    setIsCheckingAll(true);
    
    // Usar Promise.all para verificar en paralelo
    await Promise.all(
      branchesWithInstance.map(async (branch) => {
        if (branch.whatsapp_instance_name) {
          try {
            const status = await whatsappConfigService.getConnectionStatus(branch.whatsapp_instance_name);
            newStates[branch.whatsapp_instance_name] = status.connection_state;
          } catch (error) {
            newStates[branch.whatsapp_instance_name] = 'unknown';
          }
        }
      })
    );
    
    setConnectionStates(newStates);
    setIsCheckingAll(false);
  }, [branchOffices]);

  // Verificar estado de una instancia individual
  const checkSingleInstanceStatus = useCallback(async (instanceName: string) => {
    setCheckingInstances(prev => new Set(prev).add(instanceName));
    
    try {
      const status = await checkStatusMutation.mutateAsync(instanceName);
      setConnectionStates(prev => ({
        ...prev,
        [instanceName]: status.connection_state
      }));
      
      // Mostrar mensaje según el estado
      if (status.is_connected) {
        toast.success(`${instanceName}: Conectado correctamente`);
      } else if (status.requires_qr) {
        toast.warning(`${instanceName}: Requiere escanear código QR`);
      } else {
        toast.info(`${instanceName}: ${status.message}`);
      }
    } catch (error) {
      setConnectionStates(prev => ({
        ...prev,
        [instanceName]: 'unknown'
      }));
      toast.error(`Error verificando ${instanceName}`);
    } finally {
      setCheckingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceName);
        return newSet;
      });
    }
  }, [checkStatusMutation]);

  // Callbacks memorizados para el polling de eventos
  const eventCallbacks = useMemo(() => ({
    onConnected: () => {
      toast.success('¡WhatsApp conectado exitosamente!');
      setShowQRModal(false);
      setQrCode(null);
      refetchBranches();
      checkConnectionStates();
    },
    onDisconnected: () => {
      // Solo informar si estamos esperando
    },
    onQRCodeUpdated: (newQR: string) => {
      // Actualizar el QR cuando el webhook notifique un nuevo código
      setQrCode(newQR);
      toast.info('El código QR se ha actualizado');
    },
    onError: (error: Error) => {
      void error;
    }
  }), [refetchBranches, checkConnectionStates]);

  // Hook de polling de eventos de WhatsApp
  const eventPolling = useWhatsAppEventPolling(
    selectedBranch?.whatsapp_instance_name || undefined,
    showQRModal, // Solo activo cuando el modal de QR está abierto
    eventCallbacks
  );

  useEffect(() => {
    if (branchOffices.length > 0) {
      checkConnectionStates();
      const interval = setInterval(checkConnectionStates, 15000); // Cada 15 segundos
      return () => clearInterval(interval);
    }
  }, [branchOffices, checkConnectionStates]);

  // Iniciar polling de eventos cuando se abre el modal de QR
  useEffect(() => {
    if (showQRModal && selectedBranch?.whatsapp_instance_name) {
      eventPolling.startPolling();
    } else {
      eventPolling.stopPolling();
    }
  }, [showQRModal, selectedBranch?.whatsapp_instance_name, eventPolling]);

  // Handlers
  const handleCreateInstance = async () => {
    if (!selectedBranch || !newInstanceName.trim()) {
      toast.error('Ingresa un nombre para la instancia');
      return;
    }

    try {
      const result = await createInstanceMutation.mutateAsync({
        instance_name: newInstanceName.trim(),
        branch_office_id: selectedBranch.id,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      });

      setShowCreateModal(false);
      setNewInstanceName('');
      
      // Refrescar sucursales para obtener la nueva instancia
      await refetchBranches();
      
      // Actualizar el selectedBranch con el nuevo instance_name
      setSelectedBranch(prev => prev ? {
        ...prev,
        whatsapp_instance_name: newInstanceName.trim()
      } : null);
      
      if (result.qr_code) {
        setQrCode(result.qr_code);
        setShowQRModal(true);
        // El polling se inicia automáticamente al abrir el modal (via useEffect)
      }
    } catch (error) {
      void error;
    }
  };

  const handleGetQR = async (instanceName: string) => {
    try {
      const result = await getQRCodeMutation.mutateAsync(instanceName);
      setQrCode(result.qr_code);
      setShowQRModal(true);
      // El polling se inicia automáticamente al abrir el modal (via useEffect)
    } catch (error) {
      void error;
    }
  };

  const handleLogout = async (instanceName: string) => {
    try {
      await logoutMutation.mutateAsync(instanceName);
      checkConnectionStates();
    } catch (error) {
      void error;
    }
  };

  const handleRestart = async (instanceName: string) => {
    try {
      await restartMutation.mutateAsync(instanceName);
      checkConnectionStates();
    } catch (error) {
      void error;
    }
  };

  // Cambiar de teléfono: logout + nuevo QR
  const handleChangePhone = async () => {
    if (!selectedBranch?.whatsapp_instance_name) return;
    
    const instanceName = selectedBranch.whatsapp_instance_name;
    setIsChangingPhone(true);
    
    try {
      // Paso 1: Logout de la instancia actual
      await logoutMutation.mutateAsync(instanceName);
      
      // Paso 2: Esperar un momento para que el logout se procese
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Paso 3: Obtener nuevo QR
      const result = await getQRCodeMutation.mutateAsync(instanceName);
      
      // Paso 4: Cerrar modal de cambio y abrir modal de QR
      setShowChangePhoneModal(false);
      setQrCode(result.qr_code);
      setShowQRModal(true);
      // El polling se inicia automáticamente al abrir el modal (via useEffect)
      
      toast.info('Escanea el nuevo código QR con el teléfono que deseas vincular');
    } catch (error) {
      void error;
      toast.error('Error al cambiar de teléfono. Intenta nuevamente.');
    } finally {
      setIsChangingPhone(false);
    }
  };

  const getStatusBadge = (state: ConnectionState | undefined) => {
    switch (state) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
            <SignalIcon className="w-3 h-3 mr-1" />
            Conectado
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
            <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
            Conectando
          </span>
        );
      case 'close':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
            <SignalSlashIcon className="w-3 h-3 mr-1" />
            Desconectado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dm-bg-secondary text-dm-text-primary">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Sin verificar
          </span>
        );
    }
  };

  // Estadísticas
  const branchesWithInstance = branchOffices.filter(b => b.whatsapp_instance_name);
  const connectedCount = Object.values(connectionStates).filter(s => s === 'open').length;

  const getBranchStatusMeta = (branch: BranchOffice, isChecking: boolean) => {
    if (!branch.whatsapp_instance_name) {
      return {
        label: 'Sin instancia',
        badgeClass: 'bg-dm-bg-secondary text-dm-text-secondary',
        dotClass: 'bg-slate-400',
      };
    }

    if (isChecking) {
      return {
        label: 'Verificando',
        badgeClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        dotClass: 'bg-blue-500',
      };
    }

    const state = connectionStates[branch.whatsapp_instance_name];
    switch (state) {
      case 'open':
        return {
          label: 'Conectado',
          badgeClass: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
          dotClass: 'bg-green-500',
        };
      case 'connecting':
        return {
          label: 'Conectando',
          badgeClass: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
          dotClass: 'bg-yellow-500',
        };
      case 'close':
        return {
          label: 'Desconectado',
          badgeClass: 'bg-dm-bg-secondary text-dm-text-secondary',
          dotClass: 'bg-slate-500',
        };
      default:
        return {
          label: 'Sin verificar',
          badgeClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
          dotClass: 'bg-red-500',
        };
    }
  };

  if (loadingBranches) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-dm-bg-secondary min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-dm-text-primary">
            Configuración de WhatsApp
          </h1>
        </div>
        <div className="flex shrink-0">
          <Button onClick={handleOpenCreateFromHeader} className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <PlusIcon className="w-4 h-4" />
            <span>Crear Instancia</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-primary flex items-center gap-5">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <BuildingOffice2Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-dm-text-muted uppercase tracking-wider">Total Sucursales</p>
            <p className="text-3xl font-bold text-dm-text-primary">{branchOffices.length}</p>
          </div>
        </div>

        <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-primary flex items-center gap-5">
          <div className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 p-3 rounded-lg">
            <PhoneIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-dm-text-muted uppercase tracking-wider">Con WhatsApp</p>
            <p className="text-3xl font-bold text-dm-text-primary">{branchesWithInstance.length}</p>
          </div>
        </div>

        <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-primary flex items-center gap-5">
          <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
            <CheckCircleIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-dm-text-muted uppercase tracking-wider">Conectadas</p>
            <p className="text-3xl font-bold text-dm-text-primary">{connectedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="px-2">
          <h2 className="text-2xl font-bold text-dm-text-primary">Listado de Sucursales</h2>
        </div>

        {branchOffices.map((branch) => {
          const instanceName = branch.whatsapp_instance_name;
          const connectionState = instanceName ? connectionStates[instanceName] : undefined;
          const isCheckingThis = instanceName ? checkingInstances.has(instanceName) : false;
          const statusMeta = getBranchStatusMeta(branch, isCheckingThis);

          return (
            <div
              key={branch.id}
              className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary overflow-hidden transition-all hover:shadow-md"
            >
              <div className="p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 bg-dm-bg-secondary rounded-lg flex items-center justify-center text-dm-text-muted shrink-0">
                    <BuildingOffice2Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-dm-text-primary truncate">{branch.name}</h3>
                      <span className={`inline-flex items-center self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass} mr-1.5`} />
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-dm-text-muted text-sm flex items-center gap-1 mt-1 truncate">
                      <BuildingOffice2Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{branch.port_name || branch.address_line || 'Sin dirección'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 lg:gap-6 border-t lg:border-t-0 pt-3 sm:pt-4 lg:pt-0 w-full lg:w-auto">
                  {instanceName ? (
                    <>
                      <button
                        onClick={() => checkSingleInstanceStatus(instanceName)}
                        disabled={isCheckingThis}
                        className="flex flex-col items-center gap-1 text-dm-text-secondary hover:text-primary transition-colors group disabled:opacity-60 min-w-[4rem]"
                        title="Verificar"
                      >
                        <div className="h-10 w-10 rounded-full bg-dm-bg-secondary flex items-center justify-center group-hover:bg-primary/10">
                          <ShieldCheckIcon className={`w-5 h-5 ${isCheckingThis ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className="text-xs font-semibold text-center leading-tight">Verificar</span>
                      </button>

                      {connectionState !== 'open' && (
                        <button
                          onClick={() => {
                            setSelectedBranch({ ...branch, connectionState });
                            handleGetQR(instanceName);
                          }}
                          disabled={getQRCodeMutation.isPending}
                          className="flex flex-col items-center gap-1 text-primary hover:text-primary/80 transition-colors group disabled:opacity-60"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                            <QrCodeIcon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold">Conectar</span>
                        </button>
                      )}

                      {connectionState === 'open' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBranch({ ...branch, connectionState });
                              setShowChangePhoneModal(true);
                            }}
                            className="flex flex-col items-center gap-1 text-dm-text-secondary hover:text-primary transition-colors group min-w-[4rem]"
                          >
                            <div className="h-10 w-10 rounded-full bg-dm-bg-secondary flex items-center justify-center group-hover:bg-primary/10">
                              <ArrowsRightLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Cambiar</span>
                          </button>

                          <button
                            onClick={() => handleLogout(instanceName)}
                            disabled={logoutMutation.isPending}
                            className="flex flex-col items-center gap-1 text-dm-text-secondary hover:text-orange-500 transition-colors group disabled:opacity-60 min-w-[4rem]"
                          >
                            <div className="h-10 w-10 rounded-full bg-dm-bg-secondary flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40">
                              <LinkSlashIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Desconectar</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleRestart(instanceName)}
                        disabled={restartMutation.isPending}
                        className="flex flex-col items-center gap-1 text-dm-text-secondary hover:text-primary transition-colors group disabled:opacity-60 min-w-[4rem]"
                        title="Reiniciar"
                      >
                        <div className="h-10 w-10 rounded-full bg-dm-bg-secondary flex items-center justify-center group-hover:bg-primary/10">
                          <ArrowPathIcon className={`w-5 h-5 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                        </div>
                        <span className="text-xs font-semibold text-center leading-tight">Reiniciar</span>
                      </button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedBranch(branch);
                        setNewInstanceName(whatsappConfigService.generateInstanceName(branch.name));
                        setShowCreateModal(true);
                      }}
                      className="whitespace-nowrap"
                      size="sm"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Crear Instancia
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {branchOffices.length === 0 && (
          <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary py-14 text-center">
            <BuildingOffice2Icon className="w-12 h-12 text-dm-text-muted mx-auto mb-4" />
            <p className="text-dm-text-muted">No hay sucursales configuradas</p>
          </div>
        )}
      </div>

      {/* Create Instance Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewInstanceName('');
        }}
        title="Crear Nueva Instancia de WhatsApp"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-dm-text-secondary mb-4">
              Crear una instancia de WhatsApp para la sucursal: <strong>{selectedBranch?.name}</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">
              Nombre de la Instancia
            </label>
            <input
              type="text"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
              className="w-full px-3 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
              placeholder="ej: [EMPRESA]_IQUITOS"
            />
            <p className="text-xs text-dm-text-muted mt-1">
              Solo letras mayúsculas, números y guiones bajos
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewInstanceName('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              disabled={createInstanceMutation.isPending || !newInstanceName.trim()}
            >
              {createInstanceMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Crear Instancia
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrCode(null);
          eventPolling.reset();
        }}
        title="Escanea el Código QR"
        maxWidth="lg"
      >
        <div className="text-center space-y-4">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Instrucciones:</strong> Abre WhatsApp en tu teléfono → Configuración → Dispositivos vinculados → Vincular un dispositivo
            </p>
          </div>
          
          {qrCode ? (
            <div className="flex justify-center p-4 bg-dm-bg-primary rounded-lg border-2 border-dm-border-primary">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-72 h-72"
              />
            </div>
          ) : getQRCodeMutation.isPending ? (
            <div className="flex justify-center items-center h-72">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex justify-center items-center h-72 text-dm-text-muted">
              <p>Error al cargar el código QR</p>
            </div>
          )}

          {eventPolling.isPolling && (
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Esperando que escanees el código QR...</span>
            </div>
          )}

          <div className="flex justify-center space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedBranch?.whatsapp_instance_name) {
                  handleGetQR(selectedBranch.whatsapp_instance_name);
                }
              }}
              disabled={getQRCodeMutation.isPending}
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Regenerar QR
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowQRModal(false);
                setQrCode(null);
                eventPolling.reset();
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Phone Modal */}
      <Modal
        isOpen={showChangePhoneModal}
        onClose={() => !isChangingPhone && setShowChangePhoneModal(false)}
        title="Cambiar de Teléfono"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Esta acción desvinculará el teléfono actual y generará un nuevo código QR para vincular otro dispositivo.
            </p>
          </div>
          
          <p className="text-sm text-dm-text-secondary">
            ¿Deseas cambiar el teléfono vinculado a la instancia{' '}
            <strong className="font-mono text-blue-600 dark:text-blue-400">{selectedBranch?.whatsapp_instance_name}</strong>{' '}
            de la sucursal <strong>{selectedBranch?.name}</strong>?
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              <strong>Nota:</strong> El teléfono actual perderá acceso inmediatamente. Tendrás que escanear el nuevo QR con el dispositivo que deseas vincular.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowChangePhoneModal(false)}
              disabled={isChangingPhone}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePhone}
              disabled={isChangingPhone}
            >
              {isChangingPhone ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                  Cambiar Teléfono
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default WhatsAppConfigPage;
