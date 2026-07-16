import db, { connectDB } from './config/database.js';

try {
    await connectDB();
    const [rows] = await db.query(
        `SELECT DATABASE() AS database_name, COUNT(*) AS table_count
         FROM information_schema.tables
         WHERE table_schema = DATABASE()`
    );
    console.log('Database check passed:', rows[0]);
} catch (error) {
    console.error('Database check failed:', {
        code: error.code || 'UNKNOWN',
        message: error.message
    });
    process.exitCode = 1;
} finally {
    await db.end();
}
