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
    const ean = scanForm.value.ean
    const quantity = Number(scanForm.value.quantity)
    
    console.log('Rozpoczynam zapisywanie produktu:', {
      inventoryId: inventoryData.value?.inventory_id,
      ean,
      quantity,
      rawQuantity: scanForm.value.quantity,
      isValidNumber: !isNaN(quantity) && quantity > 0,
      scanFormComplete: {...scanForm.value},
      currentProduct: currentProduct.value ? {...currentProduct.value} : null
    })
    
    if (!currentProduct.value || isNaN(quantity) || quantity <= 0) {
      console.warn('Brak wymaganych danych:', {
        hasProduct: !!currentProduct.value,
        quantity: quantity,
        rawQuantity: scanForm.value.quantity,
        isValidNumber: !isNaN(quantity) && quantity > 0
      })
      return {
        success: false,
        message: 'Brak produktu lub nieprawidłowa ilość'
      }
    }

    if (!inventoryData.value?.inventory_id) {
      return {
        success: false,
        message: 'Brak aktywnej inwentaryzacji'
      }
    }
    
    try {
      const params = new URLSearchParams({
        ean: ean,
        quantity: quantity.toString(),
        device_name: navigator.userAgent.substring(0, 50)
      })

      console.log('Wysyłam żądanie z parametrami:', Object.fromEntries(params))

      const response = await axios.post(
        `/inventory/inventory/${inventoryData.value.inventory_id}/scan?${params.toString()}`
      )
      
      if (response.data.error) {
        return {
          success: false,
          message: response.data.error
        }
      }
      
      // Czyścimy formularz tylko jeśli zapis się powiódł
      scanForm.value = {
        ean: '',
        quantity: null
      }
      currentProduct.value = null
      
      return { 
        success: true, 
        message: response.data.message || 'Produkt został dodany do inwentaryzacji' 
      }
    } catch (error) {
      console.error('Błąd zapisywania:', error, {
        config: error.config,
        response: error.response?.data
      })
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Wystąpił nieznany błąd'
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