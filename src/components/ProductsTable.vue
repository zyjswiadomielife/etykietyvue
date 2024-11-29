<template>
  <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <div class="p-4 bg-white dark:bg-gray-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Zaznaczono: {{ store.selectedProducts.size }}
          </span>
        </div>

      </div>
    </div>

    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="p-4">
            <div class="flex items-center">
              <input 
                id="checkbox-all" 
                type="checkbox" 
                :checked="allSelected"
                @change="handleSelectAll"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
            </div>
          </th>
          <th scope="col" class="px-6 py-3">
            Nazwa produktu
          </th>
          <th scope="col" class="px-6 py-3">
            Ean
          </th>
          <th scope="col" class="px-6 py-3">
            Cena
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in store.displayedProducts" 
            :key="product.id" 
            :class="[
              'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
              store.selectedProducts.has(product.id) ? 'bg-blue-50 dark:bg-blue-900' : ''
            ]"
        >
          <td class="w-4 p-4">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                :checked="store.selectedProducts.has(product.id)"
                @change="store.toggleProductSelection(product.id)"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
            </div>
          </td>
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
            {{ product.name }}
          </th>
          <td class="px-6 py-4">
            {{ product.ean }}
          </td>
          <td class="px-6 py-4">
            {{ product.price }} zł
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useProductStore } from '@/stores/products'

const store = useProductStore()
const barcodeBuffer = ref('')
const lastKeyTime = ref(0)
const BARCODE_DELAY = 50 // ms między znakami ze skanera

const allSelected = computed(() => {
  return store.products.length > 0 && 
         store.products.every(product => store.selectedProducts.has(product.id))
})

const handleSelectAll = (event) => {
  store.toggleAllProducts(event.target.checked)
}

// Zmodyfikowana obsługa skanera kodów kreskowych
const handleBarcodeScan = async (event) => {
  const currentTime = new Date().getTime()
  
  // Jeśli przerwa między znakami jest większa niż BARCODE_DELAY, 
  // rozpocznij nowy kod kreskowy
  if (currentTime - lastKeyTime.value > BARCODE_DELAY) {
    barcodeBuffer.value = ''
  }
  
  // Aktualizuj czas ostatniego znaku
  lastKeyTime.value = currentTime

  // Dodaj znak do bufora
  if (event.key !== 'Enter') {
    barcodeBuffer.value += event.key
  } else {
    await store.fetchProductByEan(barcodeBuffer.value)
    barcodeBuffer.value = '' // Wyczyść bufor po zeskanowaniu
  }
}

// Nasłuchuj zdarzeń skanera w całym komponencie
onMounted(() => {
  store.fetchProducts()
  window.addEventListener('keypress', handleBarcodeScan)
})

onUnmounted(() => {
  window.removeEventListener('keypress', handleBarcodeScan)
})
</script>