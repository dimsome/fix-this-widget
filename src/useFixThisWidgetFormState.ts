import { useCallback, useReducer } from 'react';
import type { FeedbackElementMetadata, FeedbackSubmitState } from './types';
import { EMPTY_NOTE_MESSAGE } from './copy';

type FeedbackWidgetState = {
  open: boolean;
  note: string;
  email: string;
  attached: FeedbackElementMetadata | null;
  message: string;
  submitState: FeedbackSubmitState;
};

type FeedbackWidgetAction =
  | { type: 'setOpen'; open: boolean }
  | { type: 'toggleOpen' }
  | { type: 'setNote'; note: string }
  | { type: 'setEmail'; email: string }
  | { type: 'setAttached'; attached: FeedbackElementMetadata | null }
  | { type: 'setMessage'; message: string }
  | { type: 'setSubmitState'; submitState: FeedbackSubmitState }
  | { type: 'markEmptyNote' }
  | { type: 'resetForm' };

const initialFeedbackWidgetState: FeedbackWidgetState = {
  open: false,
  note: '',
  email: '',
  attached: null,
  message: '',
  submitState: 'idle',
};

function feedbackWidgetReducer(state: FeedbackWidgetState, action: FeedbackWidgetAction): FeedbackWidgetState {
  switch (action.type) {
    case 'setOpen':
      return { ...state, open: action.open };
    case 'toggleOpen':
      return { ...state, open: !state.open };
    case 'setNote':
      return {
        ...state,
        note: action.note,
        message: state.message === EMPTY_NOTE_MESSAGE ? '' : state.message,
      };
    case 'setEmail':
      return { ...state, email: action.email };
    case 'setAttached':
      return { ...state, attached: action.attached };
    case 'setMessage':
      return { ...state, message: action.message };
    case 'setSubmitState':
      return { ...state, submitState: action.submitState };
    case 'markEmptyNote':
      return { ...state, message: EMPTY_NOTE_MESSAGE, submitState: 'idle' };
    case 'resetForm':
      return {
        ...state,
        note: '',
        email: '',
        attached: null,
        message: '',
        submitState: 'idle',
      };
    default:
      return state;
  }
}

export function useFixThisWidgetFormState() {
  const [state, dispatch] = useReducer(feedbackWidgetReducer, initialFeedbackWidgetState);
  const noteIsEmpty = state.note.trim().length === 0;

  const setOpen = useCallback((open: boolean) => dispatch({ type: 'setOpen', open }), []);
  const closePanel = useCallback(() => dispatch({ type: 'setOpen', open: false }), []);
  const toggleOpen = useCallback(() => dispatch({ type: 'toggleOpen' }), []);
  const setNote = useCallback((note: string) => dispatch({ type: 'setNote', note }), []);
  const setEmail = useCallback((email: string) => dispatch({ type: 'setEmail', email }), []);
  const setAttached = useCallback((attached: FeedbackElementMetadata | null) => dispatch({ type: 'setAttached', attached }), []);
  const clearAttached = useCallback(() => dispatch({ type: 'setAttached', attached: null }), []);
  const setMessage = useCallback((message: string) => dispatch({ type: 'setMessage', message }), []);
  const setSubmitState = useCallback((submitState: FeedbackSubmitState) => dispatch({ type: 'setSubmitState', submitState }), []);
  const markEmptyNote = useCallback(() => dispatch({ type: 'markEmptyNote' }), []);
  const resetForm = useCallback(() => dispatch({ type: 'resetForm' }), []);

  return {
    state,
    noteIsEmpty,
    actions: {
      setOpen,
      closePanel,
      toggleOpen,
      setNote,
      setEmail,
      setAttached,
      clearAttached,
      setMessage,
      setSubmitState,
      markEmptyNote,
      resetForm,
    },
  };
}
