<script setup>
import { ref } from 'vue'
import { supabase } from '../utils/supabaseClient'

const emit = defineEmits(['login'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)
const message = ref(null)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  loading.value = true
  error.value = null

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (signInError) throw signInError

    // Emit login event to parent
    emit('login', data.user)
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }

  loading.value = true
  error.value = null
  message.value = null

  try {
    // Use current origin, but Supabase will use the Site URL configured in dashboard
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value)

    if (resetError) throw resetError

    message.value = 'Password reset email sent! Check your inbox.'
  } catch (err) {
    console.error('Password reset error:', err)
    error.value = err.message || 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">DSCSA Web Scanner</h1>
        <p class="text-sm text-gray-600">Sign in to continue</p>
      </div>

      <!-- Success Message -->
      <div v-if="message" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <p class="text-sm text-green-800">{{ message }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Forgot Password -->
      <div class="mt-4 text-center">
        <button
          @click="handleForgotPassword"
          :disabled="loading"
          class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Forgot password?
        </button>
      </div>

      <!-- Footer Note -->
      <div class="mt-6 p-4 bg-gray-50 rounded-md">
        <p class="text-xs text-gray-600 text-center">
          This is an internal tool. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  </div>
</template>
