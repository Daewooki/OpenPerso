export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  tier: "free" | "premium";
  is_admin: boolean;
}

export interface UsageItem {
  used: number;
  limit: number;
  remaining: number;
}

export interface UsageInfo {
  tier: string;
  usage: {
    messages: UsageItem;
    persona_create: UsageItem;
    ai_generate: UsageItem;
    image_gen: UsageItem;
    tts: UsageItem;
    voice_clone: UsageItem;
  };
}

export interface VoiceConfig {
  tts_voice?: string;
  elevenlabs_voice_id?: string;
  is_cloned?: boolean;
}

export interface Persona {
  id: string;
  creator_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  system_prompt: string;
  greeting_message: string;
  personality: Record<string, unknown> | null;
  voice_config: VoiceConfig | null;
  visibility: string;
  category: string;
  tags: string[] | null;
  chat_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
  is_liked?: boolean;
}

export interface PersonaListItem {
  id: string;
  creator_id: string;
  name: string;
  tagline: string | null;
  avatar_url: string | null;
  category: string;
  chat_count: number;
  like_count: number;
  creator_name?: string | null;
  is_liked?: boolean;
}

export interface Conversation {
  id: string;
  persona_id: string;
  title: string | null;
  summary: string | null;
  last_message_at: string | null;
  created_at: string;
  persona_name?: string | null;
  persona_avatar_url?: string | null;
  persona_category?: string | null;
  conversation_starters?: string[] | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_url: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type PersonaCategory =
  | "celebrity"
  | "anime_game"
  | "original"
  | "helper"
  | "friend"
  | "k_content"
  | "healing";

export const CATEGORY_LABELS: Record<PersonaCategory, string> = {
  celebrity: "유명인 / 역사인물",
  anime_game: "애니·만화·게임",
  original: "나만의 캐릭터",
  helper: "도우미",
  friend: "친구 / 롤플레이",
  k_content: "K-콘텐츠",
  healing: "감성 / 힐링",
};
