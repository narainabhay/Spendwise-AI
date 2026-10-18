import { CURRENCIES } from './constants';

export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  options?: { showSign?: boolean; compact?: boolean }
): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  try {
    const formatted = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      notation: options?.compact ? 'compact' : 'standard',
    }).format(Math.abs(amount));

    if (options?.showSign) {
      if (amount > 0) return `+${formatted}`;
      if (amount < 0) return `-${formatted}`;
    }

    return formatted;
  } catch {
    // Fallback if locale or currency code is unsupported
    const sign = amount < 0 ? '-' : options?.showSign && amount > 0 ? '+' : '';
    return `${sign}${currency.symbol}${Math.abs(amount).toLocaleString('en-US')}`;
  }
}

export function formatDate(
  dateString: string,
  format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'
): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '';
  const target = new Date(dateString);
  const today = new Date();
  
  // Set both to midnight for exact day delta
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPercentage(val: number, decimals: number = 1): string {
  return `${Number(val || 0).toFixed(decimals)}%`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
