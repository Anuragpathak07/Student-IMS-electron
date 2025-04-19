/**
 * Utility functions for managing local storage
 */

/**
 * Checks and fixes any storage issues while preserving important data
 */
export function fixStorageIssues() {
  try {
    // Get all storage keys
    const keys = Object.keys(localStorage);
    
    // Check if we have any corrupted data
    const hasCorruptedData = keys.some(key => {
      try {
        const value = localStorage.getItem(key);
        if (!value) return false;
        
        // Try to parse the value to check if it's valid JSON
        if (value.startsWith('COMPRESSED:')) {
          return false; // Compressed data is handled separately
        }
        
        JSON.parse(value);
        return false;
      } catch {
        return true; // If parsing fails, the data is corrupted
      }
    });

    // Only proceed with fixing if we have corrupted data
    if (hasCorruptedData) {
      // Identify important keys to preserve
      const importantKeys = keys.filter(key => {
        // Preserve login-related keys
        if (key === 'currentUser' || 
            key === 'isLoggedIn' || 
            key === 'authToken' ||
            key === 'USERS_COLLECTION_KEY') {
          return true;
        }
        
        // Preserve user-specific data
        if (key.includes('_current_user') || 
            key.includes('_users') ||
            key.includes('_student_') ||
            key.includes('_certificates') ||
            key.includes('_disability_id')) {
          return true;
        }
        
        // Preserve any compressed data
        if (localStorage.getItem(key)?.startsWith('COMPRESSED:')) {
          return true;
        }
        
        return false;
      });

      // Backup important data
      const backup = importantKeys.reduce((acc, key) => {
        const value = localStorage.getItem(key);
        if (value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      // Clear storage
      localStorage.clear();

      // Restore important data
      Object.entries(backup).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error(`Error restoring key ${key}:`, error);
        }
      });

      console.log('Storage fixed successfully while preserving login and student data');
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing storage:', error);
    return false;
  }
} 