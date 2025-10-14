/**
 * CSV Exporter
 * Generate CSV files for DSCSA compliance import
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header names
 * @returns {string} CSV string
 */
function arrayToCSV(data, headers) {
  const rows = []

  // Add header row
  rows.push(headers.join(','))

  // Add data rows
  for (const item of data) {
    const row = headers.map(header => {
      const value = item[header] || ''
      // Escape quotes and wrap in quotes if necessary
      if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
        return `"${value.toString().replace(/"/g, '""')}"`
      }
      return value
    })
    rows.push(row.join(','))
  }

  return rows.join('\n')
}

/**
 * Generate DSCSA CSV from scanned items
 * @param {Array} scannedItems - Array of scanned items
 * @param {Object} metadata - Transaction metadata
 * @returns {string} CSV string
 */
export function generateDSCSACSV(scannedItems, metadata) {
  const headers = [
    'Transaction Date',
    'Shipment Date',
    'PO Number',
    'Del Document Number',
    'Direct Purchase',
    'NDC',
    'GTIN',
    'Serial Number',
    'Lot',
    'Lot Expiry Date',
    'Product Description',
    'Proprietary Name',
    'Dosage Form',
    'Strength',
    'Container Size',
    'Manufacturer Name',
    'Sold By Name',
    'Sold By GLN',
    'Sold To Name',
    'Sold To GLN',
    'Ship From Name',
    'Ship From GLN',
    'Ship To Name',
    'Ship To GLN'
  ]

  const rows = scannedItems.map(item => ({
    'Transaction Date': metadata.transactionDate || '',
    'Shipment Date': metadata.shipmentDate || '',
    'PO Number': metadata.poNumber || '',
    'Del Document Number': metadata.delDocumentNumber || '',
    'Direct Purchase': metadata.directPurchase || 'yes',
    'NDC': item.ndc || '',
    'GTIN': item.gtin || '',
    'Serial Number': item.serial || '',
    'Lot': item.lot || '',
    'Lot Expiry Date': item.expiration || '',
    'Product Description': item.productDescription || '',
    'Proprietary Name': item.proprietaryName || '',
    'Dosage Form': item.dosageForm || '',
    'Strength': item.strength || '',
    'Container Size': item.containerSize || '',
    'Manufacturer Name': item.manufacturerName || '',
    'Sold By Name': metadata.soldByName || '',
    'Sold By GLN': metadata.soldByGln || '',
    'Sold To Name': metadata.soldToName || '',
    'Sold To GLN': metadata.soldToGln || '',
    'Ship From Name': metadata.shipFromName || '',
    'Ship From GLN': metadata.shipFromGln || '',
    'Ship To Name': metadata.shipToName || '',
    'Ship To GLN': metadata.shipToGln || ''
  }))

  return arrayToCSV(rows, headers)
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename)
  } else {
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Generate filename from PO number
 * @param {string} poNumber - PO number
 * @returns {string} Filename
 */
export function generateFilename(poNumber) {
  if (!poNumber) {
    poNumber = 'NO_PO'
  }

  // Clean PO number for filename (remove invalid chars)
  const cleanPO = poNumber.replace(/[/\\]/g, '-').replace(/\s+/g, '_')
  return `${cleanPO}_dscsa.csv`
}
