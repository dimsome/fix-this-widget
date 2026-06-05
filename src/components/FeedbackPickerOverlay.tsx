import type { FixThisWidgetCopy, PickerHighlight } from '../shared/types';

export type FeedbackPickerOverlayProps = {
  highlight: PickerHighlight | null;
  copy: FixThisWidgetCopy;
  onCancel: () => void;
};

export function FeedbackPickerOverlay({ highlight, copy, onCancel }: FeedbackPickerOverlayProps) {
  return (
    <div className="fix-this-widget-overlay">
      <div className="fix-this-widget-scrim" />
      {highlight ? (
        <>
          <div
            className="fix-this-widget-highlight"
            data-testid="fix-this-widget-highlight"
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          />
          <div
            className="fix-this-widget-floatlabel"
            data-testid="fix-this-widget-floatlabel"
            style={{ top: highlight.y + 14, left: highlight.x + 14 }}
          >
            <span>{highlight.label}</span>
            <span>· {highlight.type}</span>
          </div>
        </>
      ) : null}
      <div className="fix-this-widget-instruction">
        <span>{copy.pickerInstructions}</span>
        <button type="button" onClick={onCancel}>{copy.pickerCancel}</button>
      </div>
    </div>
  );
}
