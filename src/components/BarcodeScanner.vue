<template>
  <div>
    <button 
      @click="toggleScanner"
      class="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
    >
      {{ isScanning ? 'Zatrzymaj' : 'Skanuj kamerą' }}
    </button>
    
    <div v-if="isScanning" class="mt-4">
      <div id="reader"></div>
      <p v-if="lastScanned" class="mt-2 text-sm text-gray-600">
        Ostatnio zeskanowano: {{ lastScanned }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useProductStore } from '@/stores/products'

const store = useProductStore()
const isScanning = ref(false)
const lastScanned = ref('')
let html5QrcodeScanner = null

const onScanSuccess = async (decodedText, decodedResult) => {
  console.log(`Zeskanowano kod: ${decodedText}`, decodedResult)
  lastScanned.value = decodedText
  await store.fetchProductByEan(decodedText)
}

const onScanFailure = (error) => {
  // Ignorujemy błędy skanowania
}

const toggleScanner = () => {
  isScanning.value = !isScanning.value
  
  if (isScanning.value) {
    html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ 'EAN_13' ]
      },
      false
    )
    html5QrcodeScanner.render(onScanSuccess, onScanFailure)
  } else {
    if (html5QrcodeScanner) {
      html5QrcodeScanner.clear()
      html5QrcodeScanner = null
    }
  }
}

onUnmounted(() => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear()
  }
})
</script>
<style scoped>
#reader {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
</style>
