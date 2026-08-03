import { BranchModel } from '../../models/accounts/branchModel.js';
import { CompanyModel } from '../../models/accounts/companyModel.js';

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

export const getBranches = async (req, res) => {
  try {
    const branches = await BranchModel.findAll();
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addBranch = async (req, res) => {
  const {
    gst_no, insurer, address, state, city, pin_code, contact, support_email,
    brockercode, name, designation, department, mobile, email, created_by
  } = req.body;

  if (!insurer) {
    return res.status(400).json({ success: false, error: 'Insurer Company association is required' });
  }

  try {
    // We allow multiple branches per broker code since database doesn't restrict it,
    // but we can check if a branch with the same broker code and insurer exists if desired.
    // For now, we proceed to create directly.
    const company = await CompanyModel.findByName(insurer.trim());
    if (!company) return res.status(400).json({ success: false, error: 'Selected insurer company does not exist.' });
    const status = req.body.status || 'Active';
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
    if (status === 'Active' && company.status === 'Inactive') {
      return res.status(400).json({ success: false, error: 'Cannot add an active branch to an inactive insurer.' });
    }
    const newBranchData = { ...cleanBranchData(req.body), status, created_by: created_by ? parseInt(created_by) : 1 };

    const newBranch = await BranchModel.create(newBranchData);
    res.status(201).json({ success: true, data: newBranch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  const branchId = Number(req.params.id);
  if (!Number.isInteger(branchId) || branchId <= 0) return res.status(400).json({ success: false, error: 'A valid branch is required.' });
  const branchData = cleanBranchData(req.body);
  if (!branchData.insurer) return res.status(400).json({ success: false, error: 'Insurer Company association is required' });
  try {
    const company = await CompanyModel.findByName(branchData.insurer);
    if (!company) return res.status(400).json({ success: false, error: 'Selected insurer company does not exist.' });
    const current = await BranchModel.findById(branchId);
    if (!current) return res.status(404).json({ success: false, error: 'Branch not found' });
    const status = req.body.status || current.status || 'Active';
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
    if (status === 'Active' && company.status === 'Inactive') {
      return res.status(400).json({ success: false, error: 'Cannot save an active branch under an inactive insurer.' });
    }
    const updated = await BranchModel.updateById(branchId, { ...branchData, status });
    res.json({ success: true, data: updated, message: 'Branch updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBranchStatus = async (req, res) => {
  const branchId = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isInteger(branchId) || branchId <= 0) return res.status(400).json({ success: false, error: 'A valid branch is required.' });
  if (!STATUSES.includes(status)) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  try {
    const current = await BranchModel.findById(branchId);
    if (!current) return res.status(404).json({ success: false, error: 'Branch not found' });
    if (status === 'Active') {
      const company = await CompanyModel.findByName(current.insurer);
      if (!company || company.status !== 'Active') return res.status(400).json({ success: false, error: 'Activate the insurer company before activating this branch.' });
    }
    const updated = await BranchModel.updateStatus(branchId, status);
    res.json({ success: true, data: updated, message: `Branch marked ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
