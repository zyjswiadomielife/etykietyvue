import { defineStore } from 'pinia'
import axios from 'axios'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    selectedProducts: new Set(),
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
      try {
        const response = await axios.get(`/labels/product/${ean}`)
        const product = response.data
        
        this.allProductsMap.set(product.id, product)
        
        if (!this.products.find(p => p.id === product.id)) {
          this.products.unshift(product)
        }
        
        this.selectedProducts.add(product.id)
      } catch (error) {
        console.error('Błąd podczas pobierania produktu:', error)
      }
    },

    toggleProductSelection(productId) {
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId)
      } else {
        this.selectedProducts.add(productId)
      }
    },

    toggleAllProducts(selected) {
      if (selected) {
        this.products.forEach(product => this.selectedProducts.add(product.id))
      } else {
        this.selectedProducts.clear()
      }
    },

    toggleShowSelected() {
      this.showingSelected = !this.showingSelected
    }
  }
})