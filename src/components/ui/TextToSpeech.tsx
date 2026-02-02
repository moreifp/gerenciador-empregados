import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './button';

interface TextToSpeechProps {
    text: string;
    disabled?: boolean;
}

export function TextToSpeech({ text, disabled = false }: TextToSpeechProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleToggleSpeech = () => {
        if (!text || disabled) return;

        // If already speaking, stop it
        if (isSpeaking || window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Cancel any existing speech to prevent double-play
        window.speechSynthesis.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0;

        // Explicitly try to find a Brazilian Portuguese voice
        const voices = window.speechSynthesis.getVoices();
        const ptBRVoice = voices.find(voice =>
            voice.lang === 'pt-BR' ||
            (voice.lang.includes('pt') && voice.name.includes('Brasil')) ||
            (voice.lang.includes('pt') && voice.name.includes('Brazil'))
        );

        if (ptBRVoice) {
            utterance.voice = ptBRVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            console.error('Erro ao reproduzir áudio');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded (needed for some browsers like Chrome)
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Don't render if no text or speechSynthesis not supported
    if (!text || !window.speechSynthesis) return null;

    return (
        <Button
            type="button"
            variant={isSpeaking ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSpeech}
            disabled={disabled}
            className={`flex items-center gap-2 ${isSpeaking ? 'animate-pulse' : ''}`}
            title={isSpeaking ? 'Parar leitura' : 'Ler em voz alta'}
        >
            {isSpeaking ? (
                <>
                    <VolumeX className="h-4 w-4" />
                    <span className="hidden sm:inline">Parar</span>
                </>
            ) : (
                <>
                    <Volume2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Ler em Voz Alta</span>
                </>
            )}
        </Button>
    );
}
