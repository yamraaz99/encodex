
import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    // Add a prefix to identify our app's QR codes
    const appPrefix = "secretmsg://";
    const encodedData = appPrefix + text;
    
    return await QRCode.toDataURL(encodedData, {
      errorCorrectionLevel: 'H', // High error correction for better scanning
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const isAppQRCode = (text: string): boolean => {
  const appPrefix = "secretmsg://";
  return text.startsWith(appPrefix);
};

export const extractMessageFromQR = (text: string): string => {
  const appPrefix = "secretmsg://";
  if (text.startsWith(appPrefix)) {
    return text.substring(appPrefix.length);
  }
  return text; // Return original if not our QR code
};
