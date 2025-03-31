// Simple Cipher: Convert letters to symbols/numbers
export const simpleEncrypt = (text: string): string => {
  const mapping: Record<string, string> = {
    'a': '4', 'b': '8', 'c': '(', 'd': '|)', 'e': '3', 'f': '|=', 'g': '6', 'h': '#', 'i': '!',
    'j': '_|', 'k': '|<', 'l': '1', 'm': '|v|', 'n': '|\\|', 'o': '0', 'p': '|°', 'q': '9',
    'r': '|2', 's': '$', 't': '7', 'u': '|_|', 'v': '\\/', 'w': '\\/\\/', 'x': '><', 'y': '`/',
    'z': '2', ' ': '~', '0': 'ø', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
    '6': 'g', '7': 't', '8': 'b', '9': 'q', '.': '•', ',': '¸', '?': '¿', '!': '¡'
  };

  return text.toLowerCase().split('').map(char => mapping[char] || char).join('');
};

export const simpleDecrypt = (code: string): string => {
  const reverseMapping: Record<string, string> = {
    '4': 'a', '8': 'b', '(': 'c', '|)': 'd', '3': 'e', '|=': 'f', '6': 'g', '#': 'h', '!': 'i',
    '_|': 'j', '|<': 'k', '1': 'l', '|v|': 'm', '|\\|': 'n', '0': 'o', '|°': 'p', '9': 'q',
    '|2': 'r', '$': 's', '7': 't', '|_|': 'u', '\\/': 'v', '\\/\\/': 'w', '><': 'x', '`/': 'y',
    '2': 'z', '~': ' ', 'ø': '0', 'i': '1', 'z': '2', 'e': '3', 'a': '4', 's': '5',
    'g': '6', 't': '7', 'b': '8', 'q': '9', '•': '.', '¸': ',', '¿': '?', '¡': '!'
  };

  // Handle multi-character symbols
  let result = '';
  let i = 0;
  
  while (i < code.length) {
    // Check for three-character symbols first
    if (i <= code.length - 3) {
      const threeChars = code.substring(i, i + 3);
      if (reverseMapping[threeChars]) {
        result += reverseMapping[threeChars];
        i += 3;
        continue;
      }
    }
    
    // Check for two-character symbols
    if (i <= code.length - 2) {
      const twoChars = code.substring(i, i + 2);
      if (reverseMapping[twoChars]) {
        result += reverseMapping[twoChars];
        i += 2;
        continue;
      }
    }
    
    // Fall back to single character
    const char = code[i];
    result += reverseMapping[char] || char;
    i += 1;
  }
  
  return result;
};

// Caesar Cipher: Shift letters by a fixed number
export const caesarEncrypt = (text: string, shift: number): string => {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    
    // Uppercase letters
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    
    // Lowercase letters
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    
    // Non-alphabetic characters remain unchanged
    return char;
  }).join('');
};

export const caesarDecrypt = (code: string, shift: number): string => {
  // Decrypting is the same as encrypting with a negative shift
  return caesarEncrypt(code, (26 - (shift % 26)) % 26);
};

// Base64 Encoding
export const base64Encrypt = (text: string): string => {
  return btoa(text);
};

export const base64Decrypt = (code: string): string => {
  try {
    return atob(code);
  } catch (error) {
    throw new Error("Invalid Base64 code");
  }
};

// Custom Symbol Encoding (using emojis)
export const emojiEncrypt = (text: string): string => {
  const emojiMap: Record<string, string> = {
    'a': '😀', 'b': '😁', 'c': '😂', 'd': '🤣', 'e': '😃', 'f': '😄', 'g': '😅', 'h': '😆', 'i': '😉',
    'j': '😊', 'k': '😋', 'l': '😎', 'm': '😍', 'n': '😘', 'o': '🥰', 'p': '😗', 'q': '😙', 'r': '😚',
    's': '🙂', 't': '🤗', 'u': '🤩', 'v': '🤔', 'w': '🤨', 'x': '😐', 'y': '😑', 'z': '😶',
    '0': '👌', '1': '👍', '2': '👎', '3': '👊', '4': '✊', '5': '🤛', '6': '🤜', '7': '👏', '8': '🙌', '9': '👐',
    ' ': '➖', '.': '⭕', ',': '❓', '?': '❔', '!': '❕'
  };

  return text.toLowerCase().split('').map(char => emojiMap[char] || char).join('');
};

export const emojiDecrypt = (code: string): string => {
  const reverseEmojiMap: Record<string, string> = {
    '😀': 'a', '😁': 'b', '😂': 'c', '🤣': 'd', '😃': 'e', '😄': 'f', '😅': 'g', '😆': 'h', '😉': 'i',
    '😊': 'j', '😋': 'k', '😎': 'l', '😍': 'm', '😘': 'n', '🥰': 'o', '😗': 'p', '😙': 'q', '😚': 'r',
    '🙂': 's', '🤗': 't', '🤩': 'u', '🤔': 'v', '🤨': 'w', '😐': 'x', '😑': 'y', '😶': 'z',
    '👌': '0', '👍': '1', '👎': '2', '👊': '3', '✊': '4', '🤛': '5', '🤜': '6', '👏': '7', '🙌': '8', '👐': '9',
    '➖': ' ', '⭕': '.', '❓': ',', '❔': '?', '❕': '!'
  };

  // Fixed emoji decryption logic - handle each emoji character properly
  let result = '';
  
  // Use Array.from with a regex to properly split emoji characters
  const characters = Array.from(code);
  
  for (const char of characters) {
    if (reverseEmojiMap[char]) {
      result += reverseEmojiMap[char];
    } else {
      result += char;
    }
  }
  
  return result;
};

// Message metadata format for detecting encryption type and password protection
export interface MessageMetadata {
  type: 'simple' | 'caesar' | 'base64' | 'emoji';
  passwordProtected: boolean;
  selfDestruct: boolean;
  shift?: number;
  messageId?: string;
  customEncryption?: boolean;
}

// Add metadata to the message to help with decryption
export const addMessageMetadata = (
  encryptedText: string, 
  metadata: MessageMetadata
): string => {
  const metadataStr = btoa(JSON.stringify(metadata));
  return `${encryptedText}||${metadataStr}`;
};

// Extract metadata from the message
export const extractMessageMetadata = (message: string): { 
  text: string; 
  metadata: MessageMetadata | null; 
} => {
  const parts = message.split('||');
  if (parts.length === 2) {
    try {
      const metadataStr = parts[1];
      const metadata = JSON.parse(atob(metadataStr));
      return { text: parts[0], metadata };
    } catch (e) {
      return { text: message, metadata: null };
    }
  }
  return { text: message, metadata: null };
};

// Password protection functions
export const passwordProtect = (text: string, password: string): string => {
  if (!password.trim()) return text;
  
  // Simple XOR encryption with password
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const passChar = password.charCodeAt(i % password.length);
    result += String.fromCharCode(textChar ^ passChar);
  }
  
  // Return base64 encoded result for better storage
  return btoa(result);
};

export const passwordUnprotect = (encryptedText: string, password: string): string => {
  if (!password.trim()) return encryptedText;
  
  try {
    // Decode base64
    const decoded = atob(encryptedText);
    
    // Reverse XOR operation
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const encChar = decoded.charCodeAt(i);
      const passChar = password.charCodeAt(i % password.length);
      result += String.fromCharCode(encChar ^ passChar);
    }
    
    // Additional validation check: If the result doesn't look like valid text,
    // we consider the password incorrect and throw an error
    const isPrintableText = /^[\x20-\x7E\s\p{Emoji_Presentation}]+$/u.test(result);
    if (!isPrintableText && result.length > 0) {
      throw new Error("Invalid password or encoded text");
    }
    
    return result;
  } catch (error) {
    // Important: Don't expose any part of the message if password is incorrect
    throw new Error("Invalid password or encoded text");
  }
};

// Detect if text is password protected
export const isLikelyPasswordProtected = (text: string): boolean => {
  try {
    // Check if it's base64 encoded first
    const decoded = atob(text);
    
    // Check if the decoded content looks like random binary data
    // This is a more strict heuristic to avoid false positives
    let randomCharCount = 0;
    for (let i = 0; i < Math.min(decoded.length, 20); i++) {
      const code = decoded.charCodeAt(i);
      if (code < 32 || code > 126) {
        randomCharCount++;
      }
    }
    
    return randomCharCount > 8; // More strict threshold
  } catch {
    return false; // Not base64 encoded
  }
};

// Check if the input might be encrypted with a specific method
export const detectEncryptionMethod = (text: string): 'simple' | 'caesar' | 'base64' | 'emoji' | null => {
  // Try to extract metadata first
  try {
    const { metadata } = extractMessageMetadata(text);
    if (metadata?.type) {
      return metadata.type;
    }
  } catch (error) {
    // Continue with detection if metadata extraction fails
  }

  // Check for emoji encoding (highest priority)
  if (/\p{Emoji}/u.test(text)) {
    return 'emoji';
  }
  
  // Check for base64 encoding
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (base64Regex.test(text) && text.length % 4 === 0) {
    try {
      const decoded = atob(text);
      // If it decodes successfully and looks like text, it's likely base64
      const isPrintable = /^[\x20-\x7E\s]+$/.test(decoded);
      if (isPrintable) {
        return 'base64';
      }
    } catch (e) {
      // Not valid base64, continue checking other formats
    }
  }
  
  // Check for simple cipher encoding with improved detection
  const simpleCipherChars = ['4', '8', '(', '|)', '3', '|=', '6', '#', '!', 
                           '_|', '|<', '1', '|v|', '|\\|', '0', '|°', '9',
                           '|2', '$', '7', '|_|', '\\/', '><', '`/', '2', '~'];
  
  // Count occurrence of simple cipher characters
  const simpleCipherCount = text.split('').filter(char => 
    simpleCipherChars.includes(char)
  ).length;
  
  if (simpleCipherCount > text.length / 3) { // Increased threshold for better accuracy
    return 'simple';
  }
  
  // Otherwise assume Caesar (default fallback)
  return 'caesar';
};
