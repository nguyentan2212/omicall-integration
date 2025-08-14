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
import { onMounted, onUnmounted, ref, computed, PropType } from "vue";
import { useApi } from "@directus/extensions-sdk";

const api = useApi();

// Type definitions
type SdkWindow = Window & {
  OMICallSDK?: any;
  OMICallUI?: any;
};

type Language = "vi" | "en" | "km";

interface Props {
  value: string | null;
  primaryKey: string | number | "+";
  collection: string;
  phoneField: string;
  sipRealm: string;
  sipUser: string;
  sipPassword: string;
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
const isInitialized = ref(false);
const isRegistered = ref(false);
const isLoading = ref(false);

// Computed properties
const canCall = computed(() => {
  return isRegistered.value && !isLoading.value;
});

const buttonTitle = computed(() => {
  if (!isRegistered.value) return "Please configure OmiCall settings first";
  if (isLoading.value) return "Initializing...";
  return "Make call via OmiCall";
});

const callButtonText = computed(() => {
  if (isLoading.value) return "Loading...";
  return "Call";
});

// Window reference
const w = window as SdkWindow;

// Methods
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
};

const initializeSDK = async (): Promise<boolean> => {
  try {
    validateCallSDK();

    const initResult = await w.OMICallSDK.init({
      lng: props.lng,
      ui: {
        toggleDial: props.useDefaultUI ? "show" : "hide",
        dialPosition: "right",
      },
    });

    if (!initResult) {
      throw new Error("Failed to initialize OmiCall SDK");
    }

    isInitialized.value = true;
    return true;
  } catch (error: any) {
    console.error("SDK initialization failed:", error);
    statusText.value = `SDK initialization failed: ${
      error?.message || "Unknown error"
    }`;
    return false;
  }
};

const registerExtension = async (): Promise<boolean> => {
  try {
    const { sipRealm, sipUser, sipPassword } = props;

    if (!sipRealm || !sipUser || !sipPassword) {
      throw new Error(
        "Missing SIP configuration. Please configure realm, user, and password in interface options."
      );
    }

    const registerResult = await w.OMICallSDK.register({
      sipRealm,
      sipUser,
      sipPassword,
    });
    console.log("registerResult", registerResult);

    if (registerResult && !registerResult.status) {
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
  if (isInitialized.value && isRegistered.value) {
    return true;
  }

  isLoading.value = true;
  statusText.value = "Initializing OmiCall...";

  try {
    const sdkInitialized = await initializeSDK();
    if (!sdkInitialized) return false;

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
  if (w.OMICallSDK) {
    w.OMICallSDK.unregister();
    console.log("OmiCall SDK unregistered on component unmount");
  }
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
