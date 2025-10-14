/**
 * Partner Manager
 * Manage partner to GLN mappings using Supabase
 */
import { supabase } from './supabaseClient.js'

export class PartnerManager {
  constructor() {
    this.partners = {}
    this.loaded = false
  }

  /**
   * Load partner mappings from Supabase
   */
  async loadPartners() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('role', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Group by role
      this.partners = {}
      data.forEach(row => {
        if (!this.partners[row.role]) {
          this.partners[row.role] = []
        }
        this.partners[row.role].push({
          id: row.id,
          name: row.name,
          gln: row.gln
        })
      })

      this.loaded = true
      return this.partners
    } catch (error) {
      console.error('Error loading partners from Supabase:', error)
      throw error
    }
  }

  /**
   * Add or update a partner mapping
   * @param {string} role - 'sold_by', 'sold_to', 'ship_from', 'ship_to'
   * @param {string} name - Partner name
   * @param {string} gln - Partner GLN
   */
  async addPartner(role, name, gln) {
    try {
      const { error } = await supabase
        .from('partners')
        .upsert({ role, name, gln }, { onConflict: 'role,gln' })

      if (error) throw error

      // Reload partners after adding
      await this.loadPartners()
    } catch (error) {
      console.error('Error adding partner:', error)
      throw error
    }
  }

  /**
   * Remove a partner
   * @param {string} role - Partner role
   * @param {number} index - Index in the role's partner list
   */
  async removePartner(role, index) {
    try {
      const partners = this.partners[role] || []
      if (index >= 0 && index < partners.length) {
        const partner = partners[index]
        if (partner.id) {
          const { error } = await supabase
            .from('partners')
            .delete()
            .eq('id', partner.id)

          if (error) throw error

          // Reload partners after deleting
          await this.loadPartners()
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error removing partner:', error)
      throw error
    }
  }

  /**
   * List all partners for a role
   * @param {string} role - Optional role to filter by
   * @returns {Array|Object} Partners list or all partners
   */
  listPartners(role = null) {
    if (role) {
      return this.partners[role] || []
    }
    return this.partners
  }

  /**
   * Get partner by index in list
   * @param {string} role - Partner role
   * @param {number} index - Index in the partner list
   * @returns {Object|null} Partner object or null
   */
  getPartnerByIndex(role, index) {
    const partners = this.partners[role] || []
    if (index >= 0 && index < partners.length) {
      return partners[index]
    }
    return null
  }

  /**
   * Get all partner roles
   * @returns {Array} List of roles with partners
   */
  getRoles() {
    return Object.keys(this.partners)
  }
}
