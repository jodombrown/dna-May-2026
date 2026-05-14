/**
 * Inline validation error component - friendly, human messages.
 */
export function FieldError({
  field,
  errors,
}: {
  field: string;
  errors: Record<string, string>;
}) {
  if (!errors[field]) return null;
  return (
    <p id={`composer-error-${field}`} className="text-sm text-destructive mt-1">
      {errors[field]}
    </p>
  );
}
