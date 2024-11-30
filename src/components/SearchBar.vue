<template>
  <div class="max-w-5xl mx-auto pt-10 pb-10">
    <form @submit="handleSearch" class="mb-4">   
      <label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Szukaj</label>
      <div class="relative">
        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          v-model="searchQuery"
          type="search" 
          id="default-search" 
          @input="handleInput" 
          class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="Szukaj po nazwie lub ean" 
          :disabled="store.showingSelected"
        />
        <button 
          type="submit" 
          class="text-white absolute end-2.5 bottom-2.5 bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          :disabled="store.showingSelected"
        >
          Szukaj
        </button>
      </div>
    </form>

    <div class="flex justify-end gap-2">
      <button 
        @click="toggleScanner"
        class="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        {{ isScannerActive ? 'Zatrzymaj skaner' : 'Skanuj kamerą' }}
      </button>
      <button 
        @click="store.toggleShowSelected"
        class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        {{ store.showingSelected ? 'Pokaż wszystkie' : `Wybrane (${store.selectedProducts.size})` }}
      </button>
      <button 
        v-if="store.selectedProducts.size > 0"
        @click="handleGeneratePDF"
        :disabled="isGeneratingPDF"
        class="text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        <span v-if="isGeneratingPDF">Generowanie...</span>
        <span v-else>Generuj PDF</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/products'

const store = useProductStore()
const searchQuery = ref('')
const debounceTimeout = ref(null)
const isScannerActive = ref(false)
const isGeneratingPDF = ref(false)

const handleSearch = async (e) => {
  e.preventDefault()
  if (!store.showingSelected) {
    await store.fetchProducts(searchQuery.value)
  }
}

const handleInput = () => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  
  debounceTimeout.value = setTimeout(async () => {
    if (!store.showingSelected && searchQuery.value) {
      await store.fetchProducts(searchQuery.value)
    }
  }, 500)
}

const toggleScanner = () => {
  if (!isScannerActive.value) {
    store.showingSelected = false
  }
  isScannerActive.value = !isScannerActive.value
  console.log('Scanner active:', isScannerActive.value)
}

const handleGeneratePDF = async () => {
  if (isGeneratingPDF.value) return
  
  isGeneratingPDF.value = true
  try {
    await store.generatePDF()
  } catch (error) {
    alert('Wystąpił błąd podczas generowania PDF: ' + error.message)
  } finally {
    isGeneratingPDF.value = false
  }
}

watch(() => store.showingSelected, (newVal) => {
  if (newVal && isScannerActive.value) {
    isScannerActive.value = false
  }
})

defineExpose({ isScannerActive })
</script>