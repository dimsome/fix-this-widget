import { FeedbackCaveat } from './FeedbackCaveat';

export type FeedbackSuccessProps = {
  onSendAnother: () => void;
  onDone: () => void;
};

export function FeedbackSuccess({ onSendAnother, onDone }: FeedbackSuccessProps) {
  return (
    <div className="global-feedback-success" role="status">
      <span className="global-feedback-success-icon" aria-hidden="true">✓</span>
      <p>Thanks. We read every note.</p>
      <p className="global-feedback-success-sub">If it shows a gap, agents can add an interpreter or improve the explanation for future visitors.</p>
      <div className="global-feedback-success-actions">
        <button type="button" className="global-feedback-secondary" onClick={onSendAnother}>Send another</button>
        <button type="button" className="global-feedback-primary" onClick={onDone}>Close this feedback</button>
      </div>
      <FeedbackCaveat testId="global-feedback-success-caveat" />
    </div>
  );
}
