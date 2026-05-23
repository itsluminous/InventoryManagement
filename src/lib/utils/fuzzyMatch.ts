/**
 * Fuzzy matching utilities for finding similar items
 */

export interface FuzzyMatchResult<T = Record<string, unknown>> {
  item: T;
  score: number;
  matchedWords: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * Normalize string for comparison (lowercase, remove extra spaces, sort words)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .sort() // Sort words to handle position switching
    .join(' ');
}

/**
 * Extract words from a string for word-level matching
 */
function extractWords(str: string): string[] {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Calculate word-level similarity
 */
function calculateWordSimilarity(
  query: string,
  target: string
): {
  score: number;
  matchedWords: string[];
} {
  const queryWords = extractWords(query);
  const targetWords = extractWords(target);

  if (queryWords.length === 0 || targetWords.length === 0) {
    return { score: 0, matchedWords: [] };
  }

  let totalMatches = 0;
  const matchedWords: string[] = [];

  // Check each query word against target words
  for (const queryWord of queryWords) {
    let bestMatch = 0;
    let bestMatchWord = '';

    for (const targetWord of targetWords) {
      const similarity = calculateSimilarity(queryWord, targetWord);
      if (similarity > bestMatch) {
        bestMatch = similarity;
        bestMatchWord = targetWord;
      }
    }

    // Consider it a match if similarity is above threshold
    if (bestMatch > 0.7) {
      totalMatches += bestMatch;
      if (!matchedWords.includes(bestMatchWord)) {
        matchedWords.push(bestMatchWord);
      }
    }
  }

  // Calculate overall score
  const score = totalMatches / Math.max(queryWords.length, targetWords.length);
  return { score, matchedWords };
}

/**
 * Find similar items using fuzzy matching
 */
export function findSimilarItems<T extends { name: string }>(
  query: string,
  items: T[],
  threshold: number = 0.6,
  maxResults: number = 5
): FuzzyMatchResult<T>[] {
  if (!query.trim() || query.trim().length < 3) {
    return [];
  }

  const results: FuzzyMatchResult<T>[] = [];

  for (const item of items) {
    // Skip exact matches (case-insensitive)
    if (query.toLowerCase().trim() === item.name.toLowerCase().trim()) {
      continue;
    }

    // Calculate multiple similarity scores
    const queryLower = query.toLowerCase().trim();
    const itemNameLower = item.name.toLowerCase().trim();

    // 1. Direct string similarity
    const directSimilarity = calculateSimilarity(queryLower, itemNameLower);

    // 2. Check if query is a substring of item name
    const substringMatch = itemNameLower.includes(queryLower) ? 0.8 : 0;

    // 3. Check if item name starts with query
    const startsWithMatch = itemNameLower.startsWith(queryLower) ? 0.9 : 0;

    // 4. Word-level matching
    const wordSimilarity = calculateWordSimilarity(query, item.name);

    // 5. Normalized word order matching
    const normalizedQuery = normalizeString(query);
    const normalizedItemName = normalizeString(item.name);
    const normalizedSimilarity = calculateSimilarity(
      normalizedQuery,
      normalizedItemName
    );

    // Combine scores with weights - prioritize starts-with and substring matches
    const combinedScore = Math.max(
      startsWithMatch,
      substringMatch,
      directSimilarity * 0.6 + wordSimilarity.score * 0.4,
      normalizedSimilarity * 0.7,
      wordSimilarity.score
    );

    if (combinedScore >= threshold) {
      results.push({
        item,
        score: combinedScore,
        matchedWords: wordSimilarity.matchedWords,
      });
    }
  }

  // Sort by score (highest first) and limit results
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Check if two item names are likely duplicates
 */
export function isDuplicateItem(name1: string, name2: string): boolean {
  const normalized1 = normalizeString(name1);
  const normalized2 = normalizeString(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // High similarity score
  const similarity = calculateSimilarity(normalized1, normalized2);
  const wordSimilarity = calculateWordSimilarity(name1, name2);

  return similarity > 0.85 || wordSimilarity.score > 0.9;
}
