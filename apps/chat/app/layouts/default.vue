<template>
  <div class="default-layout">
    <header>
      <h1>TBD: Application Header</h1>
    </header>
    
    <main>
      <slot />
    </main>
    
    <footer>
      <p>TBD: Application Footer</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// TBD: Add layout logic here
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
