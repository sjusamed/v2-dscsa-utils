<script setup>
import { ref, reactive, onMounted } from 'vue'
import { PartnerManager } from '../utils/partnerManager'

const partnerMgr = new PartnerManager()

const partners = reactive({
  sold_by: [],
  sold_to: [],
  ship_from: [],
  ship_to: []
})

const loading = ref(false)
const error = ref(null)
const showAddForm = ref(false)
const newPartner = reactive({
  role: 'sold_by',
  name: '',
  gln: ''
})

const roleLabels = {
  sold_by: 'Sold By',
  sold_to: 'Sold To',
  ship_from: 'Ship From',
  ship_to: 'Ship To'
}

onMounted(async () => {
  await loadPartners()
})

async function loadPartners() {
  loading.value = true
  error.value = null
  try {
    await partnerMgr.loadPartners()
    partners.sold_by = partnerMgr.listPartners('sold_by')
    partners.sold_to = partnerMgr.listPartners('sold_to')
    partners.ship_from = partnerMgr.listPartners('ship_from')
    partners.ship_to = partnerMgr.listPartners('ship_to')
  } catch (err) {
    error.value = 'Failed to load partners. Please check your connection and try again.'
    console.error('Load partners error:', err)
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
  newPartner.role = 'sold_by'
  newPartner.name = ''
  newPartner.gln = ''
}

async function addPartner() {
  if (!newPartner.name || !newPartner.gln) {
    alert('Name and GLN are required')
    return
  }

  loading.value = true
  try {
    await partnerMgr.addPartner(newPartner.role, newPartner.name, newPartner.gln)
    await loadPartners()
    closeAddForm()
  } catch (err) {
    alert('Failed to add partner. Please try again.')
    console.error('Add partner error:', err)
  } finally {
    loading.value = false
  }
}

async function removePartner(role, index) {
  const partner = partners[role][index]
  const confirmDelete = window.confirm(`Remove partner "${partner.name}"?`)

  if (confirmDelete) {
    loading.value = true
    try {
      await partnerMgr.removePartner(role, index)
      await loadPartners()
    } catch (err) {
      alert('Failed to remove partner. Please try again.')
      console.error('Remove partner error:', err)
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
        <h2 class="text-2xl font-bold text-gray-900">Manage Partners</h2>
        <p class="mt-1 text-sm text-gray-500">
          Add and manage trading partners for DSCSA transactions
        </p>
      </div>
      <button
        @click="openAddForm"
        :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add Partner
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !error" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-sm text-gray-500">Loading partners...</p>
    </div>

    <!-- Partners List -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="(role, key) in roleLabels" :key="key" class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">{{ role }}</h3>
        <div v-if="partners[key].length === 0" class="text-center py-8 text-gray-500">
          No partners added yet
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(partner, index) in partners[key]"
            :key="index"
            class="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ partner.name }}</div>
              <div class="mt-1 text-sm text-gray-600">GLN: {{ partner.gln }}</div>
            </div>
            <button
              @click="removePartner(key, index)"
              class="ml-4 text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Partner Modal -->
    <div
      v-if="showAddForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeAddForm"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Add New Partner</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Partner Role</label>
            <select
              v-model="newPartner.role"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sold_by">Sold By</option>
              <option value="sold_to">Sold To</option>
              <option value="ship_from">Ship From</option>
              <option value="ship_to">Ship To</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Partner Name *</label>
            <input
              v-model="newPartner.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">GLN *</label>
            <input
              v-model="newPartner.gln"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
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
            @click="addPartner"
            class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Partner
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
