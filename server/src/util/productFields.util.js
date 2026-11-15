const toUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'object' && item.url) return String(item.url).trim();
  return String(item).trim();
};

const parseLineList = (value, fallbackText) => {
  if (Array.isArray(value)) {
    return value.map(toUrl).filter(Boolean);
  }
  const source =
    typeof value === 'string' && value.trim()
      ? value
      : typeof fallbackText === 'string'
        ? fallbackText
        : '';
  if (!source) return [];
  return source
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const parseImageList = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map(toUrl).filter(Boolean);
};

module.exports = {
  parseLineList,
  parseImageList
};
