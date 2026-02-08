import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Test script to send a guarantee receipt email
 */
async function testGuaranteeReceipt() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const receiptData = {
        tenantName: 'Mamour Diallo (TEST)',
        tenantEmail: 'bariscomoh@gmail.com', // Your email for testing
        tenantAddress: '58 Rue de Mouzaïa',
        amount: 100000,
        periodMonth: 'Garantie',
        periodStart: new Date().toLocaleDateString('fr-FR'),
        periodEnd: new Date().toLocaleDateString('fr-FR'),
        receiptNumber: `GARA-TEST-${Date.now().toString().slice(-6)}`,
        leaseId: '836025ed-bc27-454b-ae4d-5dd3f983b89f',
        ownerName: 'Dousell Immo (TEST)',
        ownerAddress: 'Dakar, Sénégal',
        ownerNinea: '',
        propertyAddress: '58 Rue de Mouzaïa',
        isGuarantee: true, // <-- This is the key flag!
    };

    console.log('📧 Sending test guarantee receipt...');
    console.log('📍 To:', receiptData.tenantEmail);
    console.log('💰 Amount:', receiptData.amount, 'FCFA');
    console.log('🏷️ isGuarantee:', receiptData.isGuarantee);

    try {
        const response = await fetch(`${baseUrl}/api/send-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('\n✅ Email sent successfully!');
            console.log('📬 Message ID:', result.messageId);
            console.log('🧾 Receipt Number:', result.receiptNumber);
        } else {
            console.error('\n❌ Error:', result.error);
        }
    } catch (error) {
        console.error('\n❌ Fetch error:', error);
    }
}

testGuaranteeReceipt();
