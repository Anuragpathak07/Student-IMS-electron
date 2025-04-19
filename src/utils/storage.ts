/**
 * Storage utility to handle user-specific localStorage
 */

import { compressData, decompressData } from './compression';

// Maximum size for localStorage (5MB)
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * Get a value from localStorage with user isolation
 */
export function getStorageItem<T>(key: string, userId: string, defaultValue: T): T {
  try {
    const fullKey = `${userId}_${key}`;
    const item = localStorage.getItem(fullKey);
    
    if (!item) return defaultValue;
    
    // Check if the data is compressed
    if (item.startsWith('COMPRESSED:')) {
      const compressedData = item.substring('COMPRESSED:'.length);
      return decompressData(compressedData);
    }
    
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    // If there's an error parsing the data, remove the corrupted item
    try {
      localStorage.removeItem(`${userId}_${key}`);
    } catch (e) {
      console.error('Error removing corrupted item:', e);
    }
    return defaultValue;
  }
}

/**
 * Set a value in localStorage with user isolation
 */
export function setStorageItem<T>(key: string, userId: string, value: T): void {
  try {
    const fullKey = `${userId}_${key}`;
    const stringValue = JSON.stringify(value);
    
    // If the data is large, compress it
    if (stringValue.length > MAX_STORAGE_SIZE / 2) {
      const compressed = compressData(value);
      localStorage.setItem(fullKey, `COMPRESSED:${compressed}`);
    } else {
      localStorage.setItem(fullKey, stringValue);
    }
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // If we hit the quota, try to clear old data
      clearOldData(userId);
      // Try one more time
      try {
        const fullKey = `${userId}_${key}`;
        const stringValue = JSON.stringify(value);
        if (stringValue.length > MAX_STORAGE_SIZE / 2) {
          const compressed = compressData(value);
          localStorage.setItem(fullKey, `COMPRESSED:${compressed}`);
        } else {
          localStorage.setItem(fullKey, stringValue);
        }
      } catch (e) {
        console.error('Error setting item after clearing old data:', e);
      }
    } else {
      console.error(`Error setting item ${key}:`, error);
    }
  }
}

/**
 * Remove a value from localStorage with user isolation
 */
export function removeStorageItem(key: string, userId: string): void {
  try {
    localStorage.removeItem(`${userId}_${key}`);
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
  }
}

/**
 * Check if a storage item exists
 */
export function hasStorageItem(key: string, userId: string): boolean {
  try {
    return localStorage.getItem(`${userId}_${key}`) !== null;
  } catch (error) {
    console.error(`Error checking item ${key}:`, error);
    return false;
  }
}

/**
 * Clear all storage items for a specific user
 */
export function clearUserStorage(userId: string): void {
  try {
    // Get all keys for this user
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`${userId}_`));
    // Remove each key
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error clearing storage for user ${userId}:`, error);
  }
}

/**
 * Get all data for a specific user (useful for debugging)
 */
export function getAllUserData(userId: string): Record<string, any> {
  try {
    const userData: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(`_${userId}`)) {
        const baseKey = key.replace(`_${userId}`, '');
        const value = localStorage.getItem(key);
        
        if (value) {
          if (value.startsWith('COMPRESSED:')) {
            const compressedData = value.substring('COMPRESSED:'.length);
            userData[baseKey] = decompressData(compressedData);
          } else {
            try {
              userData[baseKey] = JSON.parse(value);
            } catch (parseError) {
              userData[baseKey] = 'Corrupted data';
            }
          }
        } else {
          userData[baseKey] = null;
        }
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting all user data:', error);
    return {};
  }
}

/**
 * Clear old data to free up storage space
 */
function clearOldData(userId: string): void {
  try {
    // Get all keys for this user
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`${userId}_`));
    
    // Sort keys by last modified time (if available)
    const sortedKeys = keys.sort((a, b) => {
      try {
        const timeA = localStorage.getItem(`${a}_timestamp`) || '0';
        const timeB = localStorage.getItem(`${b}_timestamp`) || '0';
        return parseInt(timeB) - parseInt(timeA);
      } catch {
        return 0;
      }
    });
    
    // Remove oldest 25% of items
    const itemsToRemove = Math.ceil(sortedKeys.length * 0.25);
    sortedKeys.slice(-itemsToRemove).forEach(key => {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      } catch (e) {
        console.error('Error removing old item:', e);
      }
    });
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
}

