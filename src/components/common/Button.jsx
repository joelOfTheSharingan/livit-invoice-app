import React from "react";

/**
 * @param {object} props
 * @param {"primary"|"accent"|"ghost"|"danger"|"sm"} [props.variant]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 */
export default function Button({
  children,
  variant = "",
  loading = false,
  disabled = false,
  className = "",
  ...rest
}) {
  const cls = ["btn", variant ? `btn--${variant}` : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" /> Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}
