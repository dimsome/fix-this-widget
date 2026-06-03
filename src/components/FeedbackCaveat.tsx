import { CAVEAT_LINE, SUPPORT_CAVEAT } from '../shared/copy';

export function FeedbackCaveat({ testId }: { testId: string }) {
  return (
    <p className="fix-this-widget-caveat" data-testid={testId}>
      <strong>We read every note.</strong> {CAVEAT_LINE}
      <br />
      {SUPPORT_CAVEAT}
    </p>
  );
}
