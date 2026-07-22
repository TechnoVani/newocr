import { checkDB } from '../../config/database.js';

export const getStatus = async (req, res) => {
  let dbConnected = false;
  try {
    await checkDB();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }
  res.json({
    status: 'online',
    database: dbConnected ? 'connected' : 'disconnected',
    message: dbConnected 
      ? 'Successfully connected to MySQL database.' 
      : 'Failed to connect to MySQL database. Backend is online but database is unavailable.'
  });
};
