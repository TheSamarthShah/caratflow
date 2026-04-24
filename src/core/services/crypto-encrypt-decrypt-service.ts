import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class CryptoService {
    private static secret: string = 'myStrongSecretKey';

    async encryptData(data: any): Promise<string> {
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(CryptoService.secret.padEnd(32)), // 256-bit key
            'AES-GCM',
            false,
            ['encrypt']
        );

        const encodedData = encoder.encode(JSON.stringify(data));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encodedData
        );

        // Combine iv and encrypted data and base64 encode
        const encryptedBytes = new Uint8Array(encrypted);
        const fullData = new Uint8Array(iv.length + encryptedBytes.length);
        fullData.set(iv);
        fullData.set(encryptedBytes, iv.length);

        return btoa(String.fromCharCode(...fullData));
    }

    async decryptData(encryptedB64: string): Promise<any> {
        const convertedData = atob(encryptedB64);
        const encryptedData = Uint8Array.from(convertedData, c => c.charCodeAt(0));

        const iv = encryptedData.slice(0, 12); // First 12 bytes
        const data = encryptedData.slice(12); // Remaining is the ciphertext

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(CryptoService.secret.padEnd(32)),
            'AES-GCM',
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            {
            name: 'AES-GCM',
            iv: iv
            },
            key,
            data
        );

        const decodedString = new TextDecoder().decode(decrypted);
        return JSON.parse(decodedString);
    }
}