<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './utils/supabaseClient'
import Login from './components/Login.vue'
import Scanner from './components/Scanner.vue'
import Partners from './components/Partners.vue'
import Products from './components/Products.vue'

const currentView = ref('scanner')
const user = ref(null)
const loading = ref(true)

const views = {
  scanner: { component: Scanner, title: 'Scan Items' },
  partners: { component: Partners, title: 'Manage Partners' },
  products: { component: Products, title: 'Manage Products' }
}

onMounted(async () => {
  // Check current session
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
  loading.value = false

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
})

function setView(view) {
  currentView.value = view
}

function handleLogin(loggedInUser) {
  user.value = loggedInUser
}

async function handleLogout() {
  const confirm = window.confirm('Are you sure you want to sign out?')
  if (!confirm) return

  await supabase.auth.signOut()
  user.value = null
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>

  <!-- Login Screen -->
  <Login v-else-if="!user" @login="handleLogin" />

  <!-- Main App (Authenticated) -->
  <div v-else class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              DSCSA Barcode Scanner
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              GS1 barcode scanning for DSCSA compliance
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">{{ user.email }}</span>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <button
            @click="setView('scanner')"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              currentView === 'scanner'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Scan Items
          </button>
          <button
            @click="setView('partners')"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              currentView === 'partners'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Manage Partners
          </button>
          <button
            @click="setView('products')"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              currentView === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Manage Products
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <component :is="views[currentView].component" />
    </main>
  </div>
</template>
