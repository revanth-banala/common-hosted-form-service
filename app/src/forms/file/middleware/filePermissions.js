const Problem = require('api-problem');

const userAccess = require('../../auth/middleware/userAccess');
const log = require('../../../components/log')(module.filename);
const service = require('../service');
const { Permissions } = require('../../common/constants');

/**
 * @function currentFileRecord
 * Get the DB record for this file being accessed and store in request for use further down the chain
 * @returns {Function} a middleware function
 */
const currentFileRecord = async (req, _res, next) => {
  let fileRecord;
  try {
    // Check if authed, can expand for API key access if needed
    if (req.params.fileId && (req.currentUser || req.apiUser)) {
      // expanded for api user
      fileRecord = await service.read(req.params.fileId);
    }
  } catch (error) {
    log.error(`Failed to find file record for id ${req.params.fileId}. Error ${error}`);
  }

  if (!fileRecord) {
    // 403 on no auth or file not found (don't 404 for id discovery)
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }

  req.currentFileRecord = fileRecord;
  next();
};

/**
 * @function hasFileCreate
 * Middleware to determine if this user can upload a file to the system
 * @returns {Function} a middleware function
 */
const hasFileCreate = (req, res, next) => {
  // You can't do this if you are not authenticated as a USER (not a public user)
  // Can expand on this for API key access if ever needed
  if (!req.currentUser || !req.currentUser.idpUserId) {
    return next(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  }
  next();
};

/**
 * @function hasFileDelete
 * Middleware to determine if this user can delete an array of files from the system
 * @returns {Function} a middleware function
 */
const hasFileDelete = async (req, res, next) => {
  // You can't do this if you are not authenticated as a USER (not a public user)
  // Can expand on this for API key access if ever needed
  if (!req.currentUser || !req.currentUser.idpUserId) {
    return next(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  }

  const fileIds = req.body.fileIds;

  if (!Array.isArray(fileIds)) {
    return next(new Problem(403, { detail: 'File IDs must be an array of file UUIDs.' }));
  }

  let fileNotFound = false;
  let permissionError = null;
  for (const fileId of fileIds) {
    const fileRecord = await service.read(fileId);
    if (!fileRecord) {
      fileNotFound = true;
      break;
    } else {
      req.currentFileRecord = fileRecord;
      req.query.formSubmissionId = req.currentFileRecord.formSubmissionId;
      const subPermCheck = userAccess.hasSubmissionPermissions([Permissions.SUBMISSION_UPDATE]);
      await subPermCheck(req, res, (err) => {
        if (err) {
          permissionError = err;
        }
      });
      if (permissionError) {
        break;
      }
    }
  }

  if (fileNotFound) {
    // 403 on no auth or file not found (don't 404 for id discovery)
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }

  if (permissionError) {
    return next(permissionError);
  }

  next();
};

/**
 * @function hasFilePermissions
 * Middleware to determine if the current user can do a specific permission on a file
 * This is generally based on the SUBMISSION permissions that the file is attached to
 * but has to handle management for files that are added before submit
 * @param {string[]} permissions the submission permissions to require on this route
 * @returns {Function} a middleware function
 */
const hasFilePermissions = (permissions) => {
  return (req, res, next) => {
    // skip for API users
    if (req.apiUser) {
      return next();
    }
    // Guard against unauthed (or public) users
    if (!req.currentUser || !req.currentUser.idpUserId) {
      return next(new Problem(403, { detail: 'Unauthorized to read file.' }));
    }

    // Check to see if this has been associated with a submission...
    // like prior implementations, if a submission has not been posted, there's not
    // anything we can check permissions on so can only check authed
    if (req.currentFileRecord.formSubmissionId) {
      // For the existing middleware to interface as designed, add the sub ID to the req
      req.query.formSubmissionId = req.currentFileRecord.formSubmissionId;

      // Trigger submission permission checker
      const subPermCheck = userAccess.hasSubmissionPermissions(permissions);
      return subPermCheck(req, res, next);
    }

    next();
  };
};

module.exports = {
  currentFileRecord,
  hasFileCreate,
  hasFileDelete,
  hasFilePermissions,
};
