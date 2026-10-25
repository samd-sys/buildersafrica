import { useEffect, useRef, useState } from "react";

type Props = {
  step: number;
  children: React.ReactNode;
};

/**
 * Wraps each wizard step in a fade+slide transition. Every time `step`
 * changes, the old content fades out and the new content fades in from
 * slightly below — giving a smooth upward reveal on Next and a downward
 * reveal on Back.
 */
export default function StepWrapper({ step, children }: Props) {
  const [displayed, setDisplayed] = useState(children);
  const [visible, setVisible] = useState(true);
  const prevStep = useRef(step);
  const direction = step > prevStep.current ? 1 : -1;

  useEffect(() => {
    if (step === prevStep.current) {
      setDisplayed(children);
      return;
    }

    setVisible(false);
    const t = window.setTimeout(() => {
      prevStep.current = step;
      setDisplayed(children);
      setVisible(true);
    }, 180);

    return () => window.clearTimeout(t);
  }, [step, children]);

  return (
    <div
      style={{
        transition: "opacity 0.18s ease, transform 0.18s ease",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0)"
          : `translateY(${direction * 12}px)`,
      }}
    >
      {displayed}
    </div>
  );
}