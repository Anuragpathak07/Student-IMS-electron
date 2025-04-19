/**
 * Compression utility for handling large data in localStorage
 */

/**
 * Process data for compression, handling special cases like file data
 */
function processDataForCompression(data: any): any {
  // If it's an array, process each item
  if (Array.isArray(data)) {
    return data.map(item => processDataForCompression(item));
  }
  
  // If it's an object, process each property
  if (data && typeof data === 'object') {
    const processed: Record<string, any> = {};
    
    for (const key in data) {
      // Special handling for file data
      if (key === 'data' && typeof data[key] === 'string' && data[key].length > 1000) {
        // Keep binary data as is, don't compress it
        processed[key] = data[key];
      } else {
        processed[key] = processDataForCompression(data[key]);
      }
    }
    
    return processed;
  }
  
  // For primitive values, return as is
  return data;
}

/**
 * Compress data to reduce storage size
 */
export function compressData(data: any): string {
  try {
    // Create a copy of the data to avoid modifying the original
    const dataToCompress = processDataForCompression(data);
    
    // Convert to JSON string
    const jsonString = JSON.stringify(dataToCompress);
    
    // Simple compression: replace repeated characters with a shorter representation
    // This is a basic compression that works well for JSON data
    let compressed = '';
    let count = 1;
    let currentChar = jsonString[0];
    
    for (let i = 1; i < jsonString.length; i++) {
      if (jsonString[i] === currentChar && count < 255) {
        count++;
      } else {
        if (count > 3) {
          // Only compress if we have more than 3 repeated characters
          compressed += `\x00${String.fromCharCode(count)}${currentChar}`;
        } else {
          // Otherwise, just add the characters as is
          compressed += currentChar.repeat(count);
        }
        currentChar = jsonString[i];
        count = 1;
      }
    }
    
    // Add the last group
    if (count > 3) {
      compressed += `\x00${String.fromCharCode(count)}${currentChar}`;
    } else {
      compressed += currentChar.repeat(count);
    }
    
    return compressed;
  } catch (error) {
    console.error('Error compressing data:', error);
    // If compression fails, return the original data as a string
    return JSON.stringify(data);
  }
}

/**
 * Decompress data
 */
export function decompressData(compressed: string): any {
  try {
    // Simple decompression
    let decompressed = '';
    let i = 0;
    
    while (i < compressed.length) {
      if (compressed[i] === '\x00' && i + 2 < compressed.length) {
        // This is a compressed sequence
        const count = compressed.charCodeAt(i + 1);
        const char = compressed[i + 2];
        decompressed += char.repeat(count);
        i += 3;
      } else {
        // This is a regular character
        decompressed += compressed[i];
        i++;
      }
    }
    
    // Parse the decompressed JSON
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Error decompressing data:', error);
    // If decompression fails, try to parse the original string
    try {
      return JSON.parse(compressed);
    } catch (parseError) {
      console.error('Error parsing decompressed data:', parseError);
      return null;
    }
  }
}

/**
 * Safely parse JSON data
 */
export function safeParseData(data: string): any {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing data:', error);
    return null;
  }
} 