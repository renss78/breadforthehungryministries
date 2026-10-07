const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

export const formatDate = (date: Date) => dateFormatter.format(date);

/** Adds an ellipsis when an excerpt was cut off mid-sentence. */
export const tidyExcerpt = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}…`);

/** Meta descriptions: Google shows ~155 characters; cut at a word boundary. */
export const metaDescription = (text: string, max = 155) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[\s,.;:–-]+\S*$/, '') + '…';
};
