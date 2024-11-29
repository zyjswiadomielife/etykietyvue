<template>
  <div class="w-full max-w-5xl mx-auto">
    <div 
      ref="readerRef" 
      class="w-full mx-auto rounded-lg overflow-hidden"
      style="min-height: 400px; background-color: #000;"
    ></div>
    <div class="mt-4 space-y-2 p-4 bg-white rounded-lg shadow">
      <p v-if="scanStatus" class="text-sm" :class="statusColor">
        {{ scanStatus }}
      </p>
      <p v-if="lastScanned" class="text-sm text-gray-600">
        Ostatnio zeskanowano: {{ lastScanned }}
      </p>
      <p class="text-xs text-gray-500">
        Wspierane formaty: EAN-13, EAN-8, CODE-128, CODE-39, UPC-A, UPC-E
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onUnmounted, onMounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useProductStore } from '@/stores/products'

const store = useProductStore()
const isScanning = ref(false)
const lastScanned = ref('')
const scanStatus = ref('')
const readerRef = ref(null)
let html5QrCode = null

const statusColor = computed(() => {
  if (scanStatus.value.includes('Błąd')) return 'text-red-500'
  if (scanStatus.value.includes('Sukces')) return 'text-green-500'
  return 'text-gray-500'
})

const onScanSuccess = async (decodedText, decodedResult) => {
  console.log(`Zeskanowano kod:`, decodedText, decodedResult)
  lastScanned.value = decodedText
  scanStatus.value = `Sukces: Zeskanowano kod ${decodedText}`
  
  try {
    await store.fetchProductByEan(decodedText)
    scanStatus.value = `Sukces: Dodano produkt o kodzie ${decodedText}`
  } catch (error) {
    scanStatus.value = `Błąd: Nie udało się dodać produktu (${error.message})`
    console.error('Błąd podczas dodawania produktu:', error)
  }
}

const onScanFailure = (error) => {
  // Wyświetlamy błędy tylko jeśli nie są to standardowe błędy skanowania
  if (!error.includes('No QR code found') && 
      !error.includes('NotFoundException')) {
    scanStatus.value = `Błąd skanowania: ${error}`
    console.warn('Błąd skanowania:', error)
  }
}

const requestCameraPermission = async () => {
  try {
    console.log('Prośba o dostęp do kamery...')
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop()) // Zwalniamy strumień po sprawdzeniu
    console.log('Dostęp do kamery przyznany')
    return true
  } catch (err) {
    console.error('Błąd dostępu do kamery:', err)
    throw new Error('Brak dostępu do kamery. Sprawdź uprawnienia.')
  }
}

const startScanner = async () => {
  try {
    console.log('Rozpoczynam inicjalizację skanera')
    await nextTick()
    
    await requestCameraPermission()
    
    if (!readerRef.value) {
      throw new Error('Element reader nie istnieje')
    }

    const readerId = 'reader-' + Date.now()
    readerRef.value.id = readerId
    scanStatus.value = 'Inicjalizacja skanera...'
    console.log('Utworzono element z ID:', readerId)
    
    html5QrCode = new Html5Qrcode(readerId)
    console.log('Skaner utworzony, szukam kamer...')
    
    const devices = await Html5Qrcode.getCameras()
    console.log('Znalezione kamery:', devices)
    
    if (devices && devices.length) {
      scanStatus.value = 'Uruchamianie kamery...'
      console.log('Próba uruchomienia kamery...')
      
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              0x1, // EAN-13
              0x2, // EAN-8
              0x4, // CODE-128
              0x8, // CODE-39
              0x10, // UPC-A
              0x20  // UPC-E
            ],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          onScanSuccess,
          onScanFailure
        )
        console.log('Kamera uruchomiona pomyślnie')
        scanStatus.value = 'Skaner gotowy'
      } catch (startError) {
        console.error('Błąd podczas uruchamiania kamery:', startError)
        throw new Error(`Nie udało się uruchomić kamery: ${startError.message}`)
      }
    } else {
      throw new Error('Nie znaleziono żadnej kamery')
    }
  } catch (err) {
    scanStatus.value = `Błąd: ${err.message}`
    console.error("Błąd podczas inicjalizacji skanera:", err)
    isScanning.value = false
    
    if (html5QrCode) {
      try {
        await html5QrCode.stop()
        html5QrCode = null
      } catch (stopError) {
        console.error("Błąd podczas zatrzymywania skanera po błędzie:", stopError)
      }
    }
  }
}

const stopScanner = async () => {
  console.log('Próba zatrzymania skanera')
  if (html5QrCode) {
    try {
      scanStatus.value = 'Zatrzymywanie skanera...'
      await html5QrCode.stop()
      html5QrCode = null
      scanStatus.value = ''
      console.log('Skaner zatrzymany pomyślnie')
    } catch (err) {
      console.error("Błąd podczas zatrzymywania skanera:", err)
      scanStatus.value = `Błąd podczas zatrzymywania: ${err.message}`
    }
  }
}

const toggleScanner = async () => {
  try {
    if (!isScanning.value) {
      console.log('Włączanie skanera')
      isScanning.value = true
      await startScanner()
    } else {
      console.log('Wyłączanie skanera')
      await stopScanner()
      isScanning.value = false
    }
  } catch (err) {
    console.error('Błąd w toggleScanner:', err)
    isScanning.value = false
    scanStatus.value = `Błąd: ${err.message}`
  }
}

onMounted(async () => {
  console.log('BarcodeScanner mounted') // Debug log
  await startScanner()
})

onUnmounted(async () => {
  await stopScanner()
})
</script>
