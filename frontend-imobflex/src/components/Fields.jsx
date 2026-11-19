export function Field({ label, name, error, ...props }) {
  return (
    <label>
      {label}
      <input
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${name}-error`} className="form-error">
          {error}
        </span>
      )}
    </label>
  );
}
export function Notice({ message, success = false }) {
  return message ? (
    <div
      role={success ? "status" : "alert"}
      className={`notice ${success ? "success" : ""}`}
    >
      {message}
    </div>
  ) : null;
}
