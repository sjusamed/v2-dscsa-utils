<script setup>
import { ref } from 'vue'
import { supabase } from '../utils/supabaseClient'

const emit = defineEmits(['complete'])

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(false)

async function handleResetPassword() {
  error.value = null

  // Validate passwords
  if (!newPassword.value || !confirmPassword.value) {
    error.value = 'Please enter both password fields'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (updateError) throw updateError

    success.value = true

    // Wait 2 seconds then emit complete
    setTimeout(() => {
      emit('complete')
    }, 2000)
  } catch (err) {
    console.error('Password update error:', err)
    error.value = err.message || 'Failed to update password'
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
        <p class="text-sm text-gray-600">Choose a strong password for your account</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <p class="text-sm text-green-800 text-center">
          ✓ Password updated successfully! Redirecting...
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error && !success" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <!-- Reset Password Form -->
      <form v-if="!success" @submit.prevent="handleResetPassword" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter new password"
          />
          <p class="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Updating Password...' : 'Update Password' }}
        </button>
      </form>
    </div>
  </div>
</template>
