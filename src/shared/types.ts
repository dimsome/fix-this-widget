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

export type FixThisWidgetFeedbackSource = 'fix_this_widget' | (string & {});

export interface FixThisWidgetFeedbackPayload {
  source: FixThisWidgetFeedbackSource;
  note: string;
  email?: string;
  element?: FeedbackElementMetadata | null;
  page: FixThisWidgetPageMetadata;
  viewport: FixThisWidgetViewportMetadata;
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

export type FixThisWidgetContext = Pick<FixThisWidgetFeedbackPayload, 'page' | 'viewport' | 'ts'>
  & Partial<Pick<FixThisWidgetFeedbackPayload, 'requestId' | 'sessionId'>>;

export type SubmitFixThisWidgetFeedback = (body: FixThisWidgetFeedbackPayload) => Promise<void | FixThisWidgetFeedbackResponse | unknown>;

export type FixThisWidgetProps = {
  submitFeedback?: SubmitFixThisWidgetFeedback;
  footerSelector?: string;
  enableElementPicker?: boolean;
  feedbackSource?: FixThisWidgetFeedbackSource;
  getContext?: () => FixThisWidgetContext;
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
