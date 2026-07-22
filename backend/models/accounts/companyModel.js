import db from '../../config/database.js';

export const CompanyModel = {
  // Table schema configuration
  createTableQuery: `
    CREATE TABLE IF NOT EXISTS insurance_company (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      insurer VARCHAR(255) DEFAULT NULL,
      link TEXT DEFAULT NULL,
      type VARCHAR(100) DEFAULT NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      created_by INT(10) UNSIGNED NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // Default seed data (using insurer, link, type, created_by)
  seedData: [
    ['Tata AIG General Insurance', 'https://www.tataaig.com', 'General', 1],
    ['HDFC ERGO General Insurance', 'https://www.hdfcergo.com', 'General', 1],
    ['Star Health & Allied Insurance', 'https://www.starhealth.in', 'Health', 1],
    ['LIC of India', 'https://www.licindia.in', 'Life', 1]
  ],

  // Get all companies/insurers
  async findAll() {
    const [rows] = await db.query('SELECT * FROM insurance_company ORDER BY insurer ASC');
    return rows;
  },

  // Find a company by its name (case-insensitive)
  async findByName(insurerName) {
    const [rows] = await db.query('SELECT * FROM insurance_company WHERE LOWER(insurer) = ?', [insurerName.toLowerCase()]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM insurance_company WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create a new company/insurer
  async create(companyData) {
    const { insurer, link, type, status = 'Active', created_by } = companyData;
    const [result] = await db.query(
      'INSERT INTO insurance_company (insurer, link, type, status, created_by) VALUES (?, ?, ?, ?, ?)',
      [insurer, link, type, status, created_by || 1]
    );
    return {
      id: result.insertId,
      insurer,
      link,
      type,
      status,
      created_by: created_by || 1
    };
  },

  async updateById(id, companyData) {
    const { insurer, link, type, status } = companyData;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [currentRows] = await connection.query('SELECT insurer, status FROM insurance_company WHERE id = ? FOR UPDATE', [id]);
      if (!currentRows[0]) {
        await connection.rollback();
        return null;
      }
      await connection.query(
        'UPDATE insurance_company SET insurer = ?, link = ?, type = ?, status = ? WHERE id = ?',
        [insurer, link, type, status, id]
      );
      if (currentRows[0].insurer !== insurer) {
        await connection.query('UPDATE insurance_branch SET insurer = ? WHERE insurer = ?', [insurer, currentRows[0].insurer]);
      }
      if (status === 'Inactive') {
        await connection.query("UPDATE insurance_branch SET status = 'Inactive' WHERE insurer = ?", [insurer]);
      }
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, status) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        'UPDATE insurance_company SET status = ? WHERE id = ?',
        [status, id]
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return null;
      }
      if (status === 'Inactive') {
        const [rows] = await connection.query('SELECT insurer FROM insurance_company WHERE id = ?', [id]);
        await connection.query(
          "UPDATE insurance_branch SET status = 'Inactive' WHERE insurer = ?",
          [rows[0].insurer]
        );
      }
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
