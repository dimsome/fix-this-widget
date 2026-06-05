import type { FixThisWidgetCopy } from './types';

export const FIX_THIS_WIDGET_DEFAULT_COPY: FixThisWidgetCopy = {
  trigger: 'Fix This',
  title: 'Send feedback',
  close: 'Close feedback',
  noteLabel: 'Your feedback',
  notePlaceholder: "What's working, or what's off?",
  emailLabel: 'Email',
  emailOptionalText: "optional, if you'd like a reply",
  emailPlaceholder: 'you@example.com',
  attachElementLabel: 'Attach an element',
  attachElementOptionalText: 'optional',
  attachElementButton: '＋ Point at an element',
  removeAttachedElement: 'Remove attached element',
  submit: 'Send feedback',
  submitting: 'Sending…',
  emptyNoteMessage: 'Write a short note first, then we can send it.',
  submitErrorMessage: "Couldn't send that feedback. Your note is still here, try again.",
  pickerInstructions: 'Point at an element, then click to attach it. Press Esc to cancel.',
  pickerCancel: 'Cancel',
  successTitle: 'Thanks for the feedback',
  successDescription: 'We will evaluate the feedback and adjust accordingly if needed.',
  sendAnother: 'Send another',
  closeSuccess: 'Close this feedback',
};

export function mergeFixThisWidgetCopy(copy?: Partial<FixThisWidgetCopy>): FixThisWidgetCopy {
  return { ...FIX_THIS_WIDGET_DEFAULT_COPY, ...copy };
}
