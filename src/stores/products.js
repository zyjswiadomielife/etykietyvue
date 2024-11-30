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
        this.saveSelectedToStorage()
        
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
      this.saveSelectedToStorage()
    },

    toggleAllProducts(selected) {
      if (selected) {
        this.products.forEach(product => this.selectedProducts.add(product.id))
      } else {
        this.selectedProducts.clear()
      }
      this.saveSelectedToStorage()
    },

    toggleShowSelected() {
      this.showingSelected = !this.showingSelected
    },

    async restoreSelectedProducts() {
      console.log('Przywracanie wybranych produktów...')
      const selectedIds = Array.from(this.selectedProducts)
      console.log('Znalezione ID w localStorage:', selectedIds)
      
      if (selectedIds.length === 0) {
        console.log('Brak zapisanych ID w localStorage')
        return
      }

      try {
        // Poprawiona ścieżka - usuwamy /api/ z początku
        console.log('Wysyłam zapytanie o produkty z ID:', selectedIds)
        const response = await axios.get('/labels/products/selected', {
          params: { ids: selectedIds.join(',') }
        })
        
        const products = response.data
        console.log('Pobrane produkty:', products)

        // Aktualizujemy store i allProductsMap
        products.forEach(product => {
          this.allProductsMap.set(product.id, product)
          if (!this.products.find(p => p.id === product.id)) {
            this.products.push(product) // lub unshift jeśli chcemy na początku
          }
        })

        // Dodajmy sprawdzenie czy produkty zostały prawidłowo dodane 
        console.log('Stan po przywróceniu:', {
          allProductsMap: Array.from(this.allProductsMap.entries()),
          products: this.products,
          selectedProducts: Array.from(this.selectedProducts)
        })
      } catch (error) {
        console.error('Błąd podczas przywracania produktów:', error, {
          url: error.config?.url,
          params: error.config?.params,
          response: error.response?.data
        })
      }
    },

    saveSelectedToStorage() {
      const selectedArray = Array.from(this.selectedProducts)
      console.log('Zapisuję do localStorage:', selectedArray)
      localStorage.setItem('selectedProducts', JSON.stringify(selectedArray))
    },

    async generatePDF() {
      try {
        console.log('Generowanie PDF dla wybranych produktów...')
        const selectedIds = Array.from(this.selectedProducts)
        
        if (selectedIds.length === 0) {
          throw new Error('Nie wybrano żadnych produktów')
        }

        const response = await axios.post('/labels/generate-pdf', {
          selected_products: selectedIds.join(',')
        }, {
          responseType: 'blob' // Ważne dla pobierania plików
        })

        // Utworzenie URL dla pobranego pliku
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        
        // Utworzenie tymczasowego linku do pobrania
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'etykiety_cenowe.pdf')
        document.body.appendChild(link)
        link.click()
        
        // Czyszczenie
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
        
        return true
      } catch (error) {
        console.error('Błąd podczas generowania PDF:', error)
        throw error
      }
    },

    clearSelected() {
      this.selectedProducts.clear()
      this.saveSelectedToStorage()
    }
  }
})