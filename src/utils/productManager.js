/**
 * Product Manager
 * Manage product mappings using Supabase
 */
import { supabase } from './supabaseClient.js'

export class ProductManager {
  constructor() {
    this.products = []
    this.loaded = false
  }

  /**
   * Load product mappings from Supabase
   */
  async loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      this.products = data.map(row => ({
        gtin: row.gtin,
        ndc: row.ndc,
        productDescription: row.product_description,
        proprietaryName: row.proprietary_name,
        strength: row.strength,
        dosageForm: row.dosage_form,
        containerSize: row.container_size,
        manufacturer: row.manufacturer
      }))

      this.loaded = true
      return this.products
    } catch (error) {
      console.error('Error loading products from Supabase:', error)
      throw error
    }
  }

  /**
   * Save product mappings (no-op for Supabase, kept for compatibility)
   */
  saveProducts() {
    // No-op: Supabase handles persistence automatically
  }

  /**
   * Add or update a product mapping
   * @param {Object} productData - Product information
   */
  async addProduct({
    gtin,
    ndc,
    productDescription,
    proprietaryName = '',
    strength = '',
    dosageForm = '',
    containerSize = '',
    manufacturer = ''
  }) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          gtin,
          ndc,
          product_description: productDescription,
          proprietary_name: proprietaryName,
          strength,
          dosage_form: dosageForm,
          container_size: containerSize,
          manufacturer
        }, { onConflict: 'gtin' })

      if (error) throw error

      // Reload products after adding
      await this.loadProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  /**
   * Remove a product
   * @param {number} index - Index in the product list
   */
  async removeProduct(index) {
    try {
      if (index >= 0 && index < this.products.length) {
        const product = this.products[index]
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('gtin', product.gtin)

        if (error) throw error

        // Reload products after deleting
        await this.loadProducts()
        return true
      }
      return false
    } catch (error) {
      console.error('Error removing product:', error)
      throw error
    }
  }

  /**
   * Remove a product by GTIN
   * @param {string} gtin - Product GTIN
   */
  async removeProductByGtin(gtin) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('gtin', gtin)

      if (error) throw error

      // Reload products after deleting
      await this.loadProducts()
      return true
    } catch (error) {
      console.error('Error removing product:', error)
      throw error
    }
  }

  /**
   * List all products
   * @returns {Array} Products list
   */
  listProducts() {
    return this.products
  }

  /**
   * Get product by index in list
   * @param {number} index - Index in the product list
   * @returns {Object|null} Product object or null
   */
  getProductByIndex(index) {
    if (index >= 0 && index < this.products.length) {
      return this.products[index]
    }
    return null
  }

  /**
   * Get product by GTIN
   * @param {string} gtin - Product GTIN
   * @returns {Object|null} Product object or null
   */
  async getProductByGtin(gtin) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('gtin', gtin)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        throw error
      }

      return {
        gtin: data.gtin,
        ndc: data.ndc,
        productDescription: data.product_description,
        proprietaryName: data.proprietary_name,
        strength: data.strength,
        dosageForm: data.dosage_form,
        containerSize: data.container_size,
        manufacturer: data.manufacturer
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  /**
   * Search products by query
   * @param {string} query - Search query
   * @returns {Array} Matching products
   */
  searchProducts(query) {
    if (!query) return this.products

    const lowerQuery = query.toLowerCase()
    return this.products.filter(p =>
      p.gtin?.toLowerCase().includes(lowerQuery) ||
      p.ndc?.toLowerCase().includes(lowerQuery) ||
      p.productDescription?.toLowerCase().includes(lowerQuery) ||
      p.proprietaryName?.toLowerCase().includes(lowerQuery) ||
      p.manufacturer?.toLowerCase().includes(lowerQuery)
    )
  }
}
