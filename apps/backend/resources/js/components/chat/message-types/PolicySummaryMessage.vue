<template>
  <div>
    <div
      v-if="message.sender === 'assistant'"
      class="prose prose-sm max-w-none"
      v-html="message.content"
    />
    <p
      v-else
      class="text-sm whitespace-pre-wrap break-words"
    >
      {{ message.content }}
    </p>

    <div
      v-if="display"
      class="mt-3 rounded-xl border border-brand-200 bg-white/80 p-3 text-sm text-gray-800"
    >
      <p class="font-semibold text-brand-900">
        {{ display.petName }}
      </p>
      <dl class="mt-2 space-y-1">
        <div
          v-if="display.ownerName"
          class="flex gap-2"
        >
          <dt class="text-gray-500 shrink-0">
            Власник
          </dt>
          <dd>{{ display.ownerName }}</dd>
        </div>
        <div
          v-if="display.plan"
          class="flex gap-2"
        >
          <dt class="text-gray-500 shrink-0">
            План
          </dt>
          <dd>{{ display.plan }}</dd>
        </div>
        <div
          v-if="display.status"
          class="flex gap-2"
        >
          <dt class="text-gray-500 shrink-0">
            Статус
          </dt>
          <dd>{{ display.status }}</dd>
        </div>
        <div
          v-if="policyId"
          class="flex gap-2"
        >
          <dt class="text-gray-500 shrink-0">
            Поліс
          </dt>
          <dd class="font-mono text-xs">
            {{ policyId }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from '@/types';

interface Props {
  message: ChatMessage;
}

const props = defineProps<Props>();

const display = computed(() => props.message.metadata?.policyStructured?.display ?? null);
const policyId = computed(() => props.message.metadata?.policyStructured?.policyId ?? null);
</script>
