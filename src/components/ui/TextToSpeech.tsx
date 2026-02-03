import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from './button';

interface TextToSpeechProps {
    text: string;
    disabled?: boolean;
}

export function TextToSpeech({ text, disabled = false }: TextToSpeechProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopSpeaking();
        };
    }, []);

    const stopSpeaking = () => {
        // Stop HTML Audio (Google TTS)
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Stop Native TTS
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        setIsSpeaking(false);
        setIsLoading(false);
    };

    const speakNative = () => {
        // Cancel any existing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to select a Brazilian voice
        const voices = window.speechSynthesis.getVoices();
        const ptBRVoice = voices.find(voice =>
            voice.lang === 'pt-BR' ||
            (voice.lang.includes('pt') && voice.name.includes('Brasil')) ||
            (voice.lang.includes('pt') && voice.name.includes('Brazil'))
        );

        if (ptBRVoice) {
            utterance.voice = ptBRVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            console.error('Erro na síntese nativa');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleToggleSpeech = async () => {
        if (!text || disabled || isLoading) return;

        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        setIsLoading(true);

        try {
            // Try Google TTS API
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            if (!data.audio) {
                throw new Error('No audio content received');
            }

            // Create audio from base64
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);

            audio.onplay = () => {
                setIsLoading(false);
                setIsSpeaking(true);
            };

            audio.onended = () => {
                setIsSpeaking(false);
            };

            audio.onerror = (e) => {
                console.error("Erro no player de áudio:", e);
                setIsSpeaking(false);
                setIsLoading(false);
                // Try fallback if audio fails to load
                speakNative();
            };

            audioRef.current = audio;
            await audio.play();

        } catch (error) {
            console.warn('Google TTS API falhou, usando fallback nativo:', error);
            setIsLoading(false);
            // Fallback to native synthesis
            speakNative();
        }
    };

    // Ensure native voices are loaded (for fallback)
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    if (!text) return null;

    return (
        <Button
            type="button"
            variant={isSpeaking ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSpeech}
            disabled={disabled || isLoading}
            className={`flex items-center gap-2 ${isSpeaking ? 'animate-pulse' : ''}`}
            title={isSpeaking ? 'Parar leitura' : 'Ler em voz alta'}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Carregando...</span>
                </>
            ) : isSpeaking ? (
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
