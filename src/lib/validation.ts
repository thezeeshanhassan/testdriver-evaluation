export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 80;

/**
 * Validates a task title. Shared by the form and the API so both enforce the
 * same rules. Returns an error message, or null when the title is valid.
 */
export function validateTitle(
  raw: unknown,
  existingTitles: string[] = [],
): string | null {
  if (typeof raw !== "string") return "Title is required.";
  const title = raw.trim();
  if (title.length === 0) return "Title is required.";
  if (title.length < TITLE_MIN_LENGTH) return `Title must be at least ${TITLE_MIN_LENGTH} characters.`;
  if (title.length > TITLE_MAX_LENGTH) return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  const normalized = title.toLowerCase();
  if (existingTitles.some((t) => t.trim().toLowerCase() === normalized)) {
    return "A task with this title already exists.";
  }
  return null;
}
