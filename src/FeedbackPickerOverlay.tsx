import type { PickerHighlight } from './types';

export type FeedbackPickerOverlayProps = {
  highlight: PickerHighlight | null;
  onCancel: () => void;
};

export function FeedbackPickerOverlay({ highlight, onCancel }: FeedbackPickerOverlayProps) {
  return (
    <div className="global-feedback-overlay">
      <div className="global-feedback-scrim" />
      {highlight ? (
        <>
          <div
            className="global-feedback-highlight"
            data-testid="global-feedback-highlight"
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          />
          <div
            className="global-feedback-floatlabel"
            data-testid="global-feedback-floatlabel"
            style={{ top: highlight.y + 14, left: highlight.x + 14 }}
          >
            <span>{highlight.label}</span>
            <span>· {highlight.type}</span>
          </div>
        </>
      ) : null}
      <div className="global-feedback-instruction">
        <span>Point at an element, then click to attach it. Press <strong>Esc</strong> to cancel.</span>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
