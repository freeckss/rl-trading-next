/**
 * Environment variable retrieval helper.
 * Reads process.env[name] and throws an informative descriptive error if the variable is missing or empty.
 * Prevents silent failures and undefined behavior from non-null assertions (!).
 *
 * @param name - The name of the environment variable (e.g. 'NEXT_PUBLIC_SUPABASE_URL')
 * @returns The resolved environment variable value
 */
export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: "${name}". Please check your .env.local file or deployment configuration.`
    );
  }
  return value;
}

