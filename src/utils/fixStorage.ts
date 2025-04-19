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
    
    // Identify important keys to preserve
    const importantKeys = keys.filter(key => 
      key === 'currentUser' || 
      key === 'isLoggedIn' || 
      key === 'authToken' ||
      key.startsWith('user_')
    );

    // Backup important data
    const backup = importantKeys.reduce((acc, key) => {
      acc[key] = localStorage.getItem(key);
      return acc;
    }, {} as Record<string, string | null>);

    // Clear storage
    localStorage.clear();

    // Restore important data
    Object.entries(backup).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      }
    });

    console.log('Storage fixed successfully');
    return true;
  } catch (error) {
    console.error('Error fixing storage:', error);
    return false;
  }
} 