/**
 * Split text into chunks for knowledge base storage
 * Max chunk size: 4500 characters (leaving room for metadata)
 */

const MAX_CHUNK_SIZE = 4500
const TARGET_CHUNK_SIZE = 3500

export interface TextChunk {
  content: string
  partNumber: number
  totalParts: number
}

/**
 * Split text into chunks, trying to break at sentence boundaries
 */
export function chunkText(text: string): TextChunk[] {
  // If text is small enough, return as single chunk
  if (text.length <= MAX_CHUNK_SIZE) {
    return [
      {
        content: text,
        partNumber: 1,
        totalParts: 1,
      },
    ]
  }

  const chunks: TextChunk[] = []
  let remaining = text
  let partNumber = 1

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_SIZE) {
      // Last chunk
      chunks.push({
        content: remaining.trim(),
        partNumber,
        totalParts: 0, // Will be updated at the end
      })
      break
    }

    // Find a good breaking point around TARGET_CHUNK_SIZE
    let breakPoint = TARGET_CHUNK_SIZE

    // Try to break at sentence end (. ! ?)
    const searchArea = remaining.substring(TARGET_CHUNK_SIZE - 500, TARGET_CHUNK_SIZE + 500)
    const sentenceEndMatch = searchArea.match(/[.!?]\s/)

    if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
      breakPoint = TARGET_CHUNK_SIZE - 500 + sentenceEndMatch.index + 1
    } else {
      // Fallback: break at space
      const spaceIndex = remaining.lastIndexOf(" ", MAX_CHUNK_SIZE)
      if (spaceIndex > TARGET_CHUNK_SIZE - 1000) {
        breakPoint = spaceIndex
      }
    }

    const chunk = remaining.substring(0, breakPoint).trim()
    chunks.push({
      content: chunk,
      partNumber,
      totalParts: 0, // Will be updated at the end
    })

    remaining = remaining.substring(breakPoint).trim()
    partNumber++
  }

  // Update totalParts for all chunks
  const totalParts = chunks.length
  return chunks.map((chunk) => ({
    ...chunk,
    totalParts,
  }))
}
