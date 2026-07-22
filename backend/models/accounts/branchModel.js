import db from '../../config/database.js';

export const BranchModel = {
  // Table schema configuration
  createTableQuery: `
    CREATE TABLE IF NOT EXISTS insurance_branch (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      gst_no VARCHAR(30) DEFAULT NULL,
      insurer VARCHAR(100) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      pin_code VARCHAR(20) DEFAULT NULL,
      contact VARCHAR(50) DEFAULT NULL,
      support_email VARCHAR(100) DEFAULT NULL,
      brockercode VARCHAR(100) DEFAULT NULL,
      name VARCHAR(100) DEFAULT NULL,
      designation VARCHAR(100) DEFAULT NULL,
      department VARCHAR(100) DEFAULT NULL,
      mobile VARCHAR(20) DEFAULT NULL,
      email VARCHAR(100) DEFAULT NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      created_by INT(10) UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // Default seed data
  seedData: [
    [
      '07AAAAA1111A1Z1', 'Tata AIG General Insurance', '12 Barakhamba Road', 'Delhi', 'New Delhi', '110001',
      '9876543210', 'delhi.support@tataaig.com', 'BR-DEL-01', 'Amit Sharma', 'Branch Manager', 'Operations',
      '9876543211', 'amit.sharma@tataaig.com', 1
    ],
    [
      '27BBBBB2222B2Z2', 'HDFC ERGO General Insurance', 'Kanakia Wall Street, Andheri East', 'Maharashtra', 'Mumbai', '400093',
      '8765432109', 'mumbai.support@hdfcergo.com', 'BR-MUM-02', 'Priya Patel', 'Regional Head', 'Sales',
      '8765432108', 'priya.patel@hdfcergo.com', 1
    ]
  ],

  // Get all branches
  async findAll() {
    const [rows] = await db.query('SELECT * FROM insurance_branch ORDER BY id DESC');
    return rows;
  },

  // Find branches by broker code (case-insensitive)
  async findByBrokerCode(brokerCode) {
    const [rows] = await db.query('SELECT * FROM insurance_branch WHERE LOWER(brockercode) = ?', [brokerCode.toLowerCase()]);
    return rows[0] || null;
  },

  // Create a new branch
  async create(branchData) {
    const {
      gst_no, insurer, address, state, city, pin_code, contact, support_email,
      brockercode, name, designation, department, mobile, email, status = 'Active', created_by
    } = branchData;

    const [result] = await db.query(
      `INSERT INTO insurance_branch (
        gst_no, insurer, address, state, city, pin_code, contact, support_email,
        brockercode, name, designation, department, mobile, email, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gst_no || null,
        insurer || null,
        address || null,
        state || null,
        city || null,
        pin_code || null,
        contact || null,
        support_email || null,
        brockercode || null,
        name || null,
        designation || null,
        department || null,
        mobile || null,
        email || null,
        status,
        created_by || 1
      ]
    );

    return {
      id: result.insertId,
      ...branchData,
      created_by: created_by || 1
    };
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM insurance_branch WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async updateById(id, branchData) {
    const {
      gst_no, insurer, address, state, city, pin_code, contact, support_email,
      brockercode, name, designation, department, mobile, email, status
    } = branchData;
    const [result] = await db.query(
      `UPDATE insurance_branch SET gst_no = ?, insurer = ?, address = ?, state = ?, city = ?,
       pin_code = ?, contact = ?, support_email = ?, brockercode = ?, name = ?, designation = ?,
       department = ?, mobile = ?, email = ?, status = ? WHERE id = ?`,
      [gst_no || null, insurer, address || null, state || null, city || null, pin_code || null,
        contact || null, support_email || null, brockercode || null, name || null,
        designation || null, department || null, mobile || null, email || null, status, id]
    );
    if (!result.affectedRows) return null;
    return this.findById(id);
  },

  async updateStatus(id, status) {
    const [result] = await db.query('UPDATE insurance_branch SET status = ? WHERE id = ?', [status, id]);
    if (!result.affectedRows) return null;
    return this.findById(id);
  }
};
