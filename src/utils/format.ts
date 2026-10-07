const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

export const formatDate = (date: Date) => dateFormatter.format(date);

/** Adds an ellipsis when an excerpt was cut off mid-sentence. */
export const tidyExcerpt = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}…`);
