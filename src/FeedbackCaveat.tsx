import { CAVEAT_LINE, SUPPORT_CAVEAT } from './copy';

export function FeedbackCaveat({ testId }: { testId: string }) {
  return (
    <p className="global-feedback-caveat" data-testid={testId}>
      <strong>We read every note.</strong> {CAVEAT_LINE}
      <br />
      {SUPPORT_CAVEAT}
    </p>
  );
}
