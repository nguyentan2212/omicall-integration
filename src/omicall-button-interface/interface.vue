<template>
  <div class="omicall-call">
    <button
      :disabled="!canCall"
      @click="handleCall"
      class="call-button"
      :title="buttonTitle"
    >
      📞 {{ callButtonText }}
    </button>

    <p v-if="statusText" class="status-text">
      {{ statusText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useApi, useStores } from "@directus/extensions-sdk";

const api = useApi();
const { useUserStore } = useStores();
const userStore = useUserStore();

// Type definitions
type SdkWindow = Window & {
  OMICallSDK?: any;
  OMICallUI?: any;
  omicallInitialized?: boolean;
};

type Language = "vi" | "en" | "km";

interface SipConfig {
  sipRealm: string;
  sipUser: string;
  sipPassword: string;
  user: string; // Directus user ID
}

interface Props {
  value: string | null;
  primaryKey: string | number | "+";
  collection: string;
  phoneField: string;
  sipConfigCollection: string;
  sipRealmField: string;
  sipUserField: string;
  sipPasswordField: string;
  userField: string;
  useDefaultUI: boolean;
  lng: Language;
}

// Props definition
const props = withDefaults(defineProps<Props>(), {
  value: null,
  primaryKey: "+",
  useDefaultUI: true,
  lng: "en",
});

// Emits
const emit = defineEmits<{
  input: [value: string];
}>();

// Reactive state
const statusText = ref("");
const isRegistered = ref(false);
const isLoading = ref(false);
const currentSipConfig = ref<SipConfig | null>(null);

// Computed properties
const canCall = computed(() => {
  return (
    isRegistered.value && !isLoading.value && currentSipConfig.value !== null
  );
});

const buttonTitle = computed(() => {
  if (!currentSipConfig.value)
    return "No SIP configuration found for current user";
  if (!isRegistered.value)
    return "Please wait while connecting to phone system";
  if (isLoading.value) return "Initializing...";
  return "Make call via OmiCall";
});

const callButtonText = computed(() => {
  if (isLoading.value) return "Loading...";
  if (!currentSipConfig.value) return "No Config";
  return "Call";
});

// Window reference
const w = window as SdkWindow;

// Methods
const getCurrentUser = (): string | null => {
  const currentUser = userStore.currentUser;
  console.log("userStore.currentUser", currentUser);
  return currentUser?.id || null;
};

const getSipConfigForUser = async (): Promise<SipConfig | null> => {
  try {
    const currentUserId = getCurrentUser();
    if (!currentUserId) {
      throw new Error("No authenticated user found");
    }

    if (!props.sipConfigCollection) {
      throw new Error("SIP configuration collection not specified");
    }

    // Validate field mappings
    if (
      !props.sipRealmField ||
      !props.sipUserField ||
      !props.sipPasswordField ||
      !props.userField
    ) {
      throw new Error(
        "Please configure all SIP field mappings in interface options"
      );
    }

    // Query SIP configs for the current user using dynamic field mapping
    const result = await api.get(`/items/${props.sipConfigCollection}`, {
      params: {
        filter: {
          [props.userField]: {
            _eq: currentUserId,
          },
        },
        limit: 1,
      },
    });

    if (!result || !result.data) {
      throw new Error(`No SIP configuration found for user ${currentUserId}`);
    }

    const { data: rawData } = result.data;

    if (!rawData || rawData.length === 0) {
      throw new Error(`No SIP configuration found for user ${currentUserId}`);
    }

    const rawConfig = rawData[0];
    console.log(rawData);
    console.log("rawConfig", rawConfig);

    // Map the raw config to our expected structure using dynamic field names
    const config: SipConfig = {
      sipRealm: rawConfig[props.sipRealmField],
      sipUser: rawConfig[props.sipUserField],
      sipPassword: rawConfig[props.sipPasswordField],
      user: rawConfig[props.userField],
    };

    console.log("Found SIP config for user:", config);
    return config;
  } catch (error: any) {
    console.error("Failed to fetch SIP configuration:", error);
    statusText.value = `SIP configuration error: ${
      error?.message || "Unknown error"
    }`;
    return null;
  }
};

const getItem = async (): Promise<any> => {
  try {
    const result = await api.get(
      `/items/${props.collection}/${props.primaryKey}`
    );
    return result.data;
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return null;
  }
};

const validateCallSDK = (): void => {
  if (typeof w.OMICallSDK === "undefined") {
    throw new Error("OMICall SDK is not loaded!");
  }
  if (!w.omicallInitialized) {
    throw new Error("OMICall SDK is not yet initialized!");
  }
};

const registerExtension = async (): Promise<boolean> => {
  try {
    if (!currentSipConfig.value) {
      throw new Error("No SIP configuration available");
    }

    const { sipRealm, sipUser, sipPassword } = currentSipConfig.value;

    if (!sipRealm || !sipUser || !sipPassword) {
      throw new Error(
        "Invalid SIP configuration: missing realm, user, or password"
      );
    }

    const registerResult = await w.OMICallSDK.register({
      sipRealm,
      sipUser,
      sipPassword,
    });
    console.log("registerResult", registerResult);

    if (
      registerResult &&
      !registerResult.status &&
      registerResult.error !== "ALREADY_REGISTERED"
    ) {
      throw new Error(registerResult.error || "Registration failed");
    }

    isRegistered.value = true;
    statusText.value = `Connected to phone system (${sipUser}@${sipRealm})`;
    return true;
  } catch (error: any) {
    console.error("Extension registration failed:", error);
    statusText.value = `Registration failed: ${
      error?.message || "Unknown error"
    }`;
    isRegistered.value = false;
    return false;
  }
};

const ensureInitialized = async (): Promise<boolean> => {
  if (isRegistered.value && currentSipConfig.value) {
    return true;
  }

  isLoading.value = true;
  statusText.value = "Initializing OmiCall...";

  try {
    // First, get SIP configuration for current user
    const sipConfig = await getSipConfigForUser();
    if (!sipConfig) {
      return false;
    }
    currentSipConfig.value = sipConfig;

    // Validate SDK is ready
    validateCallSDK();

    // Register extension (SDK is already initialized globally)
    const registered = await registerExtension();
    return registered;
  } finally {
    isLoading.value = false;
  }
};

const getPhoneNumber = async (): Promise<string | null> => {
  try {
    const item = await getItem();
    if (!item) {
      throw new Error("Item not found");
    }

    const phone = item.data[props.phoneField];
    if (!phone || !phone.trim()) {
      throw new Error(`No phone number found in field '${props.phoneField}'`);
    }

    return phone.trim();
  } catch (error: any) {
    console.error("Failed to get phone number:", error);
    statusText.value = error.message;
    return null;
  }
};

const handleCall = async (): Promise<void> => {
  try {
    const isReady = await ensureInitialized();
    if (!isReady) {
      statusText.value = "OmiCall is not ready. Please check configuration.";
      return;
    }

    const phoneNumber = await getPhoneNumber();
    if (!phoneNumber) return;

    console.log(
      "Making call to:",
      phoneNumber,
      "from field:",
      props.phoneField
    );
    await w.OMICallSDK.makeCall(phoneNumber);

    // Clear status after successful call initiation
    setTimeout(() => {
      statusText.value = "";
    }, 3000);
  } catch (error: any) {
    console.error("Call failed:", error);
    statusText.value = `Call failed: ${error?.message || "Unknown error"}`;
  }
};

// Lifecycle hooks
onMounted(async () => {
  console.log("OmiCall Interface mounted with props:", props);
  await ensureInitialized();
});

onUnmounted(() => {
  // if (w.OMICallSDK && isRegistered.value) {
  //   w.OMICallSDK.unregister();
  //   console.log("OmiCall SDK unregistered on component unmount");
  // }
});
</script>

<style scoped>
.omicall-call {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.call-button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--theme--primary);
  background: var(--theme--primary);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 80px;
}

.call-button:hover:not(:disabled) {
  background: var(--theme--primary-dark, #0056b3);
  transform: translateY(-1px);
}

.call-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--theme--background-subdued);
  border-color: var(--theme--border-normal);
  color: var(--theme--foreground-subdued);
}

.status-text {
  margin: 0;
  font-size: 12px;
  color: var(--theme--foreground-subdued);
  line-height: 1.4;
}
</style>
