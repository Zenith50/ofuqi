const ARABIC_TEXT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function getTextDirection(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return 'ltr';
  }

  return ARABIC_TEXT.test(text) ? 'rtl' : 'ltr';
}

function isolateText(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }

  // Isolation marks keep email addresses, URLs, dates, and Arabic text in the right visual order.
  const opener = getTextDirection(text) === 'rtl' ? '\u2067' : '\u2066';
  return `${opener}${text}\u2069`;
}

function formatInlineText(values, separator) {
  return values
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
    .map(isolateText)
    .join(separator);
}

function formatDateRange(startDate, endDate) {
  return formatInlineText([startDate, endDate], ' - ');
}

module.exports = {
  getTextDirection,
  isolateText,
  formatInlineText,
  formatDateRange
};
