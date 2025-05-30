<script setup>
import { storeToRefs } from 'pinia';
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { FormPermissions } from '~/utils/constants';

import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const setWideLayout = inject('setWideLayout');
defineEmits(['save-draft', 'switchView', 'showdoYouWantToSaveTheDraftModal']);

const properties = defineProps({
  block: {
    type: Boolean,
    default: false,
  },
  bulkFile: {
    type: Boolean,
    default: false,
  },
  allowSubmitterToUploadFile: {
    type: Boolean,
    default: false,
  },
  draftEnabled: {
    type: Boolean,
    default: false,
  },
  formId: {
    type: String,
    default: undefined,
  },
  isDraft: {
    type: Boolean,
    default: false,
  },
  permissions: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  submissionId: {
    type: String,
    default: undefined,
  },
  submission: {
    type: Object,
    default: undefined,
  },
  wideFormLayout: {
    type: Boolean,
    default: false,
  },
  publicForm: {
    type: Boolean,
    default: false,
  },
});

const isWideLayout = ref(properties.wideFormLayout);

const formStore = useFormStore();

const { isRTL } = storeToRefs(formStore);

const canSaveDraft = computed(() => !properties.readOnly);
const showEditToggle = computed(
  () =>
    properties.readOnly &&
    properties.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
);
const loading = ref(false);
function toggleLoading() {
  loading.value = !loading.value;
}

function toggleWideLayout() {
  isWideLayout.value = !isWideLayout.value;
  setWideLayout(isWideLayout.value);
}
// Sync the local copy with the prop when it changes
watch(
  () => properties.wideFormLayout,
  (newValue) => {
    isWideLayout.value = newValue;
    setWideLayout(newValue);
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    :class="{ 'dir-rtl': isRTL }"
  >
    <div v-if="formId && !publicForm">
      <v-btn
        color="primary"
        :loading="loading"
        variant="outlined"
        :title="$t('trans.formViewerActions.viewMyDraftOrSubmissions')"
        @click="
          toggleLoading();
          $emit('showdoYouWantToSaveTheDraftModal');
        "
      >
        <span :lang="locale">{{
          $t('trans.formViewerActions.viewMyDraftOrSubmissions')
        }}</span>
      </v-btn>
    </div>
    <div class="ml-auto d-flex">
      <!-- Bulk button -->
      <span
        v-if="allowSubmitterToUploadFile && !block && !publicForm"
        class="ml-2"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="x-small"
              :title="
                bulkFile
                  ? $t('trans.formViewerActions.switchSingleSubmssn')
                  : $t('trans.formViewerActions.switchMultiSubmssn')
              "
              @click="$emit('switchView')"
            >
              <v-icon icon="mdi:mdi-repeat"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
            bulkFile
              ? $t('trans.formViewerActions.switchSingleSubmssn')
              : $t('trans.formViewerActions.switchMultiSubmssn')
          }}</span>
        </v-tooltip>
      </span>

      <!-- Wide layout button -->
      <span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-if="wideFormLayout"
              class="ml-3"
              color="primary"
              v-bind="props"
              size="x-small"
              density="default"
              icon="mdi:mdi-panorama-variant-outline"
              :title="$t('trans.formViewerActions.wideLayout')"
              @click="toggleWideLayout"
            />
          </template>
          <span>{{ $t('trans.formViewerActions.wideLayout') }}</span>
        </v-tooltip>
      </span>

      <span class="ml-2 d-print-none">
        <PrintOptions
          :submission="submission"
          :submission-id="submissionId"
          :f="formId"
        />
      </span>

      <!-- Save a draft -->
      <span
        v-if="canSaveDraft && draftEnabled && !bulkFile && !publicForm"
        class="ml-2"
      >
        <v-btn color="primary" variant="outlined" @click="$emit('save-draft')">
          <span :lang="locale">{{
            $t('trans.formViewerActions.saveAsDraft')
          }}</span>
        </v-btn>
      </span>

      <!-- Go to draft edit -->
      <span
        v-if="showEditToggle && isDraft && draftEnabled && !publicForm"
        class="ml-2"
      >
        <router-link
          :to="{
            name: 'UserFormDraftEdit',
            query: {
              s: submissionId,
            },
          }"
        >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                icon="mdi:mdi-pencil"
                size="x-small"
                density="default"
                v-bind="props"
                :title="$t('trans.formViewerActions.editThisDraft')"
              />
            </template>
            <span :lang="locale">{{
              $t('trans.formViewerActions.editThisDraft')
            }}</span>
          </v-tooltip>
        </router-link>
      </span>

      <!-- Go to draft edit -->
      <span v-if="submissionId && draftEnabled && !publicForm" class="ml-2">
        <ManageSubmissionUsers
          :is-draft="isDraft"
          :submission-id="submissionId"
          :form-id="formId"
        />
      </span>
    </div>
  </div>
</template>
