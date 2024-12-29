import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import InventoryView from '@/views/InventoryView.vue'
import InventoryListView from '@/views/InventoryListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      // Lista wszystkich inwentaryzacji
      path: '/inventory',
      name: 'inventory-list',
      component: InventoryListView,
    },
    {
      // Szczegóły konkretnej inwentaryzacji
      path: '/inventory/:id',
      name: 'inventory-details',
      component: InventoryView,
      props: true, // pozwala przekazać parametr :id jako prop do komponentu
    },
    {
      // Nowa inwentaryzacja
      path: '/inventory/new',
      name: 'inventory-new',
      component: InventoryView,
    }
  ],
})

// Opcjonalnie: Guard nawigacji sprawdzający uprawnienia
router.beforeEach((to, from, next) => {
  // Tutaj możesz dodać logikę sprawdzania uprawnień
  // np. czy użytkownik jest zalogowany
  next()
})

export default router
