// src/features/settings/pages/WhatsAppConfigPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  ChatBubbleLeftRightIcon,
  BuildingOffice2Icon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
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
      console.log('Instancia desconectada');
    },
    onQRCodeUpdated: (newQR: string) => {
      // Actualizar el QR cuando el webhook notifique un nuevo código
      setQrCode(newQR);
      toast.info('El código QR se ha actualizado');
    },
    onError: (error: Error) => {
      console.error('Error en polling de eventos:', error);
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
      console.error('Error creando instancia:', error);
    }
  };

  const handleGetQR = async (instanceName: string) => {
    try {
      const result = await getQRCodeMutation.mutateAsync(instanceName);
      setQrCode(result.qr_code);
      setShowQRModal(true);
      // El polling se inicia automáticamente al abrir el modal (via useEffect)
    } catch (error) {
      console.error('Error obteniendo QR:', error);
    }
  };

  const handleLogout = async (instanceName: string) => {
    try {
      await logoutMutation.mutateAsync(instanceName);
      checkConnectionStates();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const handleRestart = async (instanceName: string) => {
    try {
      await restartMutation.mutateAsync(instanceName);
      checkConnectionStates();
    } catch (error) {
      console.error('Error reiniciando instancia:', error);
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
      console.error('Error cambiando teléfono:', error);
      toast.error('Error al cambiar de teléfono. Intenta nuevamente.');
    } finally {
      setIsChangingPhone(false);
    }
  };

  const getStatusBadge = (state: ConnectionState | undefined) => {
    switch (state) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <SignalIcon className="w-3 h-3 mr-1" />
            Conectado
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
            Conectando
          </span>
        );
      case 'close':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <SignalSlashIcon className="w-3 h-3 mr-1" />
            Desconectado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Sin verificar
          </span>
        );
    }
  };

  // Estadísticas
  const branchesWithInstance = branchOffices.filter(b => b.whatsapp_instance_name);
  const connectedCount = Object.values(connectionStates).filter(s => s === 'open').length;

  if (loadingBranches) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración de WhatsApp</h1>
            <p className="text-gray-600 mt-1">Gestiona las instancias de WhatsApp para cada sucursal</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sucursales</p>
              <p className="text-2xl font-bold text-gray-900">{branchOffices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PhoneIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Con WhatsApp</p>
              <p className="text-2xl font-bold text-gray-900">{branchesWithInstance.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conectadas</p>
              <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Offices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sucursales</h2>
            <Button
              variant="outline"
              onClick={() => {
                refetchBranches();
                checkConnectionStates();
              }}
              disabled={isCheckingAll}
              className="flex items-center space-x-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isCheckingAll ? 'animate-spin' : ''}`} />
              <span>{isCheckingAll ? 'Verificando...' : 'Actualizar'}</span>
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {branchOffices.map((branch) => {
            const instanceName = branch.whatsapp_instance_name;
            const connectionState = instanceName ? connectionStates[instanceName] : undefined;
            const isCheckingThis = instanceName ? checkingInstances.has(instanceName) : false;
            
            return (
              <div
                key={branch.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${instanceName ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <BuildingOffice2Icon className={`w-6 h-6 ${instanceName ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{branch.name}</h3>
                      <p className="text-sm text-gray-500">
                        {branch.port_name || branch.address_line || 'Sin dirección'}
                      </p>
                      {instanceName && (
                        <p className="text-xs text-blue-600 font-mono mt-1">
                         {instanceName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {instanceName ? (
                      <>
                        {/* Badge de estado con indicador de verificación */}
                        {isCheckingThis ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                            Verificando...
                          </span>
                        ) : (
                          getStatusBadge(connectionState)
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {/* Botón verificar estado */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkSingleInstanceStatus(instanceName)}
                            disabled={isCheckingThis}
                            title="Verificar estado de conexión"
                          >
                            <SignalIcon className={`w-4 h-4 ${isCheckingThis ? 'animate-pulse' : ''}`} />
                          </Button>
                          
                          {connectionState !== 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch({ ...branch, connectionState });
                                handleGetQR(instanceName);
                              }}
                              disabled={getQRCodeMutation.isPending}
                            >
                              <QrCodeIcon className="w-4 h-4 mr-1" />
                              Conectar
                            </Button>
                          )}
                          
                          {connectionState === 'open' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBranch({ ...branch, connectionState });
                                  setShowChangePhoneModal(true);
                                }}
                                title="Cambiar de teléfono"
                              >
                                <DevicePhoneMobileIcon className="w-4 h-4 mr-1" />
                                Cambiar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLogout(instanceName)}
                                disabled={logoutMutation.isPending}
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Desconectar
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestart(instanceName)}
                            disabled={restartMutation.isPending}
                            title="Reiniciar instancia"
                          >
                            <ArrowPathIcon className={`w-4 h-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedBranch(branch);
                          setNewInstanceName(
                            whatsappConfigService.generateInstanceName(branch.name)
                          );
                          setShowCreateModal(true);
                        }}
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
            <div className="px-6 py-12 text-center">
              <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay sucursales configuradas</p>
            </div>
          )}
        </div>
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
            <p className="text-sm text-gray-600 mb-4">
              Crear una instancia de WhatsApp para la sucursal: <strong>{selectedBranch?.name}</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Instancia
            </label>
            <input
              type="text"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
              placeholder="ej: ROMERO_IQUITOS"
            />
            <p className="text-xs text-gray-500 mt-1">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>Instrucciones:</strong> Abre WhatsApp en tu teléfono → Configuración → Dispositivos vinculados → Vincular un dispositivo
            </p>
          </div>
          
          {qrCode ? (
            <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
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
            <div className="flex justify-center items-center h-72 text-gray-500">
              <p>Error al cargar el código QR</p>
            </div>
          )}

          {eventPolling.isPolling && (
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
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
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Esta acción desvinculará el teléfono actual y generará un nuevo código QR para vincular otro dispositivo.
            </p>
          </div>
          
          <p className="text-sm text-gray-600">
            ¿Deseas cambiar el teléfono vinculado a la instancia{' '}
            <strong className="font-mono text-blue-600">{selectedBranch?.whatsapp_instance_name}</strong>{' '}
            de la sucursal <strong>{selectedBranch?.name}</strong>?
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
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
