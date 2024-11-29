<script setup>
import { ref, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import ProductsTable from '@/components/ProductsTable.vue'

const searchBar = ref(null)

// Debug log
onMounted(() => {
  console.log('SearchBar ref:', searchBar.value)
})
</script>

<template>
    <div class="container mx-auto max-w-5xl p-4">
        <SearchBar ref="searchBar" />
        <ProductsTable :searchBarRef="searchBar" />
    </div>
</template>
