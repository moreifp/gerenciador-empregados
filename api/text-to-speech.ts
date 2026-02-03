import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Função para preprocessar texto antes de enviar ao TTS
function preprocessText(text: string): string {
    let processed = text;

    // Normalizar números (até 99)
    const numberToWords = (num: number): string => {
        const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];

        if (num < 10) return units[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return unit === 0 ? tens[ten] : `${tens[ten]} e ${units[unit]}`;
        }
        return num.toString();
    };

    processed = processed.replace(/\b(\d{1,2})\b/g, (numStr) => {
        const num = parseInt(numStr);
        return numberToWords(num);
    });

    // Normalizar datas (DD/MM/YYYY)
    processed = processed.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        (_match, day, month, year) => {
            const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const monthIndex = parseInt(month) - 1;
            return `${day} de ${months[monthIndex] || month} de ${year}`;
        }
    );

    // Adicionar pausas após pontuação
    processed = processed.replace(/\./g, '. ');
    processed = processed.replace(/,/g, ', ');
    processed = processed.replace(/:/g, ': ');
    processed = processed.replace(/;/g, '; ');

    // Remover caracteres que causam problemas
    processed = processed.replace(/[_*#]/g, '');

    return processed.trim();
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Apenas aceitar POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Preprocessar o texto
        const processedText = preprocessText(text);

        // Configurar credenciais do Google Cloud
        const credentials = {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        // Criar cliente do Google Cloud Text-to-Speech
        const client = new TextToSpeechClient({
            credentials,
            projectId: process.env.GOOGLE_PROJECT_ID,
        });

        // Configurar a requisição para o Google TTS
        const request = {
            input: { text: processedText },
            voice: {
                languageCode: 'pt-BR',
                // Usar voz feminina WaveNet de alta qualidade
                name: 'pt-BR-Wavenet-A',
                ssmlGender: 'FEMALE' as const,
            },
            audioConfig: {
                audioEncoding: 'MP3' as const,
                speakingRate: 0.85, // Mais lento para melhor naturalidade
                pitch: 0.0,
                volumeGainDb: 0.0,
            },
        };

        // Chamar a API do Google Cloud Text-to-Speech
        const [response] = await client.synthesizeSpeech(request);

        if (!response.audioContent) {
            throw new Error('No audio content received from Google TTS');
        }

        // Converter o áudio para base64
        const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');

        // Retornar o áudio em formato base64
        return res.status(200).json({
            audio: audioBase64,
            contentType: 'audio/mp3',
        });

    } catch (error) {
        console.error('Error in text-to-speech API:', error);
        return res.status(500).json({
            error: 'Failed to generate speech',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
