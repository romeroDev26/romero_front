// src/components/common/ClientSearchAutocomplete.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Search, X, User, Phone } from 'lucide-react';
import { useClientSearch } from '../../hooks/useClientSearch';
import { Client } from '../../types';
import { Spinner } from './Spinner';
import { DOCUMENT_TYPES } from '../../features/fluvial/types/sunat.types';

interface ClientSearchAutocompleteProps {
  onSelect: (client: Client) => void;
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
  label?: string;
}

const FONT = {
  inter: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const ClientSearchAutocomplete: React.FC<ClientSearchAutocompleteProps> = ({
  onSelect,
  placeholder = 'Buscar cliente por nombre...',
  disabled = false,
  inputClassName = '',
  label = 'Buscar cliente',
}) => {
  const { searchTerm, setSearchTerm, results, isLoading, isEnabled } = useClientSearch({
    limit: 10,
    minChars: 2,
    debounceMs: 400,
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar dropdown con Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.trim().length >= 2);
  };

  const handleSelect = (client: Client) => {
    onSelect(client);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  const docTypeName = (code?: string) => {
    if (!code) return '';
    return DOCUMENT_TYPES.find((d) => d.code === code)?.name || code;
  };

  const showResults = isOpen && isEnabled;
  const showNoResults = showResults && !isLoading && results.length === 0;
  const hasResults = showResults && results.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted">
          {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.trim().length >= 2 && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={
            `w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 pl-9 pr-9 text-sm text-dm-text-primary placeholder:text-dm-text-muted ` +
            `focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${inputClassName}`
          }
          style={{ fontFamily: FONT.inter }}
        />
        {searchTerm && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-dm-text-muted hover:text-dm-text-primary"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {hasResults && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-dm-border-primary bg-dm-bg-primary shadow-lg"
          style={{ fontFamily: FONT.inter }}
        >
          <div className="max-h-60 overflow-y-auto">
            {results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full border-b border-dm-border-secondary p-3 text-left transition hover:bg-dm-bg-hover last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-dm-text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dm-text-primary">{client.name}</p>
                    <p className="text-xs text-dm-text-muted">
                      {docTypeName(client.doc_type)}: {client.doc_number}
                    </p>
                    {client.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-dm-text-muted">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sin resultados */}
      {showNoResults && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3 shadow-lg"
          style={{ fontFamily: FONT.inter }}
        >
          <p className="text-sm text-dm-text-muted">No se encontraron clientes.</p>
        </div>
      )}
    </div>
  );
};

export default ClientSearchAutocomplete;
