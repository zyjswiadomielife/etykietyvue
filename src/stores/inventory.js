import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const currentProduct = ref(null)
  const scanForm = ref({
    ean: '',
    quantity: null
  })
  const inventoryData = ref(null)

  const fetchActiveInventory = async () => {
    try {
      const response = await axios.get('/inventory/active-inventory')
      inventoryData.value = response.data
      return response.data
    } catch (error) {
      console.error('Błąd podczas pobierania aktywnej inwentaryzacji:', error)
      throw error
    }
  }

  const fetchProductByEan = async (ean) => {
    try {
      const response = await axios.get(`/labels/product/${ean}`)
      currentProduct.value = response.data
      scanForm.value.ean = ean
      return response.data
    } catch (error) {
      console.error('Błąd podczas pobierania produktu:', error)
      throw error
    }
  }

  const saveProduct = async () => {
    if (!currentProduct.value || !scanForm.value.quantity) return
    
    try {
      const params = new URLSearchParams({
        ean: scanForm.value.ean,
        quantity: scanForm.value.quantity,
        device_name: navigator.userAgent.substring(0, 50)
      })

      const response = await axios.post(
        `/inventory/inventory/${inventoryData.value.inventory_id}/scan?${params.toString()}`
      )
      
      // Wyczyść formularz
      scanForm.value.ean = ''
      scanForm.value.quantity = null
      currentProduct.value = null
      
      // Odśwież podsumowanie
      await fetchSummary()
      
      // Zawsze zwracamy obiekt z success i message
      return { 
        success: true, 
        message: response.data.message || 'Produkt został dodany do inwentaryzacji' 
      }
    } catch (error) {
      console.error('Błąd zapisywania:', error)
      // W przypadku błędu też zwracamy obiekt, ale z success: false
      return {
        success: false,
        message: error.response?.data?.error || error.message
      }
    }
  }

  const fetchSummary = async () => {
    if (!inventoryData.value?.inventory_id) return
    
    try {
      const response = await axios.get(`/inventory/${inventoryData.value.inventory_id}/summary`)
      return response.data
    } catch (error) {
      console.error('Błąd podczas pobierania podsumowania:', error)
      throw error
    }
  }

  const completeInventory = async (inventoryId) => {
    try {
      const response = await axios.post(`/inventory/inventory/${inventoryId}/complete`)
      return response.data
    } catch (error) {
      console.error('Błąd podczas kończenia inwentaryzacji:', error)
      throw error
    }
  }

  return {
    currentProduct,
    scanForm,
    inventoryData,
    fetchProductByEan,
    saveProduct,
    fetchSummary,
    fetchActiveInventory,
    completeInventory
  }
}) 