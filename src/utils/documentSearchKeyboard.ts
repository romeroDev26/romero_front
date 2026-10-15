import type { KeyboardEvent } from 'react';

/** Keep document lookup separate from submission of the surrounding form. */
export const searchDocumentOnEnter = (event: KeyboardEvent<HTMLInputElement>, search: () => unknown, disabled = false) => {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  if (!disabled && !event.repeat) void search();
};
