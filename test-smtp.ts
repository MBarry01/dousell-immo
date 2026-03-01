import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testConnection() {
    // Testing noreply instead of contact because user said noreply is for receipts
    const user = "noreply@dousel.com";
    const pass = process.env.GMAIL_APP_PASSWORD;

    const results: any = {
        user,
        passLength: pass ? `${pass.substring(0, 3)}...${pass.length}` : 'MISSING',
        status: 'unknown'
    };

    if (!pass) {
        results.status = 'missing_credentials';
        fs.writeFileSync('smtp-debug.json', JSON.stringify(results, null, 2), 'utf-8');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        await transporter.verify();
        results.status = 'SUCCESS - valid credentials';
    } catch (error: any) {
        results.status = 'FAILED';
        results.code = error.code;
        results.responseCode = error.responseCode;
        results.response = error.response;
        results.command = error.command;
    }

    fs.writeFileSync('smtp-debug.json', JSON.stringify(results, null, 2), 'utf-8');
}

testConnection();
