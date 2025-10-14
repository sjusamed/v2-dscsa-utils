<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ProductManager } from '../utils/productManager'

const productMgr = new ProductManager()

const products = ref([])
const searchQuery = ref('')
const showAddForm = ref(false)

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

const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value
  }
  return productMgr.searchProducts(searchQuery.value)
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

const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  await loadProducts()
})

async function loadProducts() {
  loading.value = true
  error.value = null
  try {
    await productMgr.loadProducts()
    products.value = productMgr.listProducts()
  } catch (err) {
    error.value = 'Failed to load products. Please check your connection and try again.'
    console.error('Load products error:', err)
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
  Object.keys(newProduct).forEach(key => {
    newProduct[key] = ''
  })
}

async function addProduct() {
  if (!newProduct.gtin || !newProduct.ndc || !newProduct.proprietaryName ||
      !newProduct.strength || !newProduct.dosageForm || !newProduct.containerSize ||
      !newProduct.manufacturer) {
    alert('All fields are required')
    return
  }

  loading.value = true
  try {
    await productMgr.addProduct({
      gtin: newProduct.gtin,
      ndc: newProduct.ndc,
      productDescription: generatedProductDescription.value,
      proprietaryName: newProduct.proprietaryName,
      strength: newProduct.strength,
      dosageForm: newProduct.dosageForm,
      containerSize: newProduct.containerSize,
      manufacturer: newProduct.manufacturer
    })

    await loadProducts()
    closeAddForm()
  } catch (err) {
    alert('Failed to add product. Please try again.')
    console.error('Add product error:', err)
  } finally {
    loading.value = false
  }
}

async function removeProduct(gtin) {
  const product = products.value.find(p => p.gtin === gtin)
  const confirmDelete = window.confirm(`Remove product "${product.productDescription}"?`)

  if (confirmDelete) {
    loading.value = true
    try {
      await productMgr.removeProductByGtin(gtin)
      await loadProducts()
    } catch (err) {
      alert('Failed to remove product. Please try again.')
      console.error('Remove product error:', err)
    } finally {
      loading.value = false
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Manage Products</h2>
        <p class="mt-1 text-sm text-gray-500">
          Add and manage product information for barcode scanning
        </p>
      </div>
      <button
        @click="openAddForm"
        :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add Product
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !error" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-sm text-gray-500">Loading products...</p>
    </div>

    <!-- Search -->
    <div class="bg-white shadow rounded-lg p-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products by GTIN, NDC, description, or manufacturer..."
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Products List -->
    <div class="bg-white shadow rounded-lg p-6">
      <div v-if="filteredProducts.length === 0" class="text-center py-8 text-gray-500">
        {{ searchQuery ? 'No products found' : 'No products added yet' }}
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="product in filteredProducts"
          :key="product.gtin"
          class="p-6 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900">{{ product.productDescription }}</h3>
              <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-medium text-gray-700">GTIN:</span>
                  <span class="ml-2 text-gray-600">{{ product.gtin }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">NDC:</span>
                  <span class="ml-2 text-gray-600">{{ product.ndc }}</span>
                </div>
                <div v-if="product.proprietaryName">
                  <span class="font-medium text-gray-700">Proprietary Name:</span>
                  <span class="ml-2 text-gray-600">{{ product.proprietaryName }}</span>
                </div>
                <div v-if="product.strength">
                  <span class="font-medium text-gray-700">Strength:</span>
                  <span class="ml-2 text-gray-600">{{ product.strength }}</span>
                </div>
                <div v-if="product.dosageForm">
                  <span class="font-medium text-gray-700">Dosage Form:</span>
                  <span class="ml-2 text-gray-600">{{ product.dosageForm }}</span>
                </div>
                <div v-if="product.containerSize">
                  <span class="font-medium text-gray-700">Container Size:</span>
                  <span class="ml-2 text-gray-600">{{ product.containerSize }}</span>
                </div>
                <div v-if="product.manufacturer">
                  <span class="font-medium text-gray-700">Manufacturer:</span>
                  <span class="ml-2 text-gray-600">{{ product.manufacturer }}</span>
                </div>
              </div>
            </div>
            <button
              @click="removeProduct(product.gtin)"
              class="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Product Modal -->
    <div
      v-if="showAddForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeAddForm"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Add New Product</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">GTIN *</label>
            <input
              v-model="newProduct.gtin"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
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
            @click="closeAddForm"
            class="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="addProduct"
            class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
