import type { SSEEvent } from '@/composables/useEventBus';
import { usePetProfile } from '@/composables/usePetProfile';
import { usePetProfileStore } from '@/stores/petProfile';

type PolicyDetailsPayload = Record<string, unknown>;

function extractPolicyDetailsPayload(event: SSEEvent): PolicyDetailsPayload | null {
    const eventWithPayload = event as SSEEvent & { payload?: { data?: PolicyDetailsPayload } & PolicyDetailsPayload };

    if (eventWithPayload.payload && typeof eventWithPayload.payload === 'object') {
        const nested = eventWithPayload.payload.data;

        if (nested && typeof nested === 'object') {
            return nested as PolicyDetailsPayload;
        }

        const { eventType: _eventType, timestamp: _timestamp, data: _data, ...rest } = eventWithPayload.payload;

        if (rest.pet || rest.policy || rest.owner) {
            return rest as PolicyDetailsPayload;
        }
    }

    if (event.data && typeof event.data === 'object') {
        return event.data as PolicyDetailsPayload;
    }

    return null;
}

/**
 * Applies PolicyDetailsRetrieved SSE payload to the pet profile store and unlocks the sidebar.
 */
export function usePolicyDetailsFromSse() {
    const petProfileStore = usePetProfileStore();
    const { unlockPetDetails } = usePetProfile();

    const applyPolicyDetailsFromSseEvent = (event: SSEEvent): boolean => {
        const eventData = extractPolicyDetailsPayload(event);

        if (!eventData) {
            console.error('[PetProfile] Missing or invalid PolicyDetailsRetrieved data');

            return false;
        }

        if (!eventData.pet && !eventData.policy && !eventData.owner) {
            console.warn('[PetProfile] PolicyDetailsRetrieved missing primary fields:', eventData);

            return false;
        }

        const profileData: Record<string, unknown> = {};

        if (eventData.pet && typeof eventData.pet === 'object') {
            const pet = eventData.pet as Record<string, unknown>;
            profileData.pet = {
                id: pet.id || '',
                name: pet.name || '',
                species: ['cat', 'dog', 'bird', 'rabbit', 'other'].includes(pet.species as string)
                    ? pet.species
                    : 'cat',
                breed: pet.breed || '',
                sex: ['male', 'female'].includes(pet.sex as string) ? pet.sex : 'female',
                dateOfBirth: pet.dateOfBirth || '',
                ageMonths: typeof pet.ageMonths === 'number' ? pet.ageMonths : 0,
                color: pet.color || '',
                microchip: pet.microchip || { number: '', issuer: '', dateImplanted: '' },
                identifiers: pet.identifiers || { licenseTag: '', passportNumber: '' },
                photoUrl: pet.photoUrl || '',
                weight: pet.weight || { currentKg: 0, lastUpdated: '', history: [] },
                spayedNeutered: Boolean(pet.spayedNeutered),
                lifestyle: pet.lifestyle || {
                    indoor: false,
                    outdoor: false,
                    activityLevel: 'moderate',
                    diet: 'dry',
                },
            };
        }

        if (eventData.owner && typeof eventData.owner === 'object') {
            const owner = eventData.owner as Record<string, unknown>;
            profileData.owner = {
                id: owner.id || '',
                fullName: owner.fullName || '',
                phone: owner.phone || '',
                email: owner.email || '',
                address: owner.address || {
                    country: '',
                    city: '',
                    street: '',
                    postalCode: '',
                },
            };
        }

        if (eventData.policy && typeof eventData.policy === 'object') {
            const policy = eventData.policy as Record<string, unknown>;
            profileData.policy = {
                policyId: policy.policyId || '',
                provider: policy.provider || '',
                status: ['active', 'inactive', 'pending', 'expired'].includes(policy.status as string)
                    ? policy.status
                    : 'inactive',
                startDate: policy.startDate || '',
                endDate: policy.endDate || '',
                plan: policy.plan || '',
                coverage: policy.coverage || {
                    annualLimitUAH: 0,
                    deductibleUAH: 0,
                    copayPercent: 0,
                    covered: [],
                    exclusions: [],
                },
            };
        }

        if (eventData.medical && typeof eventData.medical === 'object') {
            const medical = eventData.medical as Record<string, unknown>;
            profileData.medical = {
                allergies: Array.isArray(medical.allergies) ? medical.allergies : [],
                conditions: Array.isArray(medical.conditions) ? medical.conditions : [],
                vaccinations: Array.isArray(medical.vaccinations) ? medical.vaccinations : [],
                medications: Array.isArray(medical.medications) ? medical.medications : [],
                lastCheckup: medical.lastCheckup || {
                    date: '',
                    clinic: { id: '', name: '', phone: '' },
                    notes: '',
                },
                procedures: Array.isArray(medical.procedures) ? medical.procedures : [],
            };
        }

        if (Array.isArray(eventData.claims)) {
            profileData.claims = eventData.claims;
        }

        if (Array.isArray(eventData.vetContacts)) {
            profileData.vetContacts = eventData.vetContacts;
        }

        if (eventData.audit && typeof eventData.audit === 'object') {
            const audit = eventData.audit as Record<string, unknown>;
            profileData.audit = {
                createdAt: audit.createdAt || new Date().toISOString(),
                updatedAt: audit.updatedAt || new Date().toISOString(),
                source: audit.source || 'sse-event',
                version: typeof audit.version === 'number' ? audit.version : 1,
            };
        }

        if (Object.keys(profileData).length === 0) {
            return false;
        }

        petProfileStore.updatePetProfile(profileData);
        unlockPetDetails();

        console.log('[PetProfile] Applied PolicyDetailsRetrieved from SSE');

        return true;
    };

    return { applyPolicyDetailsFromSseEvent };
}
