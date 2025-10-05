import { defineStore } from 'pinia'
import type { Pet, Policy, Reminder, PetState } from '~/types'

export const usePetStore = defineStore('pet', {
  state: (): PetState => ({
    pet: {
      id: '1',
      name: 'Луна',
      type: 'Кішка',
      age: 3,
      avatar: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=300&auto=format&fit=crop'
    },
    policy: {
      number: '—',
      status: 'pending',
      coverage: ['консультація', 'базові аналізи', 'частково медикаменти']
    },
    reminders: [
      {
        id: '1',
        type: 'vaccination',
        description: 'Вакцинація — листопад',
        dueDate: '2024-11-01'
      },
      {
        id: '2',
        type: 'parasite_treatment',
        description: 'Обробка від паразитів — грудень',
        dueDate: '2024-12-01'
      }
    ],
    emailSubscribed: false
  }),

  getters: {
    policyStatusText: (state) => {
        
      switch (state.policy.status) {
        case 'active': return 'Активний'
        case 'inactive': return 'Неактивний'
        case 'pending': return 'Не підтверджено'
        default: return 'Не підтверджено'
      }
    }
  },

  actions: {
    updatePolicy(number: string, status: Policy['status']) {
      this.policy.number = number
      this.policy.status = status
    },

    async toggleEmailSubscription() {
      const newStatus = !this.emailSubscribed
      
      try {
        await $fetch('/api/pet/email', {
          method: 'POST',
          body: { subscribed: newStatus }
        })
        this.emailSubscribed = newStatus
      } catch (error) {
        console.error('Failed to update email subscription:', error)
      }
      
      return this.emailSubscribed
    }
  }
})
