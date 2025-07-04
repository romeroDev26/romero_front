// src/services/clients.service.ts
import api from '../config/api';
import { Client, CreateClientData, UpdateClientData } from '../types';

export const clientsService = {
  // Obtener todos los clientes
  getAll: async (): Promise<Client[]> => {
    try {
      const response = await api.get('/clients/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  },

  // Obtener cliente por ID
  getById: async (id: number): Promise<Client> => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo cliente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca un cliente por su número de documento.
   * La API devuelve 404 si no lo encuentra.
   * Endpoint actualizado para usar un path parameter.
   */
  findByDocument: async (docNumber: string): Promise<Client | null> => {
    if (!docNumber) return null;

    try {
      // La URL ahora incluye el número de documento directamente en la ruta
      const response = await api.get<Client>(`/clients/by-document/${docNumber}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Cliente no encontrado, es un caso de uso válido
      }
      console.error(`Error buscando cliente por documento ${docNumber}:`, error);
      throw error;
    }
  },

  // Crear nuevo cliente
  create: async (clientData: CreateClientData): Promise<Client> => {
    try {
      const response = await api.post('/clients/', clientData);
      return response.data;
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  },

  // Actualizar cliente existente
  update: async (id: number, clientData: UpdateClientData): Promise<Client> => {
    try {
      const response = await api.patch(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando cliente ${id}:`, error);
      throw error;
    }
  },

  // Eliminar (desactivar) cliente
  delete: async (id: number): Promise<Client> => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando cliente ${id}:`, error);
      throw error;
    }
  }
};
