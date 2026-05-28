import React from 'react';

interface SeriesData {
  id: number;
  series_code: string;
  current_number: number;
  branch_office_id: number;
}

interface QuotationSeriesSelectorProps {
  selectedSeries: string;
  quotationSeries: SeriesData[];
  seriesLoading: boolean;
  seriesError: string | undefined | null;
  selectedSeriesData: SeriesData | null;
  onSeriesChange: (series: string) => void;
}

export const QuotationSeriesSelector: React.FC<QuotationSeriesSelectorProps> = ({
  selectedSeries,
  quotationSeries,
  seriesLoading,
  seriesError,
  onSeriesChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-dm-text-secondary mb-2">Serie *</label>
      <select
        value={selectedSeries}
        onChange={(e) => onSeriesChange(e.target.value)}
        className="w-full border border-dm-border-primary rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={seriesLoading || quotationSeries.length === 0}
      >
        <option value="">
          {seriesLoading ? 'Cargando...' : 'Seleccionar...'}
        </option>
        {quotationSeries.map(series => (
          <option key={series.id} value={series.series_code}>
            {series.series_code}
          </option>
        ))}
      </select>
      
      {seriesError && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{seriesError}</p>
      )}
    </div>
  );
};
