<template>
  <div class="default-layout">
   <AppHeader />

    <main>
      <slot />
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// TBD: Add layout logic here
import AppHeader from "~/components/layout/AppHeader.vue";
import AppFooter from "~/components/layout/AppFooter.vue";
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #f5f5f5;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

main {
  flex: 1;
  padding: 2rem;
}

footer {
  background-color: #f5f5f5;
  padding: 1rem;
  border-top: 1px solid #ddd;
  text-align: center;
}
</style>
