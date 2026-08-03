import { CompanyModel } from '../../models/accounts/companyModel.js';

const INSURER_TYPES = ['Life', 'General', 'Health'];
const STATUSES = ['Active', 'Inactive'];

export const getCompanies = async (req, res) => {
  try {
    const companies = await CompanyModel.findAll();
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addCompany = async (req, res) => {
  const { insurer, link, type, status = 'Active', created_by } = req.body;
  const insurerName = String(insurer || '').trim();
  if (!insurerName) {
    return res.status(400).json({ success: false, error: 'Insurer Name is required' });
  }
  if (!INSURER_TYPES.includes(type)) {
    return res.status(400).json({ success: false, error: 'Select a valid insurer type: Life, General, or Health.' });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  }

  try {
    // Check if insurer exists
    const existing = await CompanyModel.findByName(insurerName);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A company/insurer with this name already exists.' });
    }

    const newCompanyData = {
      insurer: insurerName,
      link: String(link || '').trim(),
      type,
      status,
      created_by: created_by ? parseInt(created_by) : 1
    };

    const newCompany = await CompanyModel.create(newCompanyData);
    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { insurer, link, type, status } = req.body;
  const companyId = Number(id);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return res.status(400).json({ success: false, error: 'A valid insurer company is required.' });
  }
  if (!String(insurer || '').trim()) {
    return res.status(400).json({ success: false, error: 'Insurer Name is required' });
  }
  if (!INSURER_TYPES.includes(type)) {
    return res.status(400).json({ success: false, error: 'Select a valid insurer type: Life, General, or Health.' });
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  }

  try {
    const currentCompany = await CompanyModel.findById(companyId);
    if (!currentCompany) {
      return res.status(404).json({ success: false, error: 'Company/insurer not found' });
    }

    const duplicate = await CompanyModel.findByName(String(insurer).trim());
    if (duplicate && Number(duplicate.id) !== companyId) {
      return res.status(400).json({ success: false, error: 'A company/insurer with this name already exists.' });
    }

    const updatedCompany = await CompanyModel.updateById(companyId, {
      insurer: String(insurer).trim(),
      link: String(link || '').trim(),
      type,
      status: status || currentCompany.status || 'Active',
    });
    res.json({ success: true, data: updatedCompany, message: 'Company/insurer updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCompanyStatus = async (req, res) => {
  const companyId = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return res.status(400).json({ success: false, error: 'A valid insurer company is required.' });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  }
  try {
    const company = await CompanyModel.updateStatus(companyId, status);
    if (!company) return res.status(404).json({ success: false, error: 'Company/insurer not found' });
    res.json({ success: true, data: company, message: `Company marked ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
