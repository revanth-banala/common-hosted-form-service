const { validate } = require('uuid');

const emailService = require('../email/emailService');
const exportService = require('./exportService');
const service = require('./service');
const fileService = require('../file/service');

module.exports = {
  /**
   * Creates a document template that can be used to generate a document from
   * a form's submission data.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateCreate: async (req, res, next) => {
    try {
      const response = await service.documentTemplateCreate(req.params.formId, req.body, req.currentUser.usernameIdp);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes an active document template given its ID.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateDelete: async (req, res, next) => {
    try {
      await service.documentTemplateDelete(req.params.documentTemplateId, req.currentUser.usernameIdp);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets the active document templates for a form.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateList: async (req, res, next) => {
    try {
      const response = await service.documentTemplateList(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reads an active document template given its ID.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateRead: async (req, res, next) => {
    try {
      const response = await service.documentTemplateRead(req.params.documentTemplateId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  export: async (req, res, next) => {
    try {
      const result = await exportService.export(req.params.formId, req.query, req.currentUser);
      ['Content-Disposition', 'Content-Type'].forEach((h) => {
        res.setHeader(h, result.headers[h.toLowerCase()]);
      });
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  },

  exportWithFields: async (req, res, next) => {
    try {
      const result = await exportService.export(req.params.formId, req.body, req.currentUser);
      ['Content-Disposition', 'Content-Type'].forEach((h) => {
        res.setHeader(h, result.headers[h.toLowerCase()]);
      });
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  },
  listForms: async (req, res, next) => {
    try {
      const response = await service.listForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createForm: async (req, res, next) => {
    try {
      const response = await service.createForm(req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readForm: async (req, res, next) => {
    try {
      const response = await service.readForm(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readFormOptions: async (req, res, next) => {
    try {
      const formId = req.params.formId;
      if (!validate(formId)) {
        res.status(400).json({ detail: `Bad formId "${formId}".` });
      } else {
        const response = await service.readFormOptions(formId, req.query);
        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  },
  readPublishedForm: async (req, res, next) => {
    try {
      const response = await service.readPublishedForm(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateForm: async (req, res, next) => {
    try {
      const response = await service.updateForm(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteForm: async (req, res, next) => {
    try {
      const response = await service.deleteForm(req.params.formId, req.query, req.currentUser);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  listFormSubmissions: async (req, res, next) => {
    try {
      const formId = req.params.formId;
      if (!validate(formId)) {
        res.status(400).json({ detail: `Bad formId "${formId}".` });
      } else {
        // Extract the filterAssignedToCurrentUser parameter
        const { filterAssignedToCurrentUser, ...restQuery } = req.query;

        // Create a new params object with the filter parameter
        const params = {
          ...restQuery,
          filterAssignedToCurrentUser: filterAssignedToCurrentUser === 'true',
        };

        // Pass the params and current user to the service
        const response = await service.listFormSubmissions(formId, params, req.currentUser);
        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  },
  readVersion: async (req, res, next) => {
    try {
      const response = await service.readVersion(req.params.formVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readVersionFields: async (req, res, next) => {
    try {
      const response = await service.readVersionFields(req.params.formVersionId);
      res.status(200).json(response.filter((f) => f !== 'submit'));
    } catch (error) {
      next(error);
    }
  },
  publishVersion: async (req, res, next) => {
    try {
      const response = await service.publishVersion(req.params.formId, req.params.formVersionId, req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listSubmissions: async (req, res, next) => {
    try {
      const response = await service.listSubmissions(req.params.formVersionId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createSubmission: async (req, res, next) => {
    try {
      const response = await service.createSubmission(req.params.formVersionId, req.body, req.currentUser);
      if (!req.body.draft) {
        emailService.submissionReceived(req.params.formId, response.id, req.body, req.headers.referer).catch(() => {});
      }
      // do we want to await this? could take a while, but it could fail... maybe make an explicit api call?
      fileService.moveSubmissionFiles(response.id, req.currentUser).catch(() => {});
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  createMultiSubmission: async (req, res, next) => {
    try {
      const response = await service.createMultiSubmission(req.params.formVersionId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  listSubmissionFields: async (req, res, next) => {
    try {
      let fields = [];
      if (req.query.fields) {
        let splitFields = [];
        if (Array.isArray(req.query.fields)) {
          splitFields = req.query.fields.flatMap((f) => f.split(',').map((s) => s.trim()));
        } else {
          splitFields = req.query.fields.split(',').map((s) => s.trim());
        }

        // Drop invalid fields
        const validFields = await service.readVersionFields(req.params.formVersionId);
        fields = splitFields.filter((f) => validFields.includes(f));
      }

      const response = await service.listSubmissionFields(req.params.formVersionId, fields);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listDrafts: async (req, res, next) => {
    try {
      const response = await service.listDrafts(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createDraft: async (req, res, next) => {
    try {
      const response = await service.createDraft(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readDraft: async (req, res, next) => {
    try {
      const response = await service.readDraft(req.params.formVersionDraftId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateDraft: async (req, res, next) => {
    try {
      const response = await service.updateDraft(req.params.formVersionDraftId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteDraft: async (req, res, next) => {
    try {
      const response = await service.deleteDraft(req.params.formVersionDraftId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  publishDraft: async (req, res, next) => {
    try {
      const response = await service.publishDraft(req.params.formId, req.params.formVersionDraftId, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getStatusCodes: async (req, res, next) => {
    try {
      const response = await service.getStatusCodes(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readApiKey: async (req, res, next) => {
    try {
      const response = await service.readApiKey(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createOrReplaceApiKey: async (req, res, next) => {
    try {
      const response = await service.createOrReplaceApiKey(req.params.formId, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  filesApiKeyAccess: async (req, res, next) => {
    try {
      const response = await service.filesApiKeyAccess(req.params.formId, req.body.filesApiAccess);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteApiKey: async (req, res, next) => {
    try {
      const response = await service.deleteApiKey(req.params.formId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFCProactiveHelpImageUrl: async (req, res, next) => {
    try {
      const response = await service.getFCProactiveHelpImageUrl(req.params.componentId);
      res.status(200).send(response);
    } catch (error) {
      next(error);
    }
  },
  readFieldsForCSVExport: async (req, res, next) => {
    try {
      const response = await exportService.fieldsForCSVExport(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listFormComponentsProactiveHelp: async (req, res, next) => {
    try {
      const response = await service.listFormComponentsProactiveHelp();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readFormSubscriptionDetails: async (req, res, next) => {
    try {
      const response = await service.readFormSubscriptionDetails(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createOrUpdateSubscriptionDetails: async (req, res, next) => {
    try {
      const response = await service.createOrUpdateSubscriptionDetails(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readEmailTemplates: async (req, res, next) => {
    try {
      const response = await service.readEmailTemplates(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createOrUpdateEmailTemplate: async (req, res, next) => {
    try {
      const response = await service.createOrUpdateEmailTemplate(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
