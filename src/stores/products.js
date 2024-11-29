import { defineStore } from 'pinia'
import axios from 'axios'

// Dodaj interceptor do obsługi błędów
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Obsługa wygaśnięcia sesji
      console.error('Sesja wygasła')
      // Tu możesz dodać logikę odświeżania tokenu lub przekierowania do logowania
    }
    return Promise.reject(error)
  }
)

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    selectedProducts: new Set(JSON.parse(localStorage.getItem('selectedProducts') || '[]')),
    searchQuery: '',
    showingSelected: false,
    allProductsMap: new Map()
  }),
  
  getters: {
    displayedProducts: (state) => {
      if (state.showingSelected) {
        return Array.from(state.selectedProducts)
          .map(id => state.allProductsMap.get(id))
          .filter(Boolean)
      }
      return state.products
    }
  },

  actions: {
    async fetchProducts(query = '') {
      try {
        console.log('Fetching products with query:', query)
        const response = await axios.get(`/labels/products?query=${query}`)
        this.products = response.data
        this.products.forEach(product => {
          this.allProductsMap.set(product.id, product)
        })
      } catch (error) {
        console.error('Błąd podczas pobierania produktów:', error)
      }
    },

    async fetchProductByEan(ean) {
      if (!ean) {
        console.warn('Próba pobrania produktu bez podania EAN')
        throw new Error('Brak kodu EAN')
      }
      
      try {
        console.log('Pobieranie produktu dla EAN:', ean)
        const response = await axios.get(`/labels/product/${ean}`)
        const product = response.data
        
        console.log('Otrzymano produkt:', product)
        
        this.allProductsMap.set(product.id, product)
        
        if (!this.products.find(p => p.id === product.id)) {
          this.products.unshift(product)
        }
        
        this.selectedProducts.add(product.id)
        return product
      } catch (error) {
        console.error('Błąd podczas pobierania produktu:', error)
        throw error
      }
    },

    toggleProductSelection(productId) {
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId)
      } else {
        this.selectedProducts.add(productId)
      }
      localStorage.setItem('selectedProducts', JSON.stringify(Array.from(this.selectedProducts)))
    },

    toggleAllProducts(selected) {
      if (selected) {
        this.products.forEach(product => this.selectedProducts.add(product.id))
      } else {
        this.selectedProducts.clear()
      }
      localStorage.setItem('selectedProducts', JSON.stringify(Array.from(this.selectedProducts)))
    },

    toggleShowSelected() {
      this.showingSelected = !this.showingSelected
    },

    async restoreSelectedProducts() {
      console.log('Przywracanie wybranych produktów...')
      const selectedIds = Array.from(this.selectedProducts)
      console.log('Znalezione ID w localStorage:', selectedIds)

      for (const id of selectedIds) {
        if (!this.allProductsMap.has(id)) {
          try {
            const response = await axios.get(`/labels/product/${id}`)
            const product = response.data
            console.log('Przywrócono produkt:', product)
            
            this.allProductsMap.set(product.id, product)
            if (!this.products.find(p => p.id === product.id)) {
              this.products.unshift(product)
            }
          } catch (error) {
            console.error(`Nie udało się przywrócić produktu o ID ${id}:`, error)
            // Opcjonalnie: usuń ID z selectedProducts jeśli produkt już nie istnieje
            this.selectedProducts.delete(id)
            localStorage.setItem('selectedProducts', JSON.stringify(Array.from(this.selectedProducts)))
          }
        }
      }
    }
  }
})