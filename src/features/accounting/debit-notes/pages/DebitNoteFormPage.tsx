// src/features/accounting/debit-notes/pages/DebitNoteFormPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useForm,
  Controller,
  SubmitHandler,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";

import { Button } from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import { useCreateDebitNote } from "../hooks/useDebitNotes";
import { DebitNoteCreateData } from "../../types";
import { useServicesData } from "../../../fluvial/hooks/useProductsServicesData";
import { useAccountingDocumentSeriesForBranch } from "../../../../hooks/useAccountingDocumentSeries";
import { authService } from "../../../../services/auth.service";
import { User } from "../../../../types";

// Catálogo de motivos de nota de débito (SUNAT catálogo 10)
const DEBIT_NOTE_REASONS = [
  { code: "01", description: "Intereses por mora" },
  { code: "02", description: "Aumento en el valor" },
  { code: "03", description: "Penalidades/otros conceptos" },
  { code: "11", description: "Ajustes de operaciones de exportación" },
  { code: "12", description: "Ajustes afectos al IVAP" },
];

// Valores por defecto para nuevos items
const DEFAULT_ITEM = {
  product_id: 0,
  quantity: 1,
  unit_code: "ZZ",
  unit_price: 0,
  price_with_tax: 0,
  price_type_code: "01",
  tax_category_code: "20", // Por defecto exonerado (IGV desactivado)
};

const debitNoteSchema = z.object({
  client_id: z.number().min(1, "ID de cliente requerido"),
  series: z.string().min(1, "Serie requerida"),
  affected_document_type_code: z
    .string()
    .min(1, "Tipo de documento afectado requerido"),
  affected_document_series_number: z
    .string()
    .min(1, "Número de serie del documento afectado requerido"),
  debit_note_type_code: z.string().min(1, "Tipo de nota de débito requerido"),
  reason: z.string().min(5, "Razón debe tener al menos 5 caracteres"),
  items: z
    .array(
      z.object({
        product_id: z.number(),
        quantity: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
        unit_code: z.string().min(1, "Código de unidad requerido"),
        unit_price: z
          .number()
          .min(0, "Precio unitario debe ser mayor o igual a 0"),
        price_with_tax: z
          .number()
          .min(0, "Precio con impuesto debe ser mayor o igual a 0"),
        price_type_code: z
          .string()
          .min(1, "Código de tipo de precio requerido"),
        tax_category_code: z
          .string()
          .min(1, "Código de categoría de impuesto requerido"),
      })
    )
    .min(1, "Debe incluir al menos un ítem"),
});

type DebitNoteFormData = z.infer<typeof debitNoteSchema>;

export const DebitNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { affectedInvoice: initialAffectedInvoice } =
    (location.state as { affectedInvoice?: any }) || {};

  // Intentar obtener desde sessionStorage si no viene en el state
  const getAffectedInvoice = () => {
    if (
      initialAffectedInvoice &&
      (initialAffectedInvoice.client_id || initialAffectedInvoice.client?.id)
    ) {
      return initialAffectedInvoice;
    }

    // Intentar desde sessionStorage
    const stored = sessionStorage.getItem("debitNoteAffectedInvoice");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Validar que los datos sean válidos
        if (parsed.client_id && parsed.client_id !== 0) {
          return parsed;
        } else {
          sessionStorage.removeItem("debitNoteAffectedInvoice"); // Limpiar datos inválidos
        }
      } catch (error) {
        sessionStorage.removeItem("debitNoteAffectedInvoice"); // Limpiar datos corruptos
      }
    }

    return initialAffectedInvoice;
  };

  const finalAffectedInvoice = getAffectedInvoice();

  // Función para obtener client_id válido de múltiples fuentes
  const getValidClientId = (affectedInvoice: any) => {
    // Prioridad: client_id directo > client.id > 0 como fallback
    if (affectedInvoice?.client_id && affectedInvoice.client_id !== 0) {
      return affectedInvoice.client_id;
    }
    if (affectedInvoice?.client?.id && affectedInvoice.client.id !== 0) {
      return affectedInvoice.client.id;
    }
    console.warn(
      "No valid client_id found in affected invoice:",
      affectedInvoice
    );
    return 0;
  };

  // Función para limpiar datos de sessionStorage si son inválidos
  const clearInvalidSessionData = () => {
    try {
      const stored = sessionStorage.getItem("debitNoteAffectedInvoice");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.client_id || parsed.client_id === 0) {
          sessionStorage.removeItem("debitNoteAffectedInvoice");
        }
      }
    } catch (error) {
      sessionStorage.removeItem("debitNoteAffectedInvoice");
    }
  };

  // Limpiar datos inválidos al montar el componente
  useEffect(() => {
    clearInvalidSessionData();
  }, []);

  // Obtener usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const companyId = currentUser?.company_id || 1;
  const { mutate: createDebitNote, isPending } = useCreateDebitNote();

  // Series de documentos contables para notas de débito
  const { availableDebitNoteSeries, isLoading: isLoadingSeries } =
    useAccountingDocumentSeriesForBranch(
      currentUser?.default_branch_office_id || null,
      companyId
    );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preparedPayload, setPreparedPayload] =
    useState<DebitNoteCreateData | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<DebitNoteFormData>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: {
      client_id: getValidClientId(finalAffectedInvoice),
      series: "",
      affected_document_type_code:
        finalAffectedInvoice?.document_type_code || "01",
      affected_document_series_number: finalAffectedInvoice
        ? `${finalAffectedInvoice.series}-${String(
            finalAffectedInvoice.number
          ).padStart(8, "0")}`
        : "",
      debit_note_type_code: "02",
      reason: finalAffectedInvoice
        ? `Cargo adicional sobre ${finalAffectedInvoice.series}-${String(
            finalAffectedInvoice.number
          ).padStart(8, "0")}`
        : "",
      items: [], // Iniciar sin items por defecto
    },
  });

  // Cargar serie predeterminada de notas de débito
  useEffect(() => {
    if (availableDebitNoteSeries.length > 0) {
      const savedSeries = localStorage.getItem("lastUsedDebitNoteSeries");
      const seriesExists = availableDebitNoteSeries.find(
        (s) => s.series_code === savedSeries
      );
      if (seriesExists && savedSeries) {
        setValue("series", savedSeries, { shouldValidate: false });
      } else {
        setValue("series", availableDebitNoteSeries[0].series_code, {
          shouldValidate: false,
        });
      }
    }
  }, [availableDebitNoteSeries, setValue]);

  // Debug: verificar el state recibido y actualizar client_id si es necesario
  useEffect(() => {
    if (finalAffectedInvoice) {
      // Actualizar client_id en el formulario si tenemos una factura válida
      const validClientId = getValidClientId(finalAffectedInvoice);
      setValue("client_id", validClientId, { shouldValidate: false });

      // También actualizar otros campos si es necesario
      if (finalAffectedInvoice.document_type_code) {
        setValue(
          "affected_document_type_code",
          finalAffectedInvoice.document_type_code,
          { shouldValidate: false }
        );
      }
      if (finalAffectedInvoice.series && finalAffectedInvoice.number) {
        const seriesNumber = `${finalAffectedInvoice.series}-${String(
          finalAffectedInvoice.number
        ).padStart(8, "0")}`;
        setValue("affected_document_series_number", seriesNumber, {
          shouldValidate: false,
        });
        setValue("reason", `Cargo adicional sobre ${seriesNumber}`, {
          shouldValidate: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar el componente

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = (useWatch({ control, name: "items" }) as any[]) || [];

  const { data: availableServices = [], isLoading: isLoadingServices } =
    useServicesData({ is_active: true });

  // Crear opciones para el select de servicios con useMemo para evitar recalcular en cada render
  const serviceOptions = useMemo(() => {
    return availableServices.map((service) => ({
      value: service.id,
      label: service.name,
      service: service,
    }));
  }, [availableServices]);

  const originalAmount = finalAffectedInvoice
    ? parseFloat(String(finalAffectedInvoice.total_payable || 0))
    : 0;

  // Calcular monto base de los cargos adicionales con useMemo para evitar re-renders innecesarios
  const baseAmount = useMemo(() => {
    return watchedItems.reduce((acc, it) => {
      const unitPrice = parseFloat(String(it?.unit_price || 0)) || 0;
      const quantity = parseFloat(String(it?.quantity || 1)) || 1;
      return acc + unitPrice * quantity;
    }, 0);
  }, [watchedItems]);

  // Total de cargos adicionales (sin IGV - exonerado)
  const additionalTotal = baseAmount;
  const newTotal = originalAmount + additionalTotal;

  const onSubmit: SubmitHandler<DebitNoteFormData> = async (data) => {
    // Verificar si tenemos la información necesaria
    if (!finalAffectedInvoice) {
      return;
    }

    // Corregir el client_id antes de la validación
    let validClientId = data.client_id;

    // Intentar obtener un client_id válido de diferentes fuentes
    if (data.client_id === 0 || !data.client_id) {
      if (
        finalAffectedInvoice.client_id &&
        finalAffectedInvoice.client_id !== 0
      ) {
        validClientId = finalAffectedInvoice.client_id;
      } else if (
        finalAffectedInvoice.client?.id &&
        finalAffectedInvoice.client.id !== 0
      ) {
        validClientId = finalAffectedInvoice.client.id;
      } else {
        alert(
          "Error: No se pudo obtener un ID de cliente válido. Verifique que la factura seleccionada tenga un cliente asociado."
        );
        return;
      }

      // Actualizar el valor en el formulario
      setValue("client_id", validClientId);
      data.client_id = validClientId;
    }

    // Verificar si hay errores de validación después de corregir el client_id
    const isValid = await trigger();

    if (!isValid) {
      return;
    }

    // Validar que todos los campos requeridos estén presentes
    if (!data.client_id || data.client_id === 0) {
      alert(
        "Error: No se pudo obtener un ID de cliente válido. Verifique la factura seleccionada."
      );
      return;
    }

    if (!data.series) {
      alert("Error: La serie es requerida.");
      return;
    }

    if (!data.items || data.items.length === 0) {
      alert("Error: Debe agregar al menos un ítem.");
      return;
    }

    // Validar que todos los items tengan datos válidos
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.product_id || item.product_id <= 0) {
        alert(`Error: El ítem ${i + 1} debe tener un servicio seleccionado.`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        alert(`Error: El ítem ${i + 1} debe tener una cantidad mayor a 0.`);
        return;
      }
      if (!item.unit_price || item.unit_price < 0) {
        alert(`Error: El ítem ${i + 1} debe tener un precio unitario válido.`);
        return;
      }
      if (!item.price_with_tax || item.price_with_tax < 0) {
        alert(
          `Error: El ítem ${i + 1} debe tener un precio con impuesto válido.`
        );
        return;
      }
    }

    // Obtener fecha y hora actuales
    const now = new Date();
    const issue_date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const issue_time = now.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS

    const payload: DebitNoteCreateData = {
      company_id: companyId,
      client_id: data.client_id,
      document_type_code: "08", // Siempre 08 para notas de débito
      series: data.series,
      issue_date,
      issue_time,
      currency_code: "PEN",
      affected_document_type_code: data.affected_document_type_code,
      affected_document_series_number: data.affected_document_series_number,
      debit_note_type_code: data.debit_note_type_code,
      reason: data.reason,
      items: data.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_code: i.unit_code,
        unit_price: i.unit_price,
        price_with_tax: i.price_with_tax,
        price_type_code: i.price_type_code,
        tax_category_code: "20", // Siempre exonerado
      })),
    };

    // Guardar la serie usada para la próxima vez
    localStorage.setItem("lastUsedDebitNoteSeries", data.series);

    setPreparedPayload(payload);
    setShowConfirmModal(true);
  };

  const confirmCreate = () => {
    if (!preparedPayload) {
      return;
    }

    createDebitNote(preparedPayload, {
      onSuccess: (_data) => {
        setShowConfirmModal(false);
        navigate("/accounting/debit-notes");
      },
      onError: (_error) => {
        setShowConfirmModal(false);
      },
    });
  };
  // Valores formateados para mostrar en el modal (evita expresiones complejas dentro del JSX)
  const formattedAdditionalTotal = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(additionalTotal);
  const affectedSeriesNumber =
    preparedPayload?.affected_document_series_number ?? "";

  return (
    <div className="min-h-screen bg-neutral">
      {/* Enhanced Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/accounting/debit-notes")}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Nueva Nota de Débito
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Agregar cargos adicionales a un comprobante existente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!finalAffectedInvoice ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error: No se encontró el comprobante
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    No se pudo encontrar la información del comprobante para
                    generar la nota de débito. Por favor, regrese a la lista de
                    comprobantes y seleccione uno válido.
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/accounting/debit-notes/new")}
                  >
                    Seleccionar Comprobante
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : !getValidClientId(finalAffectedInvoice) ||
          getValidClientId(finalAffectedInvoice) === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error: Cliente no válido
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    El comprobante seleccionado no tiene un cliente válido
                    asociado. No se puede generar una nota de débito sin esta
                    información.
                  </p>
                  <p className="mt-1">
                    Comprobante: {finalAffectedInvoice.series}-
                    {String(finalAffectedInvoice.number).padStart(8, "0")}
                  </p>
                  <p>
                    Cliente detectado:{" "}
                    {finalAffectedInvoice.client_name || "No disponible"}
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/accounting/debit-notes/new")}
                  >
                    Seleccionar Otro Comprobante
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Mostrar errores de validación */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error en el formulario
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([field, error]) => {
                          if (field === 'items' && error?.message) {
                            // Error general de items (ej: array vacío)
                            return (
                              <li key={field}>
                                <strong>Items:</strong> {error.message}
                              </li>
                            );
                          } else if (field !== 'items') {
                            // Errores de campos normales
                            return (
                              <li key={field}>
                                <strong>
                                  {field === 'client_id' && 'Cliente'}
                                  {field === 'series' && 'Serie'}
                                  {field === 'affected_document_type_code' && 'Tipo de documento afectado'}
                                  {field === 'affected_document_series_number' && 'Número de serie del documento afectado'}
                                  {field === 'debit_note_type_code' && 'Tipo de nota de débito'}
                                  {field === 'reason' && 'Razón'}
                                  {field}:
                                </strong>{" "}
                                {error?.message || "Error de validación"}
                              </li>
                            );
                          }
                          return null;
                        }).filter(Boolean)}

                        {/* Mostrar errores específicos de cada item */}
                        {errors.items && Array.isArray(errors.items) && errors.items.map((itemError, index) => {
                          if (itemError) {
                            const itemFieldErrors = [];
                            if (itemError.quantity?.message) itemFieldErrors.push('Cantidad debe ser mayor a 0');
                            if (itemError.unit_code?.message) itemFieldErrors.push('Código de unidad requerido');
                            if (itemError.unit_price?.message) itemFieldErrors.push('Precio unitario debe ser mayor o igual a 0');
                            if (itemError.price_with_tax?.message) itemFieldErrors.push('Precio final debe ser mayor o igual a 0');
                            if (itemError.price_type_code?.message) itemFieldErrors.push('Código de tipo de precio requerido');
                            if (itemError.tax_category_code?.message) itemFieldErrors.push('Código de categoría de impuesto requerido');

                            if (itemFieldErrors.length > 0) {
                              return (
                                <li key={`item-${index}`}>
                                  <strong>Cargo #{index + 1}:</strong>
                                  <ul className="list-disc list-inside ml-4 mt-1">
                                    {itemFieldErrors.map((errorMsg, errorIndex) => (
                                      <li key={errorIndex}>{errorMsg}</li>
                                    ))}
                                  </ul>
                                </li>
                              );
                            }
                          }
                          return null;
                        }).filter(Boolean)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Form Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Affected Invoice Card */}
                {finalAffectedInvoice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Comprobante Afectado
                      </h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Seleccionado
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Número de Documento
                        </label>
                        <p className="text-lg font-bold text-gray-900">
                          {finalAffectedInvoice.series}-
                          {String(finalAffectedInvoice.number).padStart(8, "0")}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Cliente
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {finalAffectedInvoice.client_name}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Fecha de Emisión
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(
                            finalAffectedInvoice.issue_date
                          ).toLocaleDateString("es-PE")}
                        </p>
                      </div>

                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Monto Original
                        </label>
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat("es-PE", {
                            style: "currency",
                            currency: "PEN",
                          }).format(
                            parseFloat(
                              String(finalAffectedInvoice.total_payable || 0)
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Form Section - Charge Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Información del Cargo
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Serie ND
                      </label>
                      <Controller
                        name="series"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                            disabled={
                              isLoadingSeries ||
                              availableDebitNoteSeries.length === 0
                            }
                          >
                            {availableDebitNoteSeries.length === 0 ? (
                              <option value="">
                                No hay series disponibles
                              </option>
                            ) : (
                              availableDebitNoteSeries.map((series) => (
                                <option
                                  key={series.id}
                                  value={series.series_code}
                                >
                                  {series.series_code}
                                  {series.branch_office?.name
                                    ? ` - ${series.branch_office.name}`
                                    : ""}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                      />
                      {errors.series && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.series.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo
                      </label>
                      <Controller
                        name="debit_note_type_code"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                          >
                            {DEBIT_NOTE_REASONS.map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.description}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción / Sustento
                      </label>
                      <Controller
                        name="reason"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors resize-none"
                            placeholder="Describa el motivo del cargo adicional..."
                          />
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">
                          Precio sin IGV (región amazónica exonerada)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Items Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cargos Adicionales a Incluir
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        append({
                          ...DEFAULT_ITEM,
                          tax_category_code: "20",
                        });
                      }}
                      className="flex items-center space-x-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Agregar Cargo</span>
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {fields.map((f, idx) => (
                      <div
                        key={f.id}
                        className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white text-xs font-medium rounded-full">
                              {idx + 1}
                            </span>
                            <h3 className="font-medium text-gray-900">
                              Cargo #{idx + 1}
                            </h3>
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(idx)}
                              className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="md:col-span-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Servicio
                            </label>
                            <Controller
                              name={`items.${idx}.product_id`}
                              control={control}
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  options={serviceOptions}
                                  isLoading={isLoadingServices}
                                  placeholder="Seleccione un servicio..."
                                  noOptionsMessage={() =>
                                    "No se encontraron servicios"
                                  }
                                  value={
                                    serviceOptions.find(
                                      (opt) => opt.value === field.value
                                    ) || null
                                  }
                                  onChange={(option) => {
                                    field.onChange(option?.value || 0);
                                    // Auto-poblar otros campos cuando se selecciona un servicio
                                    if (option?.service) {
                                      const service = option.service;
                                      const unitPrice = Number(
                                        service.sale_price
                                      );
                                      // Usar setValue con shouldValidate: false para evitar re-renders innecesarios
                                      setValue(
                                        `items.${idx}.unit_code`,
                                        service.unit_code,
                                        { shouldValidate: false }
                                      );
                                      setValue(
                                        `items.${idx}.unit_price`,
                                        unitPrice,
                                        { shouldValidate: false }
                                      );
                                      setValue(
                                        `items.${idx}.price_with_tax`,
                                        unitPrice,
                                        { shouldValidate: false }
                                      );
                                      setValue(
                                        `items.${idx}.price_type_code`,
                                        "01",
                                        { shouldValidate: false }
                                      );
                                      setValue(
                                        `items.${idx}.tax_category_code`,
                                        "20",
                                        { shouldValidate: false }
                                      ); // Siempre exonerado
                                    }
                                  }}
                                  className="react-select-container"
                                  classNamePrefix="react-select"
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad
                            </label>
                            <Controller
                              name={`items.${idx}.quantity`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                                  placeholder="1.00"
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Código Unidad
                            </label>
                            <Controller
                              name={`items.${idx}.unit_code`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                                  placeholder="ZZ"
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Precio Unitario
                            </label>
                            <Controller
                              name={`items.${idx}.unit_price`}
                              control={control}
                              render={({ field }) => (
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500 text-sm">
                                    S/
                                  </span>
                                  <input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                                    placeholder="0.00"
                                    onChange={(e) => {
                                      const unitPrice =
                                        parseFloat(e.target.value) || 0;
                                      field.onChange(unitPrice);
                                      // Actualizar automáticamente el precio final (sin IGV)
                                      setValue(
                                        `items.${idx}.price_with_tax`,
                                        unitPrice,
                                        { shouldValidate: false }
                                      );
                                    }}
                                  />
                                </div>
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Precio Final
                            </label>
                            <Controller
                              name={`items.${idx}.price_with_tax`}
                              control={control}
                              render={({ field }) => (
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500 text-sm">
                                    S/
                                  </span>
                                  <input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors"
                                    placeholder="0.00"
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value) || 0);
                                    }}
                                  />
                                </div>
                              )}
                            />
                          </div>

                          {/* Campos ocultos - se manejan automáticamente */}
                          <Controller
                            name={`items.${idx}.price_type_code`}
                            control={control}
                            render={({ field }) => (
                              <input {...field} type="hidden" />
                            )}
                          />

                          <Controller
                            name={`items.${idx}.tax_category_code`}
                            control={control}
                            render={({ field }) => (
                              <input {...field} type="hidden" />
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Summary Panel and Information */}
              <div className="space-y-6">
                {/* Summary Panel - Sticky on Desktop */}
                <div className="lg:sticky lg:top-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
                      Resumen de Totales
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Monto Original
                        </span>
                        <span className="text-lg font-medium text-gray-900">
                          {new Intl.NumberFormat("es-PE", {
                            style: "currency",
                            currency: "PEN",
                          }).format(originalAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Cargos Adicionales (Base)
                        </span>
                        <span className="text-lg font-medium text-gray-900">
                          {new Intl.NumberFormat("es-PE", {
                            style: "currency",
                            currency: "PEN",
                          }).format(baseAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Cargos Adicionales
                        </span>
                        <span className="text-xl font-semibold text-primary">
                          {new Intl.NumberFormat("es-PE", {
                            style: "currency",
                            currency: "PEN",
                          }).format(additionalTotal)}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium text-gray-900">
                            Nuevo Monto Total
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat("es-PE", {
                              style: "currency",
                              currency: "PEN",
                            }).format(newTotal)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          Sin IGV (exonerado)
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/accounting/debit-notes")}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        isLoading={isPending}
                        className="flex-1"
                      >
                        Generar Nota de Débito
                      </Button>
                    </div>
                  </div>

                  {/* Information Panel */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Información Importante
                    </h4>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>• Las notas de débito aumentan el valor de la deuda</p>
                      <p>• Se enviarán a SUNAT automáticamente</p>
                      <p>• Los precios son sin IGV (exonerados)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && preparedPayload && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar generación de Nota de Débito"
        >
          <div className="space-y-4">
            <p>
              Se generará una Nota de Débito por{" "}
              <strong>{formattedAdditionalTotal}</strong>
              {affectedSeriesNumber
                ? ` asociada al comprobante ${affectedSeriesNumber}.`
                : "."}
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p>
                <strong>Categoría de impuesto:</strong> Exonerado (20)
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  confirmCreate();
                }}
                isLoading={isPending}
              >
                Confirmar y Enviar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
