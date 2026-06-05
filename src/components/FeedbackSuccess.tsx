import type { FixThisWidgetCopy } from '../shared/types';

export type FeedbackSuccessProps = {
  copy: FixThisWidgetCopy;
  onSendAnother: () => void;
  onDone: () => void;
};

export function FeedbackSuccess({ copy, onSendAnother, onDone }: FeedbackSuccessProps) {
  return (
    <div className="fix-this-widget-success" role="status">
      <span className="fix-this-widget-success-icon" aria-hidden="true">✓</span>
      <p>{copy.successTitle}</p>
      <p className="fix-this-widget-success-sub">{copy.successDescription}</p>
      <div className="fix-this-widget-success-actions">
        <button type="button" className="fix-this-widget-secondary" onClick={onSendAnother}>{copy.sendAnother}</button>
        <button type="button" className="fix-this-widget-primary" onClick={onDone}>{copy.closeSuccess}</button>
      </div>
    </div>
  );
}
