/**
 * Utility functions for database operations
 */

/**
 * Extracts a count value from a database query result, throwing an error if the result is invalid.
 * 
 * @param countResult The database query result containing a count field
 * @returns The extracted count as a number
 * @throws Error if the count result is missing, malformed, or cannot be converted to a number
 */
export const extractCount = (countResult: { count: unknown }[] | undefined): number => {
  if (!countResult || !countResult[0] || typeof countResult[0].count === 'undefined') {
    throw new Error('Database count result is missing or malformed');
  }
  
  const count = Number(countResult[0].count);
  if (isNaN(count)) {
    throw new Error(`Invalid count value: ${countResult[0].count}`);
  }
  
  return count;
}; 