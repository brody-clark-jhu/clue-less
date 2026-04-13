export type PlayerState = { playerId: string; clickCount: number };

export interface WelcomeResponse {
  playerId: string;
}
export interface PlayerJoinedEvent {
  playerId: string;
}
export interface GameState {
  playerStates: PlayerState[];
}

export interface MovePayload {
  destination: string;
}
export interface SuggestionPayload {
  suspect: string;
  weapon: string;
}
export interface AccusationPayload {
  suspect: string;
  weapon: string;
  room: string;
}
export interface DisprovePayload {
  card: string;
}

export type Character =     
  | "Miss Scarlet"           
  | "Colonel Mustard"       
  | "Mrs. White"            
  | "Mr. Green"             
  | "Mrs. Peacock"           
  | "Professor Plum";      

export interface LobbyPlayer {       
  playerId: string;                
  playerNumber: number;             
  character: Character | null;       
  isReady: boolean;                 
  isHost: boolean;                
}                                   

export interface CharacterSelectPayload {
  character: Character;                 
}                                

export interface ReadyUpPayload { 
  ready: boolean;                
}                                

export interface StartGamePayload {}

// (player joins, selects character, readies up)
export interface LobbyUpdateEvent { 
  players: LobbyPlayer[];          
}                                  

// sent by server to all when a character is claimed/released
export interface CharacterSelectedEvent { 
  playerId: string;                      
  character: Character | null;            
}                                       

// sent by server to all when host starts the game
export interface GameStartedEvent { 
  startingPlayerId: string;               
}         

export type ClientCommand =
  | { type: "move"; payload: MovePayload }
  | { type: "suggest"; payload: SuggestionPayload }
  | { type: "accuse"; payload: AccusationPayload }
  | { type: "disprove"; payload: DisprovePayload }
  | { type: "character_select"; payload: CharacterSelectPayload } 
  | { type: "ready_up"; payload: ReadyUpPayload }            
  | { type: "start_game"; payload: StartGamePayload };            

export type ServerEvent =
  | { type: "player_joined"; payload: PlayerJoinedEvent }
  | { type: "welcome"; payload: WelcomeResponse }
  | { type: "game_update"; payload: GameState }
  | { type: "lobby_update"; payload: LobbyUpdateEvent }            
  | { type: "character_selected"; payload: CharacterSelectedEvent }
  | { type: "game_started"; payload: GameStartedEvent };         

export type Message = ClientCommand | ServerEvent;
