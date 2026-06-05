import type { ReactNode } from 'react';

export type FeedbackElementType = 'Heading' | 'Button' | 'Link' | 'Input' | 'Card/Section' | 'Image' | 'Text';

export interface FeedbackElementContext {
  path: string;
  target: string;
  parent: string | null;
}

export interface FeedbackElementMetadata {
  label: string;
  type: FeedbackElementType;
  selector: string;
  selectorCandidates: string[];
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  text: string | null;
  context: FeedbackElementContext;
}

export interface FixThisWidgetPageMetadata {
  url: string;
  title: string;
}

export interface FixThisWidgetViewportMetadata {
  w: number;
  h: number;
}

export interface FixThisWidgetScrollMetadata {
  x: number;
  y: number;
}

export type FixThisWidgetFeedbackSource = 'fix_this_widget' | (string & {});

export type FixThisWidgetCopy = {
  trigger: string;
  title: string;
  close: string;
  noteLabel: string;
  notePlaceholder: string;
  emailLabel: string;
  emailOptionalText: string;
  emailPlaceholder: string;
  attachElementLabel: string;
  attachElementOptionalText: string;
  attachElementButton: string;
  removeAttachedElement: string;
  submit: string;
  submitting: string;
  emptyNoteMessage: string;
  submitErrorMessage: string;
  pickerInstructions: ReactNode;
  pickerCancel: string;
  successTitle: string;
  successDescription: string;
  sendAnother: string;
  closeSuccess: string;
};

export interface FixThisWidgetFeedbackPayload {
  source: FixThisWidgetFeedbackSource;
  note: string;
  email?: string;
  element?: FeedbackElementMetadata | null;
  page: FixThisWidgetPageMetadata;
  viewport: FixThisWidgetViewportMetadata;
  scroll: FixThisWidgetScrollMetadata;
  ts: string;
  requestId?: string;
  sessionId?: string;
}

export interface FixThisWidgetFeedbackResponse {
  kind?: 'feedback';
  feedbackId?: string;
  created?: boolean;
  rating?: 'good' | 'wrong' | 'unsure' | null;
  note?: string | null;
}

export type FixThisWidgetContext = Pick<FixThisWidgetFeedbackPayload, 'page' | 'viewport' | 'scroll' | 'ts'>
  & Partial<Pick<FixThisWidgetFeedbackPayload, 'requestId' | 'sessionId'>>;

export type FixThisWidgetContextOverride = Partial<Pick<FixThisWidgetFeedbackPayload, 'ts' | 'requestId' | 'sessionId'>> & {
  page?: Partial<FixThisWidgetPageMetadata>;
  viewport?: Partial<FixThisWidgetViewportMetadata>;
  scroll?: Partial<FixThisWidgetScrollMetadata>;
};

export type SubmitFixThisWidgetFeedback = (body: FixThisWidgetFeedbackPayload) => Promise<void | FixThisWidgetFeedbackResponse | unknown>;

export type FixThisWidgetProps = {
  submitFeedback?: SubmitFixThisWidgetFeedback;
  footerSelector?: string;
  enableElementPicker?: boolean;
  collectEmail?: boolean;
  feedbackSource?: FixThisWidgetFeedbackSource;
  getContext?: () => FixThisWidgetContextOverride;
  footerContext?: ReactNode;
  copy?: Partial<FixThisWidgetCopy>;
};

export type FeedbackSubmitState = 'idle' | 'submitting' | 'success' | 'error';

export type PickerHighlight = {
  top: number;
  left: number;
  width: number;
  height: number;
  x: number;
  y: number;
  label: string;
  type: FeedbackElementType;
};
