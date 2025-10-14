/**
 * API Client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

class APIError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = 'APIError'
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new APIError(error.error || 'Request failed', response.status)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(error.message || 'Network error', 0)
  }
}

export const api = {
  // Partners
  async getPartners() {
    return request('/api/partners')
  },

  async addPartner(role, name, gln) {
    return request('/api/partners', {
      method: 'POST',
      body: JSON.stringify({ role, name, gln })
    })
  },

  async deletePartner(id) {
    return request(`/api/partners/${id}`, {
      method: 'DELETE'
    })
  },

  // Products
  async getProducts() {
    return request('/api/products')
  },

  async getProductByGtin(gtin) {
    try {
      return await request(`/api/products/${gtin}`)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  },

  async addProduct(product) {
    return request('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    })
  },

  async deleteProduct(gtin) {
    return request(`/api/products/${gtin}`, {
      method: 'DELETE'
    })
  }
}

export default api
