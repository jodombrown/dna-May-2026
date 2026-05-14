/**
 * Shared voice-note bubble. Single source of truth across DM and group chat.
 * Wraps the existing VoiceMessagePlayer (waveform scrubber, playback speed,
 * tap-to-seek) so callers do not import surface-specific players.
 */
export { VoiceMessagePlayer as VoiceBubble } from '@/components/messaging/inbox/VoiceMessagePlayer';
export { VoiceMessageRecorder as VoiceBubbleRecorder } from '@/components/messaging/inbox/VoiceMessageRecorder';
