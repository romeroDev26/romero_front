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
  ChevronRightIcon,
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
  { code: "02", description: "Aumento en el valor" },
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
      } catch {
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
    } catch {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
            <ArrowLeftIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Nueva Nota de Débito
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Agregar cargos adicionales a un comprobante existente
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/accounting/debit-notes")}
          className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>

      {!finalAffectedInvoice ? (
        <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#cf1322]/10 shrink-0">
              <TrashIcon className="h-6 w-6 text-[#cf1322]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-dm-text-primary">
                Error: No se encontró el comprobante
              </h3>
              <p className="mt-1 text-[14px] text-dm-text-secondary">
                No se pudo encontrar la información del comprobante para generar la nota de débito. Por favor, regrese a la lista de comprobantes y seleccione uno válido.
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/accounting/debit-notes/new")}
                  className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
                >
                  Seleccionar Comprobante
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : !getValidClientId(finalAffectedInvoice) ||
        getValidClientId(finalAffectedInvoice) === 0 ? (
        <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#cf1322]/10 shrink-0">
              <TrashIcon className="h-6 w-6 text-[#cf1322]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-dm-text-primary">
                Error: Cliente no válido
              </h3>
              <p className="mt-1 text-[14px] text-dm-text-secondary">
                El comprobante seleccionado no tiene un cliente válido asociado. No se puede generar una nota de débito sin esta información.
              </p>
              <p className="mt-1 text-[14px] text-dm-text-secondary">
                Comprobante: {finalAffectedInvoice.series}-{String(finalAffectedInvoice.number).padStart(8, "0")}
              </p>
              <p className="text-[14px] text-dm-text-secondary">
                Cliente detectado: {finalAffectedInvoice.client_name || "No disponible"}
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/accounting/debit-notes/new")}
                  className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
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
            <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#cf1322]/10 shrink-0">
                  <TrashIcon className="h-6 w-6 text-[#cf1322]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-medium text-dm-text-primary">
                    Error en el formulario
                  </h3>
                  <div className="mt-2 text-[14px] text-dm-text-secondary">
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([field, error]) => {
                        if (field === 'items' && error?.message) {
                          return (
                            <li key={field}>
                              <strong>Items:</strong> {error.message}
                            </li>
                          );
                        } else if (field !== 'items') {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Contenido principal del formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card del comprobante afectado */}
              {finalAffectedInvoice && (
                <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-medium text-dm-text-primary">
                      Comprobante Afectado
                    </h2>
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary text-[#1F4690]">
                      Seleccionado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">
                        Número de Documento
                      </label>
                      <p className="text-[18px] font-semibold text-dm-text-primary">
                        {finalAffectedInvoice.series}-{String(finalAffectedInvoice.number).padStart(8, "0")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">
                        Cliente
                      </label>
                      <p className="text-[14px] font-medium text-dm-text-primary">
                        {finalAffectedInvoice.client_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">
                        Fecha de Emisión
                      </label>
                      <p className="text-[14px] text-dm-text-primary">
                        {new Date(finalAffectedInvoice.issue_date).toLocaleDateString("es-PE")}
                      </p>
                    </div>

                    <div className="md:col-span-2 lg:col-span-1">
                      <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">
                        Monto Original
                      </label>
                      <p className="text-[24px] font-semibold text-[#1F4690]">
                        {new Intl.NumberFormat("es-PE", {
                          style: "currency",
                          currency: "PEN",
                        }).format(
                          parseFloat(String(finalAffectedInvoice.total_payable || 0))
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de información del cargo */}
              <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
                <h2 className="text-[18px] font-medium text-dm-text-primary mb-4 pb-3 border-b border-dm-border-secondary">
                  Información del Cargo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                      Serie ND
                    </label>
                    <Controller
                      name="series"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <select
                            {...field}
                            className="peer w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                            disabled={isLoadingSeries || availableDebitNoteSeries.length === 0}
                          >
                            {availableDebitNoteSeries.length === 0 ? (
                              <option value="">No hay series disponibles</option>
                            ) : (
                              availableDebitNoteSeries.map((series) => (
                                <option key={series.id} value={series.series_code}>
                                  {series.series_code}
                                  {series.branch_office?.name ? ` - ${series.branch_office.name}` : ""}
                                </option>
                              ))
                            )}
                          </select>
                          <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
                        </div>
                      )}
                    />
                    {errors.series && (
                      <p className="mt-1 text-[13px] text-[#cf1322]">{errors.series.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                      Motivo
                    </label>
                    <Controller
                      name="debit_note_type_code"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <select
                            {...field}
                            className="peer w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                          >
                            {DEBIT_NOTE_REASONS.map((r) => (
                              <option key={r.code} value={r.code}>{r.description}</option>
                            ))}
                          </select>
                          <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
                        </div>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                      Descripción / Sustento
                    </label>
                    <Controller
                      name="reason"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all resize-none"
                          placeholder="Describa el motivo del cargo adicional..."
                        />
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-dm-bg-secondary rounded-[12px] p-4 border border-dm-border-primary">
                      <p className="text-[14px] text-dm-text-secondary">
                        Precio sin IGV (región amazónica exonerada)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de cargos adicionales */}
              <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-dm-border-secondary">
                  <h2 className="text-[18px] font-medium text-dm-text-primary">
                    Cargos Adicionales a Incluir
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      append({ ...DEFAULT_ITEM, tax_category_code: "20" });
                    }}
                    className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar Cargo
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((f, idx) => (
                    <div
                      key={f.id}
                      className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#1F4690] text-white text-[12px] font-medium rounded-full">
                            {idx + 1}
                          </span>
                          <h3 className="font-medium text-[14px] text-dm-text-primary">
                            Cargo #{idx + 1}
                          </h3>
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                            title="Eliminar cargo"
                          >
                            <TrashIcon className="h-4 w-4 text-[#cf1322]" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="md:col-span-2 lg:col-span-2">
                          <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                            Servicio <span className="text-[#cf1322]">*</span>
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
                                noOptionsMessage={() => "No se encontraron servicios"}
                                value={serviceOptions.find((opt) => opt.value === field.value) || null}
                                onChange={(option) => {
                                  field.onChange(option?.value || 0);
                                  if (option?.service) {
                                    const service = option.service;
                                    const unitPrice = Number(service.sale_price);
                                    setValue(`items.${idx}.unit_code`, service.unit_code, { shouldValidate: false });
                                    setValue(`items.${idx}.unit_price`, unitPrice, { shouldValidate: false });
                                    setValue(`items.${idx}.price_with_tax`, unitPrice, { shouldValidate: false });
                                    setValue(`items.${idx}.price_type_code`, "01", { shouldValidate: false });
                                    setValue(`items.${idx}.tax_category_code`, "20", { shouldValidate: false });
                                  }
                                }}
                                className="react-select-container"
                                classNamePrefix="react-select"
                              />
                            )}
                          />
                          {(!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0) && (
                            <p className="mt-2 text-[13px] text-dm-text-secondary bg-dm-bg-secondary p-2.5 rounded-[12px] border border-dm-border-primary">
                              Selecciona un servicio para habilitar los campos de cantidad y precios
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                            Cantidad <span className="text-[#cf1322]">*</span>
                          </label>
                          <Controller
                            name={`items.${idx}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0}
                                className={`block w-full px-3 py-2.5 border rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none transition-all ${
                                  errors.items?.[idx]?.quantity
                                    ? 'border-[#cf1322] focus:ring-2 focus:ring-[#cf1322]/20 focus:border-[#cf1322]'
                                    : 'border-dm-border-primary focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690]'
                                } ${
                                  (!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0)
                                    ? 'bg-dm-bg-secondary cursor-not-allowed'
                                    : 'bg-dm-bg-secondary'
                                }`}
                                placeholder="1.00"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                          {errors.items?.[idx]?.quantity && (
                            <p className="mt-1 text-[13px] text-[#cf1322]">{errors.items[idx].quantity.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                            Código Unidad <span className="text-[#cf1322]">*</span>
                          </label>
                          <Controller
                            name={`items.${idx}.unit_code`}
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                disabled={!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0}
                                className={`block w-full px-3 py-2.5 border rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none transition-all ${
                                  errors.items?.[idx]?.unit_code
                                    ? 'border-[#cf1322] focus:ring-2 focus:ring-[#cf1322]/20 focus:border-[#cf1322]'
                                    : 'border-dm-border-primary focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690]'
                                } ${
                                  (!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0)
                                    ? 'bg-dm-bg-secondary cursor-not-allowed'
                                    : 'bg-dm-bg-secondary'
                                }`}
                                placeholder="ZZ"
                              />
                            )}
                          />
                          {errors.items?.[idx]?.unit_code && (
                            <p className="mt-1 text-[13px] text-[#cf1322]">{errors.items[idx].unit_code.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                            Precio Unitario <span className="text-[#cf1322]">*</span>
                          </label>
                          <Controller
                            name={`items.${idx}.unit_price`}
                            control={control}
                            render={({ field }) => (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted text-[14px]">S/</span>
                                <input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  disabled={!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0}
                                  className={`block w-full pl-8 pr-3 py-2.5 border rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none transition-all ${
                                    errors.items?.[idx]?.unit_price
                                      ? 'border-[#cf1322] focus:ring-2 focus:ring-[#cf1322]/20 focus:border-[#cf1322]'
                                      : 'border-dm-border-primary focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690]'
                                  } ${
                                    (!watchedItems[idx]?.product_id || watchedItems[idx]?.product_id === 0)
                                      ? 'bg-dm-bg-secondary cursor-not-allowed'
                                      : 'bg-dm-bg-secondary'
                                  }`}
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    const unitPrice = parseFloat(e.target.value) || 0;
                                    field.onChange(unitPrice);
                                    setValue(`items.${idx}.price_with_tax`, unitPrice, { shouldValidate: false });
                                  }}
                                />
                              </div>
                            )}
                          />
                          {errors.items?.[idx]?.unit_price && (
                            <p className="mt-1 text-[13px] text-[#cf1322]">{errors.items[idx].unit_price.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                            Precio Final <span className="text-[#cf1322]">*</span>
                          </label>
                          <Controller
                            name={`items.${idx}.price_with_tax`}
                            control={control}
                            render={({ field }) => (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted text-[14px]">S/</span>
                                <input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  className={`block w-full pl-8 pr-3 py-2.5 border rounded-[12px] text-[14px] text-dm-text-primary bg-dm-bg-secondary cursor-not-allowed focus:outline-none ${
                                    errors.items?.[idx]?.price_with_tax
                                      ? 'border-[#cf1322] focus:ring-2 focus:ring-[#cf1322]/20 focus:border-[#cf1322]'
                                      : 'border-dm-border-primary'
                                  }`}
                                  placeholder="0.00"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            )}
                          />
                          {errors.items?.[idx]?.price_with_tax && (
                            <p className="mt-1 text-[13px] text-[#cf1322]">{errors.items[idx].price_with_tax.message}</p>
                          )}
                        </div>

                        <Controller
                          name={`items.${idx}.price_type_code`}
                          control={control}
                          render={({ field }) => <input {...field} type="hidden" />}
                        />
                        <Controller
                          name={`items.${idx}.tax_category_code`}
                          control={control}
                          render={({ field }) => <input {...field} type="hidden" />}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha - Panel de resumen */}
            <div className="space-y-6">
              <div className="lg:sticky lg:top-8 space-y-6">
                <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5 space-y-4">
                  <h3 className="text-[18px] font-medium text-dm-text-primary pb-3 border-b border-dm-border-secondary">
                    Resumen de Totales
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-dm-text-secondary">Monto Original</span>
                      <span className="text-[14px] font-medium text-dm-text-primary">
                        {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(originalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-dm-text-secondary">Cargos Adicionales (Base)</span>
                      <span className="text-[14px] font-medium text-dm-text-primary">
                        {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(baseAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-dm-text-secondary">Total Cargos Adicionales</span>
                      <span className="text-[18px] font-semibold text-[#1F4690]">
                        {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(additionalTotal)}
                      </span>
                    </div>
                    <div className="border-t border-dm-border-secondary pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] font-medium text-dm-text-primary">Nuevo Monto Total</span>
                        <span className="text-[24px] font-bold text-[#1F4690]">
                          {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(newTotal)}
                        </span>
                      </div>
                      <p className="text-[12px] text-dm-text-muted mt-1 text-right">Sin IGV (exonerado)</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dm-border-secondary">
                    <button
                      type="button"
                      onClick={() => navigate("/accounting/debit-notes")}
                      className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Generando...' : 'Generar Nota de Débito'}
                    </button>
                  </div>
                </div>

                <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
                  <h4 className="text-[15px] font-medium text-dm-text-primary mb-2">
                    Información Importante
                  </h4>
                  <div className="text-[13px] text-dm-text-secondary space-y-1">
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

      {/* Modal de confirmación */}
      {showConfirmModal && preparedPayload && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar generación de Nota de Débito"
        >
          <div className="space-y-4">
            <p className="text-[14px] text-dm-text-secondary">
              Se generará una Nota de Débito por{" "}
              <strong className="text-dm-text-primary">{formattedAdditionalTotal}</strong>
              {affectedSeriesNumber
                ? ` asociada al comprobante ${affectedSeriesNumber}.`
                : "."}
            </p>
            <div className="bg-dm-bg-secondary p-3 rounded-[12px] text-[14px] text-dm-text-secondary">
              <p>
                <strong className="text-dm-text-primary">Categoría de impuesto:</strong> Exonerado (20)
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCreate}
                disabled={isPending}
                className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Enviando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
