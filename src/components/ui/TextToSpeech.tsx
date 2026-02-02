import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './button';

interface TextToSpeechProps {
    text: string;
    disabled?: boolean;
}

// Função para pontuar qualidade de vozes pt-BR
function scoreVoice(voice: SpeechSynthesisVoice): number {
    let score = 0;

    // Idioma exato
    if (voice.lang === 'pt-BR') score += 100;
    else if (voice.lang.startsWith('pt')) score += 50;

    const lowerName = voice.name.toLowerCase();

    // Vozes femininas premium conhecidas (prioridade máxima)
    if (['luciana', 'francisca', 'joana', 'fernanda', 'monica', 'marcia'].some(name => lowerName.includes(name))) {
        score += 150;
    }

    // Forte preferência por vozes femininas (melhor naturalidade em pt-BR)
    if (lowerName.includes('female') || lowerName.includes('feminina') || lowerName.includes('mulher')) {
        score += 100;
    }

    // Penalizar vozes masculinas
    if (lowerName.includes('male') && !lowerName.includes('female')) {
        score -= 50;
    }
    if (lowerName.includes('masculino') || lowerName.includes('homem')) {
        score -= 50;
    }

    // Indicadores de qualidade no nome
    if (lowerName.includes('premium') || lowerName.includes('enhanced')) score += 60;
    if (lowerName.includes('neural') || lowerName.includes('wavenet')) score += 70;

    // Vozes online geralmente têm melhor qualidade
    if (!voice.localService) score += 30;

    return score;
}

export function TextToSpeech({ text, disabled = false }: TextToSpeechProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isProcessingRef = useRef(false);

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
            isProcessingRef.current = false;
            return;
        }

        // Prevent double-play: check if already processing
        if (isProcessingRef.current) {
            return;
        }

        // Mark as processing to prevent duplicate calls
        isProcessingRef.current = true;

        // Cancel any existing speech to prevent double-play
        window.speechSynthesis.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9; // Ligeiramente mais lento para melhor compreensão
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Seleção inteligente de voz com cache
        const voices = window.speechSynthesis.getVoices();
        const ptVoices = voices.filter(voice => voice.lang.startsWith('pt'));

        // Filtrar apenas vozes femininas se houver disponíveis
        const femaleVoices = ptVoices.filter(voice => {
            const lowerName = voice.name.toLowerCase();
            return (
                lowerName.includes('female') ||
                lowerName.includes('feminina') ||
                lowerName.includes('mulher') ||
                ['luciana', 'francisca', 'joana', 'fernanda', 'monica', 'marcia'].some(name => lowerName.includes(name)) ||
                (!lowerName.includes('male') && !lowerName.includes('masculino'))
            );
        });

        // Usar vozes femininas se houver, caso contrário usar todas
        const voicesToConsider = femaleVoices.length > 0 ? femaleVoices : ptVoices;

        // Forçar nova seleção (ignorar cache para garantir melhor voz feminina)
        let bestVoice: SpeechSynthesisVoice | undefined;

        if (voicesToConsider.length > 0) {
            // Ordenar por score e pegar a melhor
            voicesToConsider.sort((a, b) => scoreVoice(b) - scoreVoice(a));
            bestVoice = voicesToConsider[0];

            // Salvar para próximas vezes
            localStorage.setItem('preferred-tts-voice', bestVoice.name);

            console.log('Selected best voice:', bestVoice.name, 'Score:', scoreVoice(bestVoice), 'Female voices available:', femaleVoices.length);
        }

        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            isProcessingRef.current = false;
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            isProcessingRef.current = false;
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            isProcessingRef.current = false;
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
