# DSCSA Barcode Scanner - Web Application

A Vue.js web application for scanning GS1 barcodes and generating CSV files for DSCSA compliance import.

## Features

- **GS1 Barcode Parsing**: Parse GS1 barcodes in both formatted `(AI)` and raw formats
- **Product Management**: Store and manage product information (GTIN, NDC, descriptions, etc.)
- **Partner Management**: Manage trading partners with GLN information
- **Interactive Scanning Workflow**:
  1. Collect transaction metadata (PO number, dates, etc.)
  2. Select trading partners (Sold By, Sold To, Ship From, Ship To)
  3. Scan items with automatic product detection
- **Duplicate Serial Detection**: Warns when scanning duplicate serial numbers
- **CSV Export**: Generate DSCSA-compliant CSV files for import into Odoo or other systems
- **Local Storage**: All data persists in browser localStorage

## Technology Stack

- **Vue 3**: Frontend framework with Composition API
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **localStorage**: Client-side data persistence

## Installation

1. Navigate to the project directory:
   ```bash
   cd dscsa-web-scanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown (usually `http://localhost:5173`)

## Usage

### 1. Manage Products (Optional but Recommended)

Before scanning, add your frequently scanned products:

1. Click on "Manage Products" tab
2. Click "Add Product"
3. Enter product information (all fields required):
   - GTIN
   - NDC
   - Proprietary Name
   - Strength
   - Dosage Form
   - Container Size
   - Manufacturer
4. The Product Description will be automatically generated from: Proprietary Name + Strength + Dosage Form + Container Size
5. Click "Add Product"

Products are stored in localStorage and will be automatically detected when scanning.

### 2. Manage Partners (Required)

Add your trading partners (all four types are required for scanning):

1. Click on "Manage Partners" tab
2. Click "Add Partner"
3. Select partner role:
   - Sold By
   - Sold To
   - Ship From
   - Ship To
4. Enter partner name and GLN
5. Click "Add Partner"

### 3. Scan Items

#### Step 1: Transaction Information
1. Click on "Scan Items" tab
2. Enter transaction details:
   - PO Number (required)
   - Delivery Document Number (optional)
   - Transaction Date (defaults to today)
   - Shipment Date (defaults to today)
   - Direct Purchase (Yes/No)
3. Click "Next: Select Partners"

#### Step 2: Select Partners
1. All partner fields are required: Sold By, Sold To, Ship From, Ship To
2. Select partners from your saved list
3. If you don't have partners saved, you must add them first in the "Manage Partners" tab
4. Click "Start Scanning"

#### Step 3: Scan Barcodes
1. Focus on the barcode input field
2. Scan barcode or paste barcode data
3. Press Enter or click "Add Item"

**For Known Products:**
- Product info is automatically filled from your saved products
- Item is added to the list immediately

**For New Products:**
- A form appears to enter product information
- All fields are required: NDC, Proprietary Name, Strength, Dosage Form, Container Size, Manufacturer
- Product Description is automatically generated from: Proprietary Name + Strength + Dosage Form + Container Size
- Click "Save & Add Item"
- Product is saved for future scans

**Duplicate Serial Detection:**
- If you scan the same serial number twice, you'll get a warning
- Choose whether to proceed or skip

#### Step 4: Export CSV
1. Review your scanned items list
2. Remove any items if needed
3. Click "Export CSV" to download the file
4. The filename will be based on your PO number (e.g., `PO12345_dscsa.csv`)

#### Reset
Click "Reset" to start a new scanning session (all scanned items will be cleared).

## Barcode Format Support

The scanner supports GS1 barcodes in multiple formats:

### Formatted (with parentheses):
```
(01)00312345678901(17)251231(10)LOT123(21)SN789
```

### Raw (without parentheses):
```
010031234567890117251231​10LOT12321SN789
```

### Supported Application Identifiers:
- **01**: GTIN (14 digits)
- **10**: Lot Number (variable length)
- **17**: Expiration Date (YYMMDD format)
- **21**: Serial Number (variable length)

## CSV Output Format

The exported CSV includes these columns:
- Transaction Date
- Shipment Date
- PO Number
- Del Document Number
- Direct Purchase
- NDC
- GTIN
- Serial Number
- Lot
- Lot Expiry Date
- Product Description
- Proprietary Name
- Dosage Form
- Strength
- Container Size
- Manufacturer Name
- Sold By Name / GLN
- Sold To Name / GLN
- Ship From Name / GLN
- Ship To Name / GLN

## Data Persistence

All data is stored in browser localStorage:
- **Partners**: `dscsa_partners`
- **Products**: `dscsa_products`

Data persists across browser sessions and page refreshes. To clear all data, use your browser's developer tools to clear localStorage.

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory. You can deploy these to any static hosting service.

To preview the production build:

```bash
npm run preview
```

## Browser Compatibility

This application works in all modern browsers that support:
- ES6+ JavaScript
- localStorage
- CSS Grid and Flexbox

Recommended browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Keyboard Shortcuts

- **Enter** in barcode input: Add scanned item
- Focus automatically returns to barcode input after each scan for quick scanning workflow

## Tips for Best Performance

1. **Pre-configure Products**: Add commonly scanned products beforehand to speed up scanning
2. **Pre-configure Partners**: Set up your trading partners once to reuse them
3. **Use Barcode Scanner**: Physical barcode scanners work best (simulate keyboard input)
4. **Keep Browser Tab Active**: Ensure the scanner tab is active when scanning for best performance

## Troubleshooting

**Barcode not parsing:**
- Ensure the barcode contains valid GS1 Application Identifiers
- Check that GTIN (AI 01) is present in the barcode
- Try copying and pasting the barcode data to verify format

**Data not persisting:**
- Check that your browser allows localStorage
- Ensure you're not in private/incognito mode
- Check browser localStorage quota (typically 5-10MB)

**CSV not downloading:**
- Check browser download settings
- Ensure pop-ups are not blocked
- Try a different browser

## License

This application is provided as-is for DSCSA compliance purposes.
