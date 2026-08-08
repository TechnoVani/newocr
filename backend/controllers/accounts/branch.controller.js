import { BranchModel } from '../../models/accounts/branch.model.js';
import { CompanyModel } from '../../models/accounts/company.model.js';
import { successResponse } from '../../utils/response.js';
import { badRequest, notFound } from '../../utils/AppError.js';

const STATUSES = ['Active', 'Inactive'];
const cleanBranchData = body => ({
  gst_no: String(body.gst_no || '').trim(), insurer: String(body.insurer || '').trim(),
  address: String(body.address || '').trim(), state: String(body.state || '').trim(),
  city: String(body.city || '').trim(), pin_code: String(body.pin_code || '').trim(),
  contact: String(body.contact || '').trim(), support_email: String(body.support_email || '').trim(),
  brockercode: String(body.brockercode || '').trim(), name: String(body.name || '').trim(),
  designation: String(body.designation || '').trim(), department: String(body.department || '').trim(),
  mobile: String(body.mobile || '').trim(), email: String(body.email || '').trim()
});

export const getBranches = async (req, res, next) => {
  try {
    const branches = await BranchModel.findAll();
    return successResponse(res, 'Insurer branches retrieved successfully.', branches);
  } catch (error) {
    next(error);
  }
};

export const addBranch = async (req, res, next) => {
  const { insurer, created_by } = req.body;

  try {
    if (!insurer) throw badRequest('Insurer Company association is required');
    const company = await CompanyModel.findByName(insurer.trim());
    if (!company) throw badRequest('Selected insurer company does not exist.');
    const status = req.body.status || 'Active';
    if (!STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');
    if (status === 'Active' && company.status === 'Inactive') {
      throw badRequest('Cannot add an active branch to an inactive insurer.');
    }
    const newBranchData = { ...cleanBranchData(req.body), status, created_by: created_by ? parseInt(created_by) : 1 };

    const newBranch = await BranchModel.create(newBranchData);
    return successResponse(res, 'Branch created successfully.', newBranch, 201);
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const branchId = Number(req.params.id);
    if (!Number.isInteger(branchId) || branchId <= 0) throw badRequest('A valid branch is required.');
    const branchData = cleanBranchData(req.body);
    if (!branchData.insurer) throw badRequest('Insurer Company association is required');

    const company = await CompanyModel.findByName(branchData.insurer);
    if (!company) throw badRequest('Selected insurer company does not exist.');
    const current = await BranchModel.findById(branchId);
    if (!current) throw notFound('Branch not found');
    const status = req.body.status || current.status || 'Active';
    if (!STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');
    if (status === 'Active' && company.status === 'Inactive') {
      throw badRequest('Cannot save an active branch under an inactive insurer.');
    }
    const updated = await BranchModel.updateById(branchId, { ...branchData, status });
    return successResponse(res, 'Branch updated successfully.', updated);
  } catch (error) {
    next(error);
  }
};

export const updateBranchStatus = async (req, res, next) => {
  try {
    const branchId = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isInteger(branchId) || branchId <= 0) throw badRequest('A valid branch is required.');
    if (!STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');

    const current = await BranchModel.findById(branchId);
    if (!current) throw notFound('Branch not found');
    if (status === 'Active') {
      const company = await CompanyModel.findByName(current.insurer);
      if (!company || company.status !== 'Active') throw badRequest('Activate the insurer company before activating this branch.');
    }
    const updated = await BranchModel.updateStatus(branchId, status);
    return successResponse(res, `Branch marked ${status}.`, updated);
  } catch (error) {
    next(error);
  }
};
