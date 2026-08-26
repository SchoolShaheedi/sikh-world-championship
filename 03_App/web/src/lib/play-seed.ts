/**
 * Demo posts, so the board isn't empty while there are no real players.
 * Seeds once, on first read. Delete this file when real sign-ups exist.
 */
import { allPosts, createPost } from "./play-store";
import type { Game, Intensity, Platform, PresetNote, Window } from "./play-types";

const SEED: {
  playerId: string;
  displayName: string;
  avatarId: string;
  region: string;
  game: Game;
  platform: Platform;
  windows: Window[];
  intensity: Intensity;
  note: PresetNote;
  gamertag: string;
  ageBand: "U16" | "16+";
  eventVerified: boolean;
}[] = [
  { playerId: "s1", displayName: "Arjan",   avatarId: "navy-1",  region: "Southall",   game: "EA FC 26", platform: "PS5", windows: ["Weekday evenings", "Sunday evening"], intensity: "Competitive",  note: "Looking for regular games", gamertag: "arjan_ldn", ageBand: "16+", eventVerified: true },
  { playerId: "s2", displayName: "Simran",  avatarId: "royal-1", region: "Leicester",  game: "EA FC 26", platform: "PS5", windows: ["Saturday daytime"], intensity: "Just for fun",  note: "New to this, happy to learn", gamertag: "simran_k", ageBand: "16+", eventVerified: false },
  { playerId: "s3", displayName: "Harman",  avatarId: "black-1", region: "Slough",     game: "Rocket League", platform: "PS5", windows: ["Weekday late night"], intensity: "Either", note: "Happy to play with anyone", gamertag: "harmanrl", ageBand: "16+", eventVerified: true },
  { playerId: "s4", displayName: "Gurdeep", avatarId: "gold-1",  region: "Wolverhampton", game: "EA FC 26", platform: "PS5", windows: ["Weekday evenings", "Saturday evening"], intensity: "Competitive", note: "Would like a decent challenge", gamertag: "gurdeep_7", ageBand: "16+", eventVerified: false },
  { playerId: "s5", displayName: "Navjot",  avatarId: "green-1", region: "Coventry",   game: "Call of Duty", platform: "PS5", windows: ["Sunday daytime"], intensity: "Just for fun", note: "Prefer a relaxed game, no rage", gamertag: "navjot_cov", ageBand: "U16", eventVerified: true },
  { playerId: "s6", displayName: "Tegh",    avatarId: "white-1", region: "Manchester", game: "EA FC 26", platform: "PS5", windows: ["Weekday evenings"], intensity: "Either", note: "Up for a rematch any time", gamertag: "tegh_mcr", ageBand: "U16", eventVerified: true },
  { playerId: "s7", displayName: "Amrit",   avatarId: "patka-1", region: "Derby",      game: "EA FC 26", platform: "PS5", windows: ["Saturday daytime", "Sunday daytime"], intensity: "Just for fun", note: "New to this, happy to learn", gamertag: "amrit_d", ageBand: "U16", eventVerified: true },
  { playerId: "s8", displayName: "Jasleen", avatarId: "patka-4", region: "Birmingham", game: "Rocket League", platform: "PS5", windows: ["Weekday evenings"], intensity: "Either", note: "Happy to play with anyone", gamertag: "jasleen_b", ageBand: "U16", eventVerified: false },
];

export async function ensureSeeded(): Promise<void> {
  if ((await allPosts()).length > 0) return;
  for (const s of SEED) {
    const { gamertag, ...rest } = s;
    void gamertag;
    await createPost(rest);
  }
}
