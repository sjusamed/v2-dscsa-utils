<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { GS1BarcodeParser } from '../utils/gs1Parser'
import { PartnerManager } from '../utils/partnerManager'
import { ProductManager } from '../utils/productManager'
import { generateDSCSACSV, downloadCSV, generateFilename } from '../utils/csvExporter'

// Initialize managers
const parser = new GS1BarcodeParser()
const partnerMgr = new PartnerManager()
const productMgr = new ProductManager()

// Scanner state
const step = ref(1) // 1: Metadata, 2: Partners, 3: Scanning
const scannedItems = ref([])
const scannedSerials = ref(new Set())

// Metadata
const metadata = reactive({
  poNumber: '',
  delDocumentNumber: '',
  transactionDate: new Date().toLocaleDateString('en-US'),
  shipmentDate: new Date().toLocaleDateString('en-US'),
  directPurchase: 'yes',
  soldByName: '',
  soldByGln: '',
  soldToName: '',
  soldToGln: '',
  shipFromName: '',
  shipFromGln: '',
  shipToName: '',
  shipToGln: ''
})

// Partner selection
const partners = reactive({
  soldBy: [],
  soldTo: [],
  shipFrom: [],
  shipTo: []
})

const selectedPartners = reactive({
  soldBy: null,
  soldTo: null,
  shipFrom: null,
  shipTo: null
})

// Scanning
const barcodeInput = ref('')
const currentItemCount = computed(() => scannedItems.value.length)

// Product form for new products
const showProductForm = ref(false)
const newProduct = reactive({
  gtin: '',
  ndc: '',
  productDescription: '',
  proprietaryName: '',
  strength: '',
  dosageForm: '',
  containerSize: '',
  manufacturer: ''
})

const generatedProductDescription = computed(() => {
  const parts = [
    newProduct.proprietaryName,
    newProduct.strength,
    newProduct.dosageForm,
    newProduct.containerSize
  ].filter(part => part && part.trim())

  return parts.join(' ')
})

onMounted(async () => {
  // Load partners and products
  await partnerMgr.loadPartners()
  await productMgr.loadProducts()

  partners.soldBy = partnerMgr.listPartners('sold_by')
  partners.soldTo = partnerMgr.listPartners('sold_to')
  partners.shipFrom = partnerMgr.listPartners('ship_from')
  partners.shipTo = partnerMgr.listPartners('ship_to')
})

function nextStep() {
  if (step.value === 1) {
    // Validate metadata
    if (!metadata.poNumber) {
      alert('Please enter a PO number')
      return
    }
  }

  if (step.value === 2) {
    // Validate all partners are selected
    if (selectedPartners.soldBy === null || selectedPartners.soldTo === null ||
        selectedPartners.shipFrom === null || selectedPartners.shipTo === null) {
      alert('All partner fields are required (Sold By, Sold To, Ship From, Ship To)')
      return
    }

    // Apply selected partners to metadata
    const soldByPartner = partners.soldBy[selectedPartners.soldBy]
    metadata.soldByName = soldByPartner.name
    metadata.soldByGln = soldByPartner.gln

    const soldToPartner = partners.soldTo[selectedPartners.soldTo]
    metadata.soldToName = soldToPartner.name
    metadata.soldToGln = soldToPartner.gln

    const shipFromPartner = partners.shipFrom[selectedPartners.shipFrom]
    metadata.shipFromName = shipFromPartner.name
    metadata.shipFromGln = shipFromPartner.gln

    const shipToPartner = partners.shipTo[selectedPartners.shipTo]
    metadata.shipToName = shipToPartner.name
    metadata.shipToGln = shipToPartner.gln
  }

  step.value++
}

function prevStep() {
  step.value--
}

async function handleScan() {
  const barcode = barcodeInput.value.trim()

  if (!barcode) return

  // Parse barcode
  const parsed = parser.parse(barcode)

  if (!parsed || !parsed.gtin) {
    alert('Could not parse barcode. Please try again.')
    barcodeInput.value = ''
    return
  }

  // Check for duplicate serial
  const serial = parsed.serial
  if (serial && scannedSerials.value.has(serial)) {
    const confirm = window.confirm(
      `WARNING: Serial number '${serial}' already scanned! Scan anyway?`
    )
    if (!confirm) {
      barcodeInput.value = ''
      return
    }
  }

  // Look up product by GTIN
  const product = await productMgr.getProductByGtin(parsed.gtin)

  if (product) {
    // Product found - add item with product info
    addScannedItem(parsed, product)
    barcodeInput.value = ''
  } else {
    // New product - show form
    newProduct.gtin = parsed.gtin
    showProductForm.value = true
    // Store parsed data temporarily
    newProduct._parsedData = parsed
  }
}

function addScannedItem(parsed, product) {
  const item = {
    gtin: parsed.gtin,
    lot: parsed.lot,
    serial: parsed.serial,
    expiration: parsed.expiration,
    ndc: product.ndc,
    productDescription: product.productDescription,
    proprietaryName: product.proprietaryName || '',
    strength: product.strength || '',
    dosageForm: product.dosageForm || '',
    containerSize: product.containerSize || '',
    manufacturerName: product.manufacturer || ''
  }

  scannedItems.value.push(item)

  // Add serial to tracking set
  if (parsed.serial) {
    scannedSerials.value.add(parsed.serial)
  }
}

async function saveNewProduct() {
  if (!newProduct.ndc || !newProduct.proprietaryName ||
      !newProduct.strength || !newProduct.dosageForm ||
      !newProduct.containerSize || !newProduct.manufacturer) {
    alert('All fields are required')
    return
  }

  const productDescription = generatedProductDescription.value

  try {
    // Save product
    await productMgr.addProduct({
      gtin: newProduct.gtin,
      ndc: newProduct.ndc,
      productDescription: productDescription,
      proprietaryName: newProduct.proprietaryName,
      strength: newProduct.strength,
      dosageForm: newProduct.dosageForm,
      containerSize: newProduct.containerSize,
      manufacturer: newProduct.manufacturer
    })

    // Add scanned item
    const parsed = newProduct._parsedData
    addScannedItem(parsed, {
      ndc: newProduct.ndc,
      productDescription: productDescription,
      proprietaryName: newProduct.proprietaryName,
      strength: newProduct.strength,
      dosageForm: newProduct.dosageForm,
      containerSize: newProduct.containerSize,
      manufacturer: newProduct.manufacturer
    })

    // Reset form
    showProductForm.value = false
    barcodeInput.value = ''
    Object.keys(newProduct).forEach(key => {
      if (key !== '_parsedData') newProduct[key] = ''
    })
  } catch (err) {
    alert('Failed to save product. Please try again.')
    console.error('Save product error:', err)
  }
}

function cancelNewProduct() {
  showProductForm.value = false
  barcodeInput.value = ''
  Object.keys(newProduct).forEach(key => {
    if (key !== '_parsedData') newProduct[key] = ''
  })
}

function removeItem(index) {
  const item = scannedItems.value[index]
  if (item.serial) {
    scannedSerials.value.delete(item.serial)
  }
  scannedItems.value.splice(index, 1)
}

function exportCSV() {
  if (scannedItems.value.length === 0) {
    alert('No items to export!')
    return
  }

  const csv = generateDSCSACSV(scannedItems.value, metadata)
  const filename = generateFilename(metadata.poNumber)
  downloadCSV(csv, filename)

  alert(`CSV file generated: ${filename}\nTotal records: ${scannedItems.value.length}`)
}

function resetScanner() {
  if (scannedItems.value.length > 0) {
    const confirm = window.confirm('Are you sure you want to reset? All scanned items will be lost.')
    if (!confirm) return
  }

  step.value = 1
  scannedItems.value = []
  scannedSerials.value = new Set()
  barcodeInput.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Progress Indicator -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div :class="['flex items-center justify-center w-10 h-10 rounded-full', step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500']">
            1
          </div>
          <div class="text-sm font-medium">Transaction Info</div>
        </div>
        <div class="flex-1 h-1 bg-gray-200 mx-4">
          <div :class="['h-full bg-blue-500 transition-all', step >= 2 ? 'w-full' : 'w-0']"></div>
        </div>
        <div class="flex items-center space-x-4">
          <div :class="['flex items-center justify-center w-10 h-10 rounded-full', step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500']">
            2
          </div>
          <div class="text-sm font-medium">Partners</div>
        </div>
        <div class="flex-1 h-1 bg-gray-200 mx-4">
          <div :class="['h-full bg-blue-500 transition-all', step >= 3 ? 'w-full' : 'w-0']"></div>
        </div>
        <div class="flex items-center space-x-4">
          <div :class="['flex items-center justify-center w-10 h-10 rounded-full', step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500']">
            3
          </div>
          <div class="text-sm font-medium">Scan Items</div>
        </div>
      </div>
    </div>

    <!-- Step 1: Transaction Metadata -->
    <div v-if="step === 1" class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Transaction Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">PO Number *</label>
          <input
            v-model="metadata.poNumber"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Document Number</label>
          <input
            v-model="metadata.delDocumentNumber"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
          <input
            v-model="metadata.transactionDate"
            type="text"
            placeholder="MM/DD/YYYY"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Shipment Date</label>
          <input
            v-model="metadata.shipmentDate"
            type="text"
            placeholder="MM/DD/YYYY"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Direct Purchase</label>
          <select
            v-model="metadata.directPurchase"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <button
          @click="nextStep"
          class="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
        >
          Next: Select Partners
        </button>
      </div>
    </div>

    <!-- Step 2: Partner Selection -->
    <div v-if="step === 2" class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Partner Selection</h2>
      <p class="text-sm text-gray-600 mb-4">All partner fields are required</p>

      <!-- Warning if partners not configured -->
      <div v-if="partners.soldBy.length === 0 || partners.soldTo.length === 0 || partners.shipFrom.length === 0 || partners.shipTo.length === 0" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="text-sm text-yellow-800">
          <strong>Warning:</strong> You need to configure all partner types (Sold By, Sold To, Ship From, Ship To) before proceeding. Please go to the "Manage Partners" tab to add them.
        </p>
      </div>

      <div class="space-y-6">
        <!-- Sold By -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sold By *</label>
          <select
            v-model="selectedPartners.soldBy"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            :disabled="partners.soldBy.length === 0"
          >
            <option :value="null" disabled>{{ partners.soldBy.length === 0 ? '-- No partners configured --' : '-- Select a partner --' }}</option>
            <option v-for="(partner, index) in partners.soldBy" :key="index" :value="index">
              {{ partner.name }} (GLN: {{ partner.gln }})
            </option>
          </select>
        </div>

        <!-- Sold To -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sold To *</label>
          <select
            v-model="selectedPartners.soldTo"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            :disabled="partners.soldTo.length === 0"
          >
            <option :value="null" disabled>{{ partners.soldTo.length === 0 ? '-- No partners configured --' : '-- Select a partner --' }}</option>
            <option v-for="(partner, index) in partners.soldTo" :key="index" :value="index">
              {{ partner.name }} (GLN: {{ partner.gln }})
            </option>
          </select>
        </div>

        <!-- Ship From -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Ship From *</label>
          <select
            v-model="selectedPartners.shipFrom"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            :disabled="partners.shipFrom.length === 0"
          >
            <option :value="null" disabled>{{ partners.shipFrom.length === 0 ? '-- No partners configured --' : '-- Select a partner --' }}</option>
            <option v-for="(partner, index) in partners.shipFrom" :key="index" :value="index">
              {{ partner.name }} (GLN: {{ partner.gln }})
            </option>
          </select>
        </div>

        <!-- Ship To -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Ship To *</label>
          <select
            v-model="selectedPartners.shipTo"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            :disabled="partners.shipTo.length === 0"
          >
            <option :value="null" disabled>{{ partners.shipTo.length === 0 ? '-- No partners configured --' : '-- Select a partner --' }}</option>
            <option v-for="(partner, index) in partners.shipTo" :key="index" :value="index">
              {{ partner.name }} (GLN: {{ partner.gln }})
            </option>
          </select>
        </div>
      </div>
      <div class="mt-6 flex justify-between">
        <button
          @click="prevStep"
          class="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          @click="nextStep"
          class="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
        >
          Start Scanning
        </button>
      </div>
    </div>

    <!-- Step 3: Scanning -->
    <div v-if="step === 3" class="space-y-6">
      <!-- Scan Input -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Scan Barcodes</h2>
        <p class="text-sm text-gray-600 mb-4">
          Scan barcodes or paste barcode data. Products will be auto-detected by GTIN.
        </p>
        <div class="flex space-x-4">
          <input
            v-model="barcodeInput"
            @keyup.enter="handleScan"
            type="text"
            placeholder="Scan barcode..."
            class="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            autofocus
          />
          <button
            @click="handleScan"
            class="px-6 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Item
          </button>
        </div>
        <div class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Total items scanned: <span class="font-bold text-blue-600">{{ currentItemCount }}</span>
          </div>
          <div class="space-x-2">
            <button
              @click="exportCSV"
              :disabled="scannedItems.length === 0"
              :class="[
                'px-4 py-2 font-medium rounded-md transition-colors',
                scannedItems.length > 0
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              Export CSV
            </button>
            <button
              @click="resetScanner"
              class="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Scanned Items List -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Scanned Items</h3>
        <div v-if="scannedItems.length === 0" class="text-center py-8 text-gray-500">
          No items scanned yet. Start scanning barcodes above.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(item, index) in scannedItems"
            :key="index"
            class="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ item.productDescription }}</div>
              <div class="mt-1 text-sm text-gray-600 space-y-1">
                <div><span class="font-medium">GTIN:</span> {{ item.gtin }}</div>
                <div><span class="font-medium">NDC:</span> {{ item.ndc }}</div>
                <div><span class="font-medium">Lot:</span> {{ item.lot || 'N/A' }}</div>
                <div><span class="font-medium">Serial:</span> {{ item.serial || 'N/A' }}</div>
                <div><span class="font-medium">Expiration:</span> {{ item.expiration || 'N/A' }}</div>
              </div>
            </div>
            <button
              @click="removeItem(index)"
              class="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Product Modal -->
    <div
      v-if="showProductForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="cancelNewProduct"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-xl font-bold text-gray-900 mb-4">New Product Detected</h3>
        <p class="text-sm text-gray-600 mb-4">GTIN: {{ newProduct.gtin }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">NDC *</label>
            <input
              v-model="newProduct.ndc"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Proprietary Name *</label>
            <input
              v-model="newProduct.proprietaryName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Strength *</label>
              <input
                v-model="newProduct.strength"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Dosage Form *</label>
              <input
                v-model="newProduct.dosageForm"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Container Size *</label>
              <input
                v-model="newProduct.containerSize"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Manufacturer *</label>
              <input
                v-model="newProduct.manufacturer"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <!-- Auto-generated Product Description -->
          <div v-if="generatedProductDescription" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <label class="block text-sm font-medium text-blue-900 mb-2">Product Description (Auto-generated)</label>
            <p class="text-blue-800 font-medium">{{ generatedProductDescription }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="cancelNewProduct"
            class="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveNewProduct"
            class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Save & Add Item
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
