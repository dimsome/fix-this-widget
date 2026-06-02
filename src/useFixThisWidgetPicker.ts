import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { FeedbackElementMetadata, PickerHighlight } from './types';
import { describeFeedbackElement } from './elementMetadata';

type UseFixThisWidgetPickerOptions = {
  rootRef: RefObject<HTMLElement | null>;
  onAttach: (element: FeedbackElementMetadata) => void;
  onPanelOpenChange: (open: boolean) => void;
};

function targetElement(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null;
}

export function useFixThisWidgetPicker({ rootRef, onAttach, onPanelOpenChange }: UseFixThisWidgetPickerOptions) {
  const currentPickerElementRef = useRef<Element | null>(null);
  const [picking, setPicking] = useState(false);
  const [highlight, setHighlight] = useState<PickerHighlight | null>(null);

  const stopPicking = useCallback((reopenPanel: boolean) => {
    currentPickerElementRef.current = null;
    setHighlight(null);
    setPicking(false);
    onPanelOpenChange(reopenPanel);
  }, [onPanelOpenChange]);

  const startPicking = useCallback(() => {
    currentPickerElementRef.current = null;
    setHighlight(null);
    setPicking(true);
    onPanelOpenChange(false);
  }, [onPanelOpenChange]);

  const aimPickerAt = useEffectEvent((target: Element, x: number, y: number) => {
    if (rootRef.current?.contains(target)) {
      currentPickerElementRef.current = null;
      setHighlight(null);
      return;
    }

    const metadata = describeFeedbackElement(target);
    const rect = target.getBoundingClientRect();
    currentPickerElementRef.current = target;
    setHighlight({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x,
      y,
      label: metadata.label,
      type: metadata.type,
    });
  });

  const capturePickerElement = useEffectEvent((target: Element) => {
    const element = currentPickerElementRef.current ?? target;
    if (rootRef.current?.contains(element)) return;

    onAttach(describeFeedbackElement(element));
    stopPicking(true);
  });

  useEffect(() => {
    if (!picking) return undefined;

    function onPickMove(event: MouseEvent) {
      const target = targetElement(event);
      if (!target) return;
      aimPickerAt(target, event.clientX, event.clientY);
    }

    function onPickFocus(event: FocusEvent) {
      const target = targetElement(event);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      aimPickerAt(target, rect.left + rect.width / 2, rect.bottom);
    }

    function onPickClick(event: MouseEvent) {
      const target = targetElement(event);
      if (!target || rootRef.current?.contains(target)) return;

      event.preventDefault();
      event.stopPropagation();
      capturePickerElement(target);
    }

    function onPickKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return;
      const target = targetElement(event);
      if (!target || rootRef.current?.contains(target)) return;

      event.preventDefault();
      capturePickerElement(target);
    }

    document.addEventListener('mousemove', onPickMove, true);
    document.addEventListener('focusin', onPickFocus, true);
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKeyDown, true);
    return () => {
      document.removeEventListener('mousemove', onPickMove, true);
      document.removeEventListener('focusin', onPickFocus, true);
      document.removeEventListener('click', onPickClick, true);
      document.removeEventListener('keydown', onPickKeyDown, true);
    };
  }, [picking, rootRef]);

  return {
    picking,
    highlight,
    startPicking,
    stopPicking,
  };
}
