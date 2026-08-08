import { CompanyModel } from '../../models/accounts/company.model.js';
import { successResponse } from '../../utils/response.js';
import { badRequest, conflict, notFound } from '../../utils/AppError.js';

const INSURER_TYPES = ['Life', 'General', 'Health'];
const STATUSES = ['Active', 'Inactive'];

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await CompanyModel.findAll();
    return successResponse(res, 'Insurer companies retrieved successfully.', companies);
  } catch (error) {
    next(error);
  }
};

export const addCompany = async (req, res, next) => {
  const { insurer, link, type, status = 'Active', created_by } = req.body;
  const insurerName = String(insurer || '').trim();

  try {
    if (!insurerName) throw badRequest('Insurer Name is required');
    if (!INSURER_TYPES.includes(type)) throw badRequest('Select a valid insurer type: Life, General, or Health.');
    if (!STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');

    const existing = await CompanyModel.findByName(insurerName);
    if (existing) throw conflict('A company/insurer with this name already exists.');

    const newCompanyData = {
      insurer: insurerName,
      link: String(link || '').trim(),
      type,
      status,
      created_by: created_by ? parseInt(created_by) : 1
    };

    const newCompany = await CompanyModel.create(newCompanyData);
    return successResponse(res, 'Company/insurer created successfully.', newCompany, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  const { id } = req.params;
  const { insurer, link, type, status } = req.body;
  try {
    const companyId = Number(id);
    if (!Number.isInteger(companyId) || companyId <= 0) throw badRequest('A valid insurer company is required.');
    if (!String(insurer || '').trim()) throw badRequest('Insurer Name is required');
    if (!INSURER_TYPES.includes(type)) throw badRequest('Select a valid insurer type: Life, General, or Health.');
    if (status !== undefined && !STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');

    const currentCompany = await CompanyModel.findById(companyId);
    if (!currentCompany) throw notFound('Company/insurer not found');

    const duplicate = await CompanyModel.findByName(String(insurer).trim());
    if (duplicate && Number(duplicate.id) !== companyId) throw conflict('A company/insurer with this name already exists.');

    const updatedCompany = await CompanyModel.updateById(companyId, {
      insurer: String(insurer).trim(),
      link: String(link || '').trim(),
      type,
      status: status || currentCompany.status || 'Active',
    });
    return successResponse(res, 'Company/insurer updated successfully.', updatedCompany);
  } catch (error) {
    next(error);
  }
};

export const updateCompanyStatus = async (req, res, next) => {
  try {
    const companyId = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isInteger(companyId) || companyId <= 0) throw badRequest('A valid insurer company is required.');
    if (!STATUSES.includes(status)) throw badRequest('Status must be Active or Inactive.');

    const company = await CompanyModel.updateStatus(companyId, status);
    if (!company) throw notFound('Company/insurer not found');
    return successResponse(res, `Company marked ${status}.`, company);
  } catch (error) {
    next(error);
  }
};
