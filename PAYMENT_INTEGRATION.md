# WICHAT Payment Integration Documentation

## Overview
This document describes the wallet recharge payment integration for WICHAT using the custom payment gateway.

## Features Implemented

### 1. **Wallet Recharge Page** (`/wallet-recharge`)
- Modern, responsive UI design
- Mobile and tablet optimized
- Multiple predefined amount options with bonus incentives
- Custom amount input
- Multiple payment methods support

### 2. **Payment Methods**

#### UPI Payment
- Shows UPI app selection modal
- Supported UPI apps:
  - Google Pay
  - PhonePe
  - Paytm
  - BHIM UPI
  - Amazon Pay
  - Navi
  - Other UPI apps (default)
- Direct deep linking to UPI apps

#### Other Payment Methods
- Credit/Debit Card
- Net Banking
- Digital Wallets

### 3. **Payment Flow**

```
User selects amount → Selects payment method → Clicks "Proceed to Pay"
    ↓
System calls API: POST /project/wallet-topup
    ↓
API returns payment URL and UPI intents
    ↓
If UPI: Show UPI app selection modal
If Other: Redirect to payment gateway
    ↓
User completes payment
    ↓
Gateway redirects back with status
    ↓
System updates wallet balance
```

## API Integration

### Endpoint
```
POST https://api.w1chat.com/project/wallet-topup
```

### Request Payload (Encrypted)

**Original Payload:**
```json
{
  "project_id": "689d783e207f0b0c309fa07c",
  "amount": 100,
  "redirect_url": "https://wichat-sigma.vercel.app/wallet-recharge"
}
```

**Sent as Encrypted:**
```json
{
  "data": "<AES_ENCRYPTED_PAYLOAD>",
  "key": "<32_CHAR_SECRET_KEY>"
}
```

The payload is encrypted using AES encryption with a randomly generated 32-character secret key before sending to the API.

### Response Format
```json
{
  "error": false,
  "paymentUrl": "https://portal.getepay.in:8443/getepayPortal/pg/v2/payment?token=...",
  "qrIntent": {
    "gpay": "tez://upi/pay?pa=...",
    "phonepe": "phonepe://upi/pay?pa=...",
    "paytm": "paytmmp://upi/pay?pa=...",
    "bhim": "bhim://upi/pay?pa=...",
    "amazonpay": "amazonpay://upi/pay?pa=...",
    "navi": "navi://upi/pay?pa=...",
    "defaultUpi": "upi://pay?pa=..."
  },
  "payment_id": "781469811",
  "order_id": "8y0ruyeqze2qu651poasbpcuflhs6s1764052114568",
  "msg": "Payment link created successfully"
}
```

## File Structure

```
src/
├── pages/
│   └── WalletRecharge.js          # Main wallet recharge page
├── api/
│   └── auth.js                     # API functions
├── component/
│   └── Menu.js                     # Updated with recharge button
└── index.js                        # Route configuration
```

## Key Components

### 1. Amount Selection
- Predefined amounts: ₹100, ₹500, ₹1,000, ₹2,000, ₹5,000, ₹10,000
- Custom amount input with validation (minimum ₹10)
- Visual feedback for selected amount
- Amount automatically fills in custom input when preset is selected

### 2. Payment Method Selection
- Visual cards with icons
- Recommended badge for UPI
- Professional icon design
- Hover and active states

### 3. Payment Summary
- Real-time calculation
- Shows recharge amount
- Displays bonus (if applicable)
- Shows total credit
- Sticky sidebar on desktop

### 4. UPI Apps Modal
- Beautiful modal design
- Grid layout of UPI apps
- App icons and branding
- Direct deep linking
- Close functionality

## Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Features
- Dynamic sidebar margins
- Window resize tracking
- Touch-optimized buttons
- Stacked layout on mobile
- Optimized spacing and typography

## Security Features

1. **Payload Encryption**: All API requests are encrypted using AES-256
   - Random 32-character secret key generated for each request
   - Payload encrypted with CryptoJS before transmission
   - Both encrypted data and key sent to API
2. **Token-based Authentication**: Bearer token in API headers
3. **Project Validation**: Checks for selected project
4. **Session Storage**: Stores pending payment details
5. **Secure Redirects**: Uses HTTPS for all payment URLs
6. **Amount Validation**: Minimum and format checks

## State Management

### Local State (useState)
- `selectedAmount`: Currently selected preset amount
- `customAmount`: User-entered custom amount
- `selectedPaymentMethod`: Chosen payment method
- `processing`: Payment processing status
- `showUpiApps`: UPI modal visibility
- `qrIntent`: UPI app links from API

### Redux State
- `walletBalance`: Current wallet balance
- `projectInfo`: Project details

### Session Storage
- `pending_payment`: Temporary storage for payment verification

## Error Handling

### Validation Errors
- Minimum amount check (₹10)
- Payment method selection required
- Project selection required

### API Errors
- Network failures
- Invalid response format
- Payment gateway errors

### User Feedback
- Toast notifications for all actions
- Loading states with animations
- Success/failure messages

## Payment Callback Handling

### URL Parameters
```
?status=success  # Payment successful
?status=failed   # Payment failed
```

### Success Flow
1. Toast notification
2. Clear session storage
3. Refresh wallet balance
4. Redirect to transactions page

### Failure Flow
1. Error toast notification
2. Clear session storage
3. Clean URL parameters
4. Allow retry

## Testing Checklist

- [ ] Amount selection works correctly
- [ ] Custom amount input validates properly
- [ ] Payment method selection updates UI
- [ ] UPI modal shows all apps
- [ ] Deep links open correct apps
- [ ] Non-UPI methods redirect correctly
- [ ] Payment callback updates wallet
- [ ] Mobile responsive layout works
- [ ] Tablet responsive layout works
- [ ] Error handling displays properly
- [ ] Loading states show correctly
- [ ] Toast notifications appear

## Environment Variables

```env
# Add to .env file if needed
REACT_APP_API_URL=https://api.w1chat.com
REACT_APP_REDIRECT_URL=https://your-domain.com/wallet-recharge
```

## Future Enhancements

1. **Promo Codes**: Implement discount code system
2. **Bonus System**: Automated bonus calculation based on amount
3. **Payment History**: Show recent transactions on page
4. **Saved Cards**: Store card details for faster checkout
5. **International Payments**: Support for international payment methods
6. **Recurring Payments**: Auto-recharge options
7. **Payment Analytics**: Track payment success rates

## Troubleshooting

### Issue: Payment not processing
**Solution**: Check if project_id is available in localStorage

### Issue: UPI apps not opening
**Solution**: Ensure device has UPI apps installed

### Issue: Wallet not updating after payment
**Solution**: Check payment callback URL and status parameters

### Issue: Responsive layout issues
**Solution**: Clear browser cache and check window.innerWidth detection

## Support

For issues or questions:
- Technical: Check browser console for errors
- API: Verify token and project_id
- UI: Test on different devices and browsers

## Version History

- **v1.0.0** (Current): Initial payment integration with custom gateway
  - UPI deep linking
  - Multiple payment methods
  - Responsive design
  - Payment callback handling

