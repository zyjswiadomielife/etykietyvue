<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h1 class="text-2xl font-semibold text-gray-800">
        Lista inwentaryzacji
      </h1>
      
      <!-- Przycisk nowej inwentaryzacji -->
      <button
        @click="createNewInventory"
        class="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Rozpocznij nową inwentaryzację
      </button>
    </div>

    <!-- Lista inwentaryzacji -->
    <div class="bg-white rounded-lg shadow-sm p-4">
      <div v-if="loading" class="text-center py-4">
        Ładowanie...
      </div>
      
      <div v-else-if="inventories.length === 0" class="text-center py-4 text-gray-500">
        Brak aktywnych inwentaryzacji
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="inventory in inventories"
          :key="inventory.id"
          class="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
          @click="goToInventory(inventory.id)"
        >
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-medium">{{ inventory.name }}</h3>
              <p class="text-sm text-gray-600">
                Utworzono: {{ new Date(inventory.created_at).toLocaleDateString() }}
              </p>
            </div>
            <div class="text-sm text-gray-500">
              Produktów: {{ inventory.total_items || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'

const router = useRouter()
const inventoryStore = useInventoryStore()
const inventories = ref([])
const loading = ref(true)

// Pobieranie aktywnej inwentaryzacji zamiast listy
const fetchActiveInventory = async () => {
  try {
    loading.value = true
    const activeInventory = await inventoryStore.fetchActiveInventory()
    if (activeInventory) {
      router.push({ 
        name: 'inventory-details', 
        params: { id: activeInventory.inventory_id }
      })
    }
  } catch (error) {
    console.error('Błąd podczas pobierania aktywnej inwentaryzacji:', error)
    alert('Nie udało się pobrać aktywnej inwentaryzacji')
  } finally {
    loading.value = false
  }
}

// Tworzenie nowej inwentaryzacji
const createNewInventory = async () => {
  try {
    const newInventory = await inventoryStore.createInventory()
    router.push({ 
      name: 'inventory-details', 
      params: { id: newInventory.id }
    })
  } catch (error) {
    console.error('Błąd podczas tworzenia:', error)
    alert('Nie udało się utworzyć nowej inwentaryzacji')
  }
}

// Przejście do szczegółów inwentaryzacji
const goToInventory = (id) => {
  router.push({ 
    name: 'inventory-details', 
    params: { id }
  })
}

onMounted(() => {
  fetchActiveInventory()
})
</script> 