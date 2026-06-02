import { FeedbackCaveat } from './FeedbackCaveat';

export type FeedbackSuccessProps = {
  onSendAnother: () => void;
  onDone: () => void;
};

export function FeedbackSuccess({ onSendAnother, onDone }: FeedbackSuccessProps) {
  return (
    <div className="fix-this-widget-success" role="status">
      <span className="fix-this-widget-success-icon" aria-hidden="true">✓</span>
      <p>Thanks. We read every note.</p>
      <p className="fix-this-widget-success-sub">If it shows a gap, agents can add an interpreter or improve the explanation for future visitors.</p>
      <div className="fix-this-widget-success-actions">
        <button type="button" className="fix-this-widget-secondary" onClick={onSendAnother}>Send another</button>
        <button type="button" className="fix-this-widget-primary" onClick={onDone}>Close this feedback</button>
      </div>
      <FeedbackCaveat testId="fix-this-widget-success-caveat" />
    </div>
  );
}
