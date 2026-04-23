import { companiesService } from '../services/companies.service';

export interface DocumentCompanyInfo {
  businessName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}

const DOCUMENT_COMPANY_ID = 1;
const CACHE_TTL_MS = 5 * 60 * 1000;

const DEFAULT_DOCUMENT_COMPANY_INFO: DocumentCompanyInfo = {
  businessName: 'N/A',
  ruc: 'N/A',
  address: 'N/A',
  phone: 'N/A',
  email: 'N/A',
  logoUrl: '',
};

let cachedValue: DocumentCompanyInfo | null = null;
let cachedAt = 0;
let pendingRequest: Promise<DocumentCompanyInfo> | null = null;

const normalizeString = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'N/A';
  }

  if (value === null || value === undefined) {
    return 'N/A';
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : 'N/A';
};

const normalizeLogo = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
};

const pickFirst = (source: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
};

const normalizePayload = (raw: unknown): Record<string, unknown> => {
  if (raw && typeof raw === 'object') {
    const asRecord = raw as Record<string, unknown>;

    if (asRecord.data && typeof asRecord.data === 'object') {
      return asRecord.data as Record<string, unknown>;
    }

    return asRecord;
  }

  return {};
};

const mapToDocumentCompanyInfo = (raw: unknown): DocumentCompanyInfo => {
  const payload = normalizePayload(raw);

  return {
    businessName: normalizeString(
      pickFirst(payload, ['business_name', 'businessName', 'name', 'trade_name', 'tradeName'])
    ),
    ruc: normalizeString(pickFirst(payload, ['ruc'])),
    address: normalizeString(pickFirst(payload, ['address', 'address_line', 'addressLine'])),
    phone: normalizeString(pickFirst(payload, ['phone', 'telephone'])),
    email: normalizeString(pickFirst(payload, ['email'])),
    logoUrl: normalizeLogo(pickFirst(payload, ['logo_url', 'logoUrl', 'logo'])),
  };
};

export const getDocumentCompanyInfo = async (forceRefresh = false): Promise<DocumentCompanyInfo> => {
  const now = Date.now();
  if (!forceRefresh && cachedValue && now - cachedAt < CACHE_TTL_MS) {
    return cachedValue;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = (async () => {
    try {
      const response = await companiesService.getById(DOCUMENT_COMPANY_ID);
      const normalized = mapToDocumentCompanyInfo(response as unknown);
      cachedValue = normalized;
      cachedAt = Date.now();
      return normalized;
    } catch (error) {
      console.error('Error al obtener datos de compania para documentos:', error);
      cachedValue = DEFAULT_DOCUMENT_COMPANY_INFO;
      cachedAt = Date.now();
      return DEFAULT_DOCUMENT_COMPANY_INFO;
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};
