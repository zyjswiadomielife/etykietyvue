// InventoryView.vue
<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <!-- Nagłówek -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h1 class="text-2xl font-semibold text-gray-800">
        Inwentaryzacja {{ inventoryData?.name }}
      </h1>
      <div class="mt-2 text-gray-600">
        Zeskanowane produkty: {{ summary.total_items || 0 }}
      </div>
    </div>

    <!-- Formularz skanowania -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Kod kreskowy</label>
          <input
            v-model="scanForm.ean"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Zeskanuj lub wpisz kod"
            @keyup.enter="findProduct"
          >
        </div>
        
        <div v-if="currentProduct">
          <div class="text-sm text-gray-600 mb-2">
            Produkt: {{ currentProduct.name }}
          </div>
          <label class="block text-sm font-medium text-gray-700">Ilość</label>
          <input
            v-model.number="scanForm.quantity"
            type="number"
            step="0.01"
            min="0"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            @keyup.enter="saveProduct"
          >
        </div>

        <button
          @click="saveProduct"
          :disabled="!currentProduct || !scanForm.quantity"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Zapisz
        </button>
      </div>
    </div>

    <!-- Przycisk włączania/wyłączania skanera -->
    <div class="mb-4">
      <button 
        @click="toggleScanner"
        class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        {{ isScannerActive ? 'Wyłącz skaner' : 'Włącz skaner' }}
      </button>
    </div>

    <!-- Komponent skanera -->
    <div v-if="isScannerActive" class="mb-4">
      <BarcodeScanner @scanned="handleScanned" />
    </div>

    <!-- Lista ostatnich skanów -->
    <div class="bg-white rounded-lg shadow-sm p-4">
      <h2 class="text-lg font-medium text-gray-800 mb-4">Ostatnie skany</h2>
      <div class="space-y-2">
        <div v-for="scan in summary.recent_scans" :key="scan.product_name + scan.scanned_at" 
             class="p-3 bg-gray-50 rounded-md">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">{{ scan.product_name }}</div>
              <div class="text-sm text-gray-600">Ilość: {{ scan.quantity }}</div>
            </div>
            <div class="text-sm text-gray-500">
              {{ new Date(scan.scanned_at).toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import { useInventoryStore } from '@/stores/inventory'

const store = useInventoryStore()

// Używamy storeToRefs dla reaktywnych właściwości
const { currentProduct, inventoryData, scanForm: storeScanForm } = storeToRefs(store)

// Tworzymy lokalną kopię formularza
const scanForm = ref({
  ean: '',
  quantity: null
})

const summary = ref({
  total_items: 0,
  recent_scans: []
})
const isScannerActive = ref(false)

// Pobieranie lub tworzenie aktywnej inwentaryzacji
const initInventory = async () => {
  try {
    await store.fetchActiveInventory()
    await fetchSummary()
  } catch (error) {
    console.error('Błąd inicjalizacji:', error)
  }
}

// Pobieranie podsumowania
const fetchSummary = async () => {
  try {
    const summaryData = await store.fetchSummary()
    summary.value = summaryData
  } catch (error) {
    console.error('Błąd pobierania podsumowania:', error)
  }
}

// Wyszukiwanie produktu po kodzie EAN
const findProduct = async () => {
  console.log('Próba znalezienia produktu, EAN:', scanForm.value.ean)
  if (!scanForm.value.ean) return
  
  try {
    await store.fetchProductByEan(scanForm.value.ean)
    console.log('Znaleziony produkt:', currentProduct.value)
  } catch (error) {
    console.error('Błąd podczas szukania produktu:', error)
    alert('Nie znaleziono produktu')
  }
}

// Zapisywanie zeskanowanego produktu
const saveProduct = async () => {
  const quantity = Number(scanForm.value.quantity)
  
  console.log('Próba zapisania produktu z formularza:', {
    ean: scanForm.value.ean,
    quantity: quantity,
    rawQuantity: scanForm.value.quantity,
    isValidNumber: !isNaN(quantity) && quantity > 0,
    currentProduct: currentProduct.value ? {
      id: currentProduct.value.id,
      name: currentProduct.value.name,
      ean: currentProduct.value.ean
    } : null
  })
  
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    alert('Proszę wprowadzić prawidłową ilość')
    return
  }

  try {
    // Upewniamy się, że EAN jest zsynchronizowany
    storeScanForm.value = {
      ean: scanForm.value.ean,
      quantity: quantity
    }
    
    const result = await store.saveProduct()
    
    if (!result.success) {
      throw new Error(result.message)
    }
    
    // Czyścimy oba formularze
    scanForm.value = {
      ean: '',
      quantity: null
    }
    storeScanForm.value = {
      ean: '',
      quantity: null
    }
    await fetchSummary()
    console.log('Produkt zapisany pomyślnie')
  } catch (error) {
    console.error('Błąd zapisywania:', error)
    alert('Błąd podczas zapisywania: ' + error.message)
  }
}

const toggleScanner = () => {
  isScannerActive.value = !isScannerActive.value
}

const handleScanned = async (ean) => {
  try {
    console.log('Zeskanowano kod:', ean)
    // Najpierw ustawiamy EAN w lokalnym formularzu
    scanForm.value.ean = ean
    
    await store.fetchProductByEan(ean)
    console.log('Pobrany produkt:', currentProduct.value)
    
    // Synchronizujemy wartości między lokalnym formularzem a store'm
    storeScanForm.value.ean = ean
    scanForm.value.quantity = null // Resetujemy ilość
    
    // Po zeskanowaniu automatycznie fokusujemy pole z ilością
    const quantityInput = document.querySelector('input[type="number"]')
    if (quantityInput) {
      quantityInput.focus()
    }
  } catch (error) {
    console.error('Błąd podczas skanowania:', error)
    alert('Błąd podczas skanowania: ' + error.message)
  }
}

// Automatyczne odświeżanie co 30 sekund
let refreshInterval
onMounted(() => {
  initInventory()
  refreshInterval = setInterval(fetchSummary, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Dodajemy watch na currentProduct, aby synchronizować EAN
watch(currentProduct, (newProduct) => {
  if (newProduct) {
    console.log('Aktualizacja formularza po zmianie produktu:', {
      name: newProduct.name,
      ean: newProduct.ean
    })
    scanForm.value.ean = newProduct.ean
    storeScanForm.value.ean = newProduct.ean
  }
})
</script>