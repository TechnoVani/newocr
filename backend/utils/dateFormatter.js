/**
 * Formats a date string or object to MySQL-compatible YYYY-MM-DD format
 * @param {string|Date} dateInput 
 * @returns {string|null} YYYY-MM-DD formatted date or null if invalid
 */
export const formatToMySQLDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
        let dateObj;
        
        if (dateInput instanceof Date) {
            dateObj = dateInput;
        } else if (typeof dateInput === "string") {
            const trimmed = dateInput.trim();
            
            // Try parsing DD/MM/YYYY or DD-MM-YYYY
            const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
            const match = trimmed.match(dmyRegex);
            if (match) {
                const [_, day, month, year] = match;
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(trimmed);
            }
        } else {
            dateObj = new Date(dateInput);
        }
        
        if (isNaN(dateObj.getTime())) {
            return null;
        }
        
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return null;
    }
};

export default {
    formatToMySQLDate
};
