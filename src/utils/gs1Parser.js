/**
 * GS1 Application Identifiers
 */
const GS1_AI = {
  '01': { name: 'GTIN', length: 14 },
  '10': { name: 'Lot', length: null },  // Variable
  '17': { name: 'Expiration', length: 6 },
  '21': { name: 'Serial', length: null },  // Variable
  '310': { name: 'Weight', length: 6 },
  '320': { name: 'Weight', length: 6 },
}

/**
 * GS1 Barcode Parser
 * Parse GS1 barcodes and extract product information
 */
export class GS1BarcodeParser {
  constructor() {
    this.aiPatterns = this._buildPatterns()
  }

  /**
   * Build regex patterns for GS1 AI parsing
   */
  _buildPatterns() {
    const patterns = []
    // Order matters - longer AIs first
    const sortedAIs = Object.keys(GS1_AI).sort((a, b) => b.length - a.length)

    for (const ai of sortedAIs) {
      const info = GS1_AI[ai]
      let pattern

      if (info.length) {
        // Fixed length
        pattern = new RegExp(`\\(${ai}\\)([\\x00-\\x7F]{${info.length}})`)
      } else {
        // Variable length (terminated by GS1 separator or another AI)
        pattern = new RegExp(`\\(${ai}\\)([\\x00-\\x7F]+?)(?=\\(|$)`)
      }

      patterns.push({ ai, pattern })
    }

    return patterns
  }

  /**
   * Parse GS1 barcode and extract data
   * @param {string} barcode - Raw barcode string
   * @returns {Object} Parsed data with keys: gtin, lot, serial, expiration
   */
  parse(barcode) {
    if (!barcode) return {}

    // Handle different barcode formats
    barcode = barcode.trim()

    // If barcode doesn't have parentheses, try to parse without them
    if (!barcode.includes('(')) {
      return this._parseRaw(barcode)
    }

    // Parse with parentheses format
    return this._parseFormatted(barcode)
  }

  /**
   * Parse barcode with (AI) format
   */
  _parseFormatted(barcode) {
    const data = {}

    for (const { ai, pattern } of this.aiPatterns) {
      const match = pattern.exec(barcode)
      if (match) {
        const value = match[1].trim()

        if (ai === '01') {
          data.gtin = value
        } else if (ai === '10') {
          data.lot = value
        } else if (ai === '21') {
          data.serial = value
        } else if (ai === '17') {
          data.expiration = this._formatDate(value)
        }
      }
    }

    return data
  }

  /**
   * Parse raw barcode without parentheses (positional parsing)
   */
  _parseRaw(barcode) {
    const data = {}
    let pos = 0

    // Try to parse sequentially
    while (pos < barcode.length) {
      let found = false

      // Try each AI (sorted by length, longest first)
      const sortedAIs = Object.keys(GS1_AI).sort((a, b) => b.length - a.length)

      for (const ai of sortedAIs) {
        if (barcode.substring(pos, pos + ai.length) === ai) {
          const info = GS1_AI[ai]
          pos += ai.length

          let value
          if (info.length) {
            // Fixed length
            value = barcode.substring(pos, pos + info.length)
            pos += info.length
          } else {
            // Variable length - read until next AI or end
            let end = pos
            while (end < barcode.length) {
              // Check if we hit another AI
              let nextAI = false
              for (const checkAI of Object.keys(GS1_AI)) {
                if (barcode.substring(end, end + checkAI.length) === checkAI) {
                  nextAI = true
                  break
                }
              }
              if (nextAI) break
              end++
            }
            value = barcode.substring(pos, end)
            pos = end
          }

          // Store the value
          if (ai === '01') {
            data.gtin = value
          } else if (ai === '10') {
            data.lot = value
          } else if (ai === '21') {
            data.serial = value
          } else if (ai === '17') {
            data.expiration = this._formatDate(value)
          }

          found = true
          break
        }
      }

      if (!found) {
        // Skip unknown character
        pos++
      }
    }

    return data
  }

  /**
   * Convert YYMMDD to MM/DD/YYYY
   */
  _formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 6) {
      return null
    }

    try {
      const yy = parseInt(dateStr.substring(0, 2))
      const mm = parseInt(dateStr.substring(2, 4))
      const dd = parseInt(dateStr.substring(4, 6))

      // Assume 20xx for year
      const yyyy = 2000 + yy

      return `${mm.toString().padStart(2, '0')}/${dd.toString().padStart(2, '0')}/${yyyy}`
    } catch (error) {
      return null
    }
  }
}
