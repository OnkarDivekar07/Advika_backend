const axios = require('axios');

/**
 * Sends a WhatsApp template message to a supplier asking if a product is available.
 * If imageUrl is provided, includes an image header. Otherwise sends text-only template.
 */
const sendProductMessage = async (phone, supplierName, productName, qty, imageUrl, itemId) => {
  const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
  const ACCESS_TOKEN    = process.env.WA_ACCESS_TOKEN;

  // Build header component only if we have a real image URL
  const headerComponent = imageUrl
    ? [{
        type: 'header',
        parameters: [{ type: 'image', image: { link: imageUrl } }],
      }]
    : [];

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: `91${phone}`,
      type: 'template',
      template: {
        name: 'supplier_order_request',
        language: { code: 'en' },
        components: [
          ...headerComponent,
          {
            type: 'body',
            parameters: [
              { type: 'text', text: productName },
              { type: 'text', text: qty.toString() },
            ],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '0',
            parameters: [{ type: 'payload', payload: `AVAILABLE_${itemId}` }],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '1',
            parameters: [{ type: 'payload', payload: `NOT_AVAILABLE_${itemId}` }],
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

module.exports = { sendProductMessage };
