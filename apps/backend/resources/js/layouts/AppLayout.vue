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
import AppFooter from '@/components/layout/AppFooter.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
</script>

<style scoped>
.default-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

header {
    background-color: #ffffff;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

main {
    flex: 1;
    padding: 2rem;
}

footer {
    background-color: #ffffff;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
}
</style>
