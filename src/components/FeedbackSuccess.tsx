export type FeedbackSuccessProps = {
  onSendAnother: () => void;
  onDone: () => void;
};

export function FeedbackSuccess({ onSendAnother, onDone }: FeedbackSuccessProps) {
  return (
    <div className="fix-this-widget-success" role="status">
      <span className="fix-this-widget-success-icon" aria-hidden="true">✓</span>
      <p>Thanks for the feedback</p>
      <p className="fix-this-widget-success-sub">We will evaluate the feedback and adjust accordingly if needed.</p>
      <div className="fix-this-widget-success-actions">
        <button type="button" className="fix-this-widget-secondary" onClick={onSendAnother}>Send another</button>
        <button type="button" className="fix-this-widget-primary" onClick={onDone}>Close this feedback</button>
      </div>
    </div>
  );
}
