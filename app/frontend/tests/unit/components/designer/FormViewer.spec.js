// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';
import { useRouter } from 'vue-router';
import { nextTick, ref } from 'vue';

import FormViewer from '~/components/designer/FormViewer.vue';
import templateExtensions from '~/plugins/templateExtensions';
import { fileService, formService, rbacService } from '~/services';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, IdentityMode } from '~/utils/constants';
import * as transformUtils from '~/utils/transformUtils';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
    replace: () => {},
  })),
}));

const STUBS = {
  BaseDialog: true,
  FormViewerMultiUpload: true,
  VSkeletonLoader: {
    name: 'VSkeletonLoader',
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
  VContainer: {
    name: 'VContainer',
    template: '<div class="v-container-stub"><slot /></div>',
  },
  formio: {
    name: 'formio',
    template: '<div class="formio-stub"><slot /></div>',
  },
};

describe('FormViewer.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const appStore = useAppStore(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const getProxyHeadersSpy = vi.spyOn(formService, 'getProxyHeaders');
  const readVersionSpy = vi.spyOn(formService, 'readVersion');
  const readDraftSpy = vi.spyOn(formService, 'readDraft');
  const readPublishedSpy = vi.spyOn(formService, 'readPublished');
  const getSubmissionSpy = vi.spyOn(formService, 'getSubmission');
  const getUserSubmissionsSpy = vi.spyOn(rbacService, 'getUserSubmissions');
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const alertSpy = vi.spyOn(window, 'alert');
  const downloadFileSpy = vi.spyOn(formStore, 'downloadFile');
  const getDispositionSpy = vi.spyOn(transformUtils, 'getDisposition');
  const createSubmissionSpy = vi.spyOn(formService, 'createSubmission');
  const updateSubmissionSpy = vi.spyOn(formService, 'updateSubmission');

  beforeEach(() => {
    appStore.$reset();
    authStore.$reset();
    formStore.$reset();
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: 'idir',
        preferred_username: 'TEST',
        resource_access: 'chefs',
        realm_access: 'chefs',
        idp_userid: '123',
        idp_username: 'TEST',
        given_name: 'test',
        family_name: 'test',
        name: 'test',
        email: 'test@test.com',
      },
      authenticated: true,
      token: 'TOKEN',
    };

    addNotificationSpy.mockReset();

    getProxyHeadersSpy.mockReset();
    readVersionSpy.mockReset();
    readDraftSpy.mockReset();
    readPublishedSpy.mockReset();
    getSubmissionSpy.mockReset();
    getUserSubmissionsSpy.mockReset();

    addEventListenerSpy.mockReset();
    removeEventListener.mockReset();
    alertSpy.mockReset();
    downloadFileSpy.mockReset();
    getDispositionSpy.mockReset();
    createSubmissionSpy.mockReset();
    updateSubmissionSpy.mockReset();

    getProxyHeadersSpy.mockImplementation(() => {
      return {
        data: {
          'X-CHEFS-PROXY-DATA': '',
        },
      };
    });
    readVersionSpy.mockImplementation(() => {});
    readDraftSpy.mockImplementation(() => {});
    readPublishedSpy.mockImplementationOnce(() => {
      return {
        data: {
          versions: [
            {
              version: 1,
              id: '123',
              schema: {},
            },
          ],
          schedule: {
            expire: true,
            allowLateSubmissions: false,
            message: 'schedule status message',
          },
        },
      };
    });
    getSubmissionSpy.mockImplementation(() => {
      return {
        data: {
          submission: {
            submission: {
              data: {
                submit: true,
                state: 'submitted',
              },
            },
            draft: false,
          },
          form: {
            identityProviders: [
              {
                code: IdentityMode.PUBLIC,
              },
            ],
          },
          version: {
            id: '123',
            schema: {
              components: [],
            },
            version: 1,
          },
        },
      };
    });
    getUserSubmissionsSpy.mockImplementation(() => {
      return {
        data: [
          {
            permissions: [],
          },
        ],
      };
    });
    getDispositionSpy.mockImplementation(() => {});
    createSubmissionSpy.mockImplementation(() => {
      return {
        status: 200,
        data: {
          submission: { testKey: 'testValue' },
        },
      };
    });
    updateSubmissionSpy.mockImplementation(() => {
      return {
        status: 201,
        data: {
          submission: { testKey: 'testValue' },
        },
      };
    });
  });

  it('formScheduleExpireMessage returns the formScheduleExpireMessage translation or custom message', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.form = {};

    expect(wrapper.vm.formScheduleExpireMessage).toEqual(
      'trans.formViewer.formScheduleExpireMessage'
    );

    wrapper.vm.form = {
      schedule: {
        message: 'custom message',
      },
    };

    expect(wrapper.vm.formScheduleExpireMessage).toEqual('custom message');
  });

  it('formUnauthorizedMessage returns the formUnauthorizedMessage translation', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.formUnauthorizedMessage).toEqual(
      'trans.formViewer.formUnauthorizedMessage'
    );
  });

  it('viewerOptions returns default values', async () => {
    formStore.form = {
      name: 'This is a form title',
    };
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.viewerOptions).toEqual({
      sanitizeConfig: {
        addTags: ['iframe'],
        ALLOWED_TAGS: ['iframe'],
      },
      templates: templateExtensions,
      readOnly: false,
      hooks: {
        beforeSubmit: wrapper.vm.onBeforeSubmit,
      },
      // pass in options for custom components to use
      componentOptions: {
        simplefile: {
          config: appStore.config,
          chefsToken: wrapper.vm.getCurrentAuthHeader,
          deleteFile: wrapper.vm.deleteFile,
          getFile: wrapper.vm.getFile,
          uploadFile: wrapper.vm.uploadFile,
        },
      },
      evalContext: {
        token: authStore.tokenParsed,
        user: authStore.user,
      },
    });
  });

  it('canSaveDraft will return true if it is not read only and permissions includes SUBMISSION_UPDATE', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.permissions = [FormPermissions.SUBMISSION_UPDATE];

    expect(wrapper.vm.canSaveDraft).toBeTruthy();
  });

  describe('onMounted', () => {
    it('will add event listener beforeunload will show modal and getFormSchema', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          displayTitle: true,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(readPublishedSpy).toBeCalledTimes(1);
      expect(getSubmissionSpy).toBeCalledTimes(0);
      expect(wrapper.vm.showModal).toBeTruthy();
      expect(addEventListenerSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
    });
    it('if submission id and it is not a duplicate, it should call getFormData', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
          displayTitle: true,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(readPublishedSpy).toBeCalledTimes(0);
      expect(getSubmissionSpy).toBeCalledTimes(1);
      expect(wrapper.vm.showModal).toBeFalsy();
      expect(addEventListenerSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
    });
  });
  it('if submission id and it is a duplicate, it should call getFormSchema and getFormData', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: true,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    expect(readPublishedSpy).toBeCalledTimes(1);
    expect(getSubmissionSpy).toBeCalledTimes(1);
    expect(wrapper.vm.showModal).toBeFalsy();
    expect(addEventListenerSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('onBeforeUnmount should call window removeEventListener', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.unmount();

    await flushPromises();
    expect(removeEventListenerSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('getCurrentAuthHeader should return the bearer token', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.getCurrentAuthHeader()).toEqual(
      `Bearer ${authStore.keycloak.token}`
    );
  });

  it('getFormData calls getSubmission and getUserSubmissions', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    await wrapper.vm.getFormData();

    expect(getSubmissionSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('getFormData calls getSubmission and getUserSubmissions', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        readOnly: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();
    getSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: {
          submission: {
            submission: {
              data: {
                submit: false,
                state: 'draft',
              },
            },
            draft: true,
          },
          form: {
            identityProviders: [
              {
                code: IdentityMode.PUBLIC,
              },
            ],
          },
          version: {
            id: '123',
            schema: {
              components: [],
            },
            version: 1,
          },
        },
      };
    });

    await wrapper.vm.getFormData();

    expect(getSubmissionSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('getFormData addsNotification if an error is thrown', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    getSubmissionSpy.mockImplementationOnce(() => {
      throw new Error();
    });

    await wrapper.vm.getFormData();

    expect(getSubmissionSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('getFormData will call deleteFieldData if the submission is a duplicate and the response version schema has components', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        isDuplicate: true,
        staffEditMode: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    getSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: {
          submission: {
            submission: {
              data: {
                submit: false,
                state: 'draft',
              },
            },
            draft: true,
          },
          form: {
            identityProviders: [
              {
                code: IdentityMode.TEAM,
              },
            ],
          },
          version: {
            id: '123',
            schema: {
              components: [
                {
                  type: 'textfield',
                },
              ],
            },
            version: 1,
          },
        },
      };
    });

    await wrapper.vm.getFormData();
  });

  it('calls readPublished by default', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readPublishedSpy.mockReset();
    addNotificationSpy.mockReset();

    readPublishedSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.getFormSchema();

    expect(readPublishedSpy).toBeCalledTimes(1);
    expect(readVersionSpy).toBeCalledTimes(0);
    expect(readDraftSpy).toBeCalledTimes(0);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
  });

  it('calls readPublished by default, and pushes to router if there are no versions', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readPublishedSpy.mockReset();
    addNotificationSpy.mockReset();

    readPublishedSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.getFormSchema();

    expect(push).toBeCalledTimes(1);
    expect(readPublishedSpy).toBeCalledTimes(1);
    expect(readVersionSpy).toBeCalledTimes(0);
    expect(readDraftSpy).toBeCalledTimes(0);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });
  it('calls readVersion if there is a versionId', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        versionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readVersionSpy.mockReset();
    addNotificationSpy.mockReset();

    readVersionSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {},
        },
      };
    });

    await wrapper.vm.getFormSchema();

    expect(readPublishedSpy).toBeCalledTimes(0);
    expect(readVersionSpy).toBeCalledTimes(1);
    expect(readDraftSpy).toBeCalledTimes(0);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });
  it('readVersion will throw an error if the response does not contain a schema', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        versionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readVersionSpy.mockReset();
    addNotificationSpy.mockReset();

    readVersionSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.getFormSchema();

    expect(readPublishedSpy).toBeCalledTimes(0);
    expect(readVersionSpy).toBeCalledTimes(1);
    expect(readDraftSpy).toBeCalledTimes(0);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
  it('calls readDraft if there is a draftId', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        draftId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readDraftSpy.mockReset();
    addNotificationSpy.mockReset();

    readDraftSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {},
        },
      };
    });

    await wrapper.vm.getFormSchema();

    expect(readPublishedSpy).toBeCalledTimes(0);
    expect(readVersionSpy).toBeCalledTimes(0);
    expect(readDraftSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });
  it('readDraft will throw an error if the response does not contain a schema', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        draftId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readDraftSpy.mockReset();
    addNotificationSpy.mockReset();

    readDraftSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.getFormSchema();

    expect(readPublishedSpy).toBeCalledTimes(0);
    expect(readVersionSpy).toBeCalledTimes(0);
    expect(readDraftSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
  it('if the error response is a 401 then it will set isAuthorized to false', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        draftId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    readDraftSpy.mockReset();
    addNotificationSpy.mockReset();

    readDraftSpy.mockImplementationOnce(() => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      throw error;
    });

    await wrapper.vm.getFormSchema();

    expect(wrapper.vm.isAuthorized).toBeFalsy();
    expect(readPublishedSpy).toBeCalledTimes(0);
    expect(readVersionSpy).toBeCalledTimes(0);
    expect(readDraftSpy).toBeCalledTimes(1);
    expect(getUserSubmissionsSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('isProcessingMultiUpload will set the block variable to true or false', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.isProcessingMultiUpload(true);
    expect(wrapper.vm.block).toBeTruthy();
    wrapper.vm.isProcessingMultiUpload(false);
    expect(wrapper.vm.block).toBeFalsy();
  });

  it('formChange will call jsonManager', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
        draftId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const checkValidity = vi.fn();

    wrapper.vm.submissionRecord = {
      draft: true,
    };

    wrapper.vm.chefForm = {
      formio: {
        checkValidity,
        _data: {
          components: [],
        },
      },
    };

    wrapper.vm.formChange({
      changed: {
        flags: {
          fromSubmission: false,
        },
      },
    });
    expect(checkValidity).toBeCalledTimes(1);
    expect(wrapper.vm.formDataEntered).toBeTruthy();
    expect(wrapper.vm.formElement).toEqual({
      checkValidity,
      _data: { components: [] },
    });
  });

  it('saveDraft will call updateSubmission and replace the route if there is a submission id and it is not a duplicate', async () => {
    const updateSubmissionSpy = vi.spyOn(formService, 'updateSubmission');
    updateSubmissionSpy.mockImplementationOnce(() => {});
    const replace = vi.fn();

    useRouter.mockImplementationOnce(() => ({
      currentRoute: ref({
        query: '',
      }),
      replace,
    }));

    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.saveDraft();
    expect(updateSubmissionSpy).toBeCalledTimes(1);
    expect(replace).toBeCalledTimes(1);
  });

  it('saveDraft will call createSubmission and push the route if there is a submission id and it is a duplicate', async () => {
    // override default implementation
    createSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: {
          id: '123',
        },
      };
    });
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));

    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        isDuplicate: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.saveDraft();
    expect(createSubmissionSpy).toBeCalledTimes(1);
    expect(push).toBeCalledTimes(1);
  });

  it('saveDraft will addNotification if an error occurs', async () => {
    // override default implementations
    createSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: {
          id: '123',
        },
      };
    });
    updateSubmissionSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const replace = vi.fn();

    useRouter.mockImplementationOnce(() => ({
      currentRoute: ref({
        query: '',
      }),
      replace,
    }));

    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    await wrapper.vm.saveDraft();
    expect(createSubmissionSpy).toBeCalledTimes(0);
    expect(updateSubmissionSpy).toBeCalledTimes(1);
    expect(replace).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('onFormRender will set loading to false if it is loading', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.isLoading = true;
    wrapper.vm.onFormRender();
    expect(wrapper.vm.isLoading).toBeFalsy();
  });

  it('onSubmitButton will alert if it the form is a preview', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
        preview: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    alertSpy.mockImplementationOnce(() => {});

    wrapper.vm.onSubmitButton({ instance: { parent: { root: '' } } });

    expect(alertSpy).toBeCalledTimes(1);
  });

  it('onSubmitButton will show the submitConfirmDialog if enableSubmitterDraft is enabled', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    alertSpy.mockImplementationOnce(() => {});

    wrapper.vm.form.enableSubmitterDraft = true;

    wrapper.vm.onSubmitButton({
      instance: {
        parent: {
          root: {
            form: {
              action: 'something',
            },
          },
        },
      },
    });

    expect(wrapper.vm.showSubmitConfirmDialog).toBeTruthy();
  });

  it('continueSubmit will set confirmSubmit to true and showSubmitConfirmDialog to false', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        isDuplicate: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.continueSubmit();

    expect(wrapper.vm.confirmSubmit).toBeTruthy();
    expect(wrapper.vm.showSubmitConfirmDialog).toBeFalsy();
  });

  describe('onBeforeSubmit', async () => {
    it('if preview, it will just increment reRenderFormIo', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
          preview: true,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.reRenderFormIo = 0;

      const next = vi.fn();

      await wrapper.vm.onBeforeSubmit({}, next);

      expect(wrapper.vm.reRenderFormIo).toEqual(1);
    });
    it('if enableSubmitterDraft is disabled, it will just call next', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.form.enableSubmitterDraft = false;

      const next = vi.fn();

      await wrapper.vm.onBeforeSubmit({}, next);

      expect(next).toBeCalledTimes(1);
    });
    it('if enableSubmitterDraft is enabled, it will reRenderFormIo if confirmSubmit is false', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.form.enableSubmitterDraft = true;
      wrapper.vm.reRenderFormIo = 0;

      const next = vi.fn();

      vi.useFakeTimers();
      await wrapper.vm.onBeforeSubmit({}, next);
      expect(next).toBeCalledTimes(0);
      expect(wrapper.vm.reRenderFormIo).toEqual(1);
      vi.useRealTimers();
    });
    it('if enableSubmitterDraft is enabled, it will call next if confirmSubmit is true', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.form.enableSubmitterDraft = true;
      wrapper.vm.reRenderFormIo = 0;
      wrapper.vm.confirmSubmit = true;
      wrapper.vm.showSubmitConfirmDialog = true;

      const next = vi.fn();

      vi.useFakeTimers();
      wrapper.vm.onBeforeSubmit({}, next);
      vi.advanceTimersByTime(500);
      wrapper.vm.showSubmitConfirmDialog = false;
      await nextTick();
      expect(next).toBeCalledTimes(1);
      expect(wrapper.vm.reRenderFormIo).toEqual(0);
      expect(wrapper.vm.confirmSubmit).toBeFalsy();
      vi.useRealTimers();
    });
  });

  describe('doSubmit', () => {
    it('if it is not a duplicate it will set the submissionRecord to the responses data submission', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
          isDuplicate: false,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.doSubmit({
        data: {
          lateEntry: false,
        },
      });

      expect(wrapper.vm.submissionRecord).toEqual({ testKey: 'testValue' });
    });
    it('if status code 200 or 201 is not in the response, it will throw an error', async () => {
      // override default implementation
      updateSubmissionSpy.mockImplementationOnce(() => {
        return {
          status: 500,
          data: {
            submission: {},
          },
        };
      });
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
          isDuplicate: false,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      const errMsg = await wrapper.vm.doSubmit({
        data: {
          lateEntry: false,
        },
      });

      expect(errMsg).toEqual('trans.formViewer.errMsg');
    });
  });

  describe('onSubmit', () => {
    it('if preview, it will alert and set confirmSubmit to false', async () => {
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
          preview: true,
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.reRenderFormIo = 0;

      alertSpy.mockImplementationOnce(() => {});

      await wrapper.vm.onSubmit({});

      expect(alertSpy).toBeCalledTimes(1);
      expect(wrapper.vm.confirmSubmit).toBeFalsy();
    });
    it('if there are no errors it will call the currentForm.events.emit function', async () => {
      // override default implementation
      updateSubmissionSpy.mockImplementationOnce(() => {
        return {
          status: 200,
          data: {
            submission: { testKey: 'testValue' },
          },
        };
      });
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      const emit = vi.fn();

      wrapper.vm.currentForm = {
        events: {
          emit: emit,
        },
      };
      await wrapper.vm.onSubmit({
        data: {
          lateEntry: false,
        },
      });

      expect(emit).toBeCalledTimes(1);
    });
    it('if there are errors it will addNotification', async () => {
      // override default implementation
      updateSubmissionSpy.mockImplementationOnce(() => {
        return {
          status: 500,
          data: {
            submission: { testKey: 'testValue' },
          },
        };
      });
      const wrapper = shallowMount(FormViewer, {
        props: {
          formId: formId,
          submissionId: '123',
        },
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      addNotificationSpy.mockReset();

      await wrapper.vm.onSubmit({
        data: {
          lateEntry: false,
        },
      });

      expect(addNotificationSpy).toBeCalledTimes(1);
    });
  });

  it('onSubmitDone will emit submission-updated if staffEditMode is true', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        staffEditMode: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.onSubmitDone();

    expect(wrapper.emitted()).toHaveProperty('submission-updated');
  });

  it('onSubmitDone will push to router if staffEditMode is false', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
        staffEditMode: false,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.onSubmitDone();

    expect(push).toBeCalledTimes(1);
  });

  it('onCustomEvent will just make an alert right now', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.onCustomEvent({ type: 'custom' });

    expect(alertSpy).toBeCalledTimes(1);
  });

  it('leaveThisPage will push to router if saveDraftState is 0 or if there is a bulkFile value', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.saveDraftState = 0;

    wrapper.vm.leaveThisPage();

    expect(push).toBeCalledTimes(1);
    push.mockReset();

    wrapper.vm.saveDraftState = 1;
    wrapper.vm.bulkFile = true;

    wrapper.vm.leaveThisPage();

    expect(push).toBeCalledTimes(1);
    push.mockReset();

    wrapper.vm.saveDraftState = 1;
    wrapper.vm.bulkFile = false;

    wrapper.vm.leaveThisPage();

    expect(push).toBeCalledTimes(0);
    expect(wrapper.vm.bulkFile).toBeTruthy();
  });

  it('yes will call saveDraftFromModal', async () => {
    // override default implementation
    updateSubmissionSpy.mockImplementationOnce(() => {});
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.yes();

    expect(updateSubmissionSpy).toBeCalledTimes(1);
  });

  it('no will call leaveThisPage', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.no();

    expect(push).toBeCalledTimes(1);
  });

  it('showdoYouWantToSaveTheDraftModalForSwitch will set doYouWantToSaveTheDraft to true if the form had data entered and showModal is true', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.formDataEntered = true;
    wrapper.vm.showModal = true;

    wrapper.vm.showdoYouWantToSaveTheDraftModalForSwitch();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeTruthy();

    wrapper.vm.formDataEntered = false;
    wrapper.vm.showModal = false;
    wrapper.vm.doYouWantToSaveTheDraft = false;

    wrapper.vm.showdoYouWantToSaveTheDraftModalForSwitch();
    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeFalsy();
    // leaveThisPage will just toggle bulkFile
    expect(wrapper.vm.bulkFile).toBeTruthy();
  });

  it('showdoYouWantToSaveTheDraftModal will set doYouWantToSaveTheDraft to true it is not a bulk upload, if (submissionId is not undefined or the form had data entered) and enableSubmitterDraft is enabled', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: undefined,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.showModal = true;
    wrapper.vm.form.enableSubmitterDraft = true;

    wrapper.vm.showdoYouWantToSaveTheDraftModal();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeTruthy();
  });

  it('showdoYouWantToSaveTheDraftModal will call leaveThisPage otherwise', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: undefined,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.showModal = false;
    wrapper.vm.form.enableSubmitterDraft = true;

    wrapper.vm.showdoYouWantToSaveTheDraftModal();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeFalsy();
    expect(push).toBeCalledTimes(1);
  });

  it('showdoYouWantToSaveTheDraftModal will call leaveThisPage if bulkFile is enabled', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: undefined,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.bulkFile = true;

    wrapper.vm.showdoYouWantToSaveTheDraftModal();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeFalsy();
    expect(push).toBeCalledTimes(1);
  });

  it('switchView will call showdoYouWantToSaveTheDraftModalForSwitch and does not toggle bulkFile if bulkFile is false', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.formDataEntered = true;
    wrapper.vm.showModal = true;
    wrapper.vm.bulkFile = false;

    wrapper.vm.switchView();

    expect(wrapper.vm.bulkFile).toBeFalsy();
  });

  it('switchView will call toggle bulkFile if bulkFile is true', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.formDataEntered = false;
    wrapper.vm.showModal = false;
    wrapper.vm.bulkFile = true;

    wrapper.vm.switchView();

    expect(wrapper.vm.bulkFile).toBeFalsy();
  });

  it('saveDraftFromModalNow will call sendSubmission and then leaveThisPage', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    await wrapper.vm.saveDraftFromModalNow();

    expect(updateSubmissionSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('saveDraftFromModalNow will call addNotification if an error occurs', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    // override default implementation
    updateSubmissionSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    await wrapper.vm.saveDraftFromModalNow();

    expect(updateSubmissionSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('saveDraftFromModal will call saveDraftFromModalNow if there is an event', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    // override default implementation
    updateSubmissionSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    wrapper.vm.saveDraftFromModal({});

    expect(updateSubmissionSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('saveDraftFromModal will call leaveThisPage if there is no event', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    // override default implementation
    updateSubmissionSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    wrapper.vm.bulkFile = true;

    wrapper.vm.saveDraftFromModal();

    expect(updateSubmissionSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(push).toBeCalledTimes(1);
  });

  it('closeBulkYesOrNo sets doYouWantToSaveTheDraft to false', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.doYouWantToSaveTheDraft = true;

    wrapper.vm.closeBulkYesOrNo();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeFalsy();
  });

  it('beforeWindowUnload calls the events preventDefault and sets returnValue to an empty string if preview is disabled and it is not read only', async () => {
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const preventDefault = vi.fn();

    wrapper.vm.beforeWindowUnload({
      preventDefault: preventDefault,
      returnValue: 'return some value',
    });

    expect(preventDefault).toBeCalledTimes(1);
  });

  it('deleteFile will call fileServices deleteFile', async () => {
    const deleteFileSpy = vi.spyOn(fileService, 'deleteFile');
    deleteFileSpy.mockImplementation(() => {});
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.deleteFile('asdf');
    expect(deleteFileSpy).toBeCalledWith(undefined);
    await wrapper.vm.deleteFile({ id: '123' });
    expect(deleteFileSpy).toBeCalledWith('123');
    await wrapper.vm.deleteFile({ data: { id: '123' } });
    expect(deleteFileSpy).toBeCalledWith('123');
  });

  it('getFile will call form stores downloadFile for json', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    downloadFileSpy.mockImplementationOnce(() => {
      formStore.downloadedFile = {
        headers: {
          'content-type': 'application/json',
          'content-disposition': 'attachment; filename="test.json"',
        },
        data: {
          testKey: 'testValue',
        },
      };
    });
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.getFile('asdf');
    expect(downloadFileSpy).toBeCalledTimes(1);
    expect(getDispositionSpy).toBeCalledTimes(1);
  });

  it('getFile will call form stores downloadFile for other file types', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    downloadFileSpy.mockImplementationOnce(() => {
      formStore.downloadedFile = {
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="test.csv"',
        },
        data: 'cell1,cell2,cell3',
      };
    });
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.getFile('asdf');
    expect(downloadFileSpy).toBeCalledTimes(1);
    expect(getDispositionSpy).toBeCalledTimes(1);
  });

  it('uploadFile will call fileServices uploadFile', async () => {
    const uploadFileSpy = vi.spyOn(fileService, 'uploadFile');
    uploadFileSpy.mockImplementation(() => {});
    const wrapper = shallowMount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '123',
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.uploadFile('this is a file object');
    expect(uploadFileSpy).toBeCalledTimes(1);
  });
});
