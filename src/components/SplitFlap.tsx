"use client";

export function SplitFlap({ text }: { text: string }) {
  return (
    <span className="flap-row">
      {text.split("").map((ch, i) => (
        <span key={i} className="flap flap-anim">
          {ch}
        </span>
      ))}
    </span>
  );
}
