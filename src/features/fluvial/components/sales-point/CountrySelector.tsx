import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCountries } from '../../hooks/useCountries';
import { Country } from '../../../../services/countries.service';

interface CountrySelectorProps {
  value: string; // Código del país seleccionado (cca2)
  onChange: (countryCode: string, countryName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar país...",
  disabled = false,
  className = ""
}) => {
  const { countries, loading, error, searchCountries, getCountryByCode } = useCountries();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtramos los países basándonos en el término de búsqueda
  const filteredCountries = useMemo(() => {
    return searchCountries(searchTerm);
  }, [searchCountries, searchTerm]);

  // Encontramos el país seleccionado
  const selectedCountry = useMemo(() => {
    return getCountryByCode(value);
  }, [getCountryByCode, value]);

  const handleCountrySelect = (country: Country) => {
    onChange(country.cca2, country.name.common);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full p-2 border border-red-300 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Error al cargar países. Verifique su conexión.
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Campo principal del selector */}
      <div
        className={`
          w-full p-2 border rounded-md cursor-pointer flex items-center justify-between
          ${disabled ? 'bg-dm-bg-secondary cursor-not-allowed' : 'bg-dm-bg-primary hover:border-gray-400 dark:hover:border-gray-500'}
          ${loading ? 'bg-dm-bg-secondary' : ''}
          border-dm-border-primary
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-dm-text-muted">Cargando países...</span>
          ) : selectedCountry ? (
            <>
              <img 
                src={selectedCountry.flags.svg} 
                alt={`Bandera de ${selectedCountry.name.common}`}
                className="w-5 h-3 object-cover rounded"
              />
              <span className="text-dm-text-primary">{selectedCountry.name.common}</span>
              <span className="text-dm-text-muted text-sm">({selectedCountry.cca2})</span>
            </>
          ) : (
            <span className="text-dm-text-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 text-dm-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown con lista de países */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-dm-bg-primary border border-dm-border-primary rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-2 border-b border-dm-border-primary">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-dm-text-muted absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 border border-dm-border-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de países */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(country => (
                <div
                  key={country.cca3}
                  className="p-2 hover:bg-dm-bg-hover cursor-pointer flex items-center gap-2 border-b border-dm-border-secondary last:border-b-0"
                  onClick={() => handleCountrySelect(country)}
                >
                  <img 
                    src={country.flags.svg} 
                    alt={`Bandera de ${country.name.common}`}
                    className="w-5 h-3 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-dm-text-primary">
                      {country.name.common}
                    </div>
                    <div className="text-xs text-dm-text-muted">
                      {country.cca2} • {country.cca3}
                      {country.idd.root && (
                        <span> • Tel: {country.idd.root}{country.idd.suffixes?.[0] || ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-dm-text-muted text-sm">
                No se encontraron países
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
