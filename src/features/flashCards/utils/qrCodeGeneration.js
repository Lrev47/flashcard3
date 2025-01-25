import QRCode from 'qrcode';

export async function generateCardQRCode(cardId) {

  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';

  const fullUrl = `${baseUrl}/cards/${cardId}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(fullUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}
