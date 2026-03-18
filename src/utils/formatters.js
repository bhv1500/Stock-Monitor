export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatChange = (change) => {
  if (change === null || change === undefined || isNaN(change)) return '--';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}`;
};

export const formatPercent = (percent) => {
  if (percent === null || percent === undefined || isNaN(percent)) return '--';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

export const formatVolume = (vol) => {
  if (!vol) return '--';
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
};

export const formatMarketCap = (mc) => {
  if (!mc) return '--';
  if (mc >= 1_000_000_000_000) return `$${(mc / 1_000_000_000_000).toFixed(2)}T`;
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(2)}B`;
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`;
  return `$${mc}`;
};
