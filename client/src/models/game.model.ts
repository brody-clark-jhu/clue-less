//Shows data formatting of each object

//Defining the different characters were only one is able to be selected.
export type Character =
  | "Col. Mustard"
  | "Miss Scarlet"
  | "Professor Plum"
  | "Mr. Green"
  | "Mrs. White"
  | "Mrs. Peacock";

//Defining the different weapons where only one may be selected.
export type Weapon =
  | "Rope"
  | "Lead Pipe"
  | "Knife"
  | "Wrench"
  | "Candlestick"
  | "Revolver";

//Defining the different rooms where only one may be selected.
export type Room =
  | "Study"
  | "Hall"
  | "Lounge"
  | "Library"
  | "Billard Room"
  | "Dining Room"
  | "Conservatory"
  | "Ballroom"
  | "Kitchen";

//Defining the different Corridors where only one may be selected.
export type Corridor =
  | "Study-Hall" //first row
  | "Hall-Lounge" //first row
  | "Study-Library" //second row
  | "Hall-Billard Room" //second row
  | "Lounge-Dining Room" //second row
  | "Library-Billard Room" //Third row
  | "Billard Room-Dining Room" //third row
  | "Library-Conservatory" //fourth row
  | "Billard Room-Ballroom" //fourth row
  | "Dining Room-Kitchen" //fourth Row
  | "Conservatory-Ballroom" //fifth Row
  | "Ballroom-Kitchen"; //fifth row

//Defining the different SecretPassage where only one may be selected
export type SecretPassage =
  | "Study-Kitchen"
  | "Kitchen-Study"
  | "Lounge-Conservatory"
  | "Conservatory-Lounge";

//Defining the possible locations where only one may be selected
export type Location = Room | Corridor | SecretPassage;

//Defining the possible Cards available for a players hand
export interface PlayerCards {
  characters: Character[]; //allows list of available Characters
  weapons: Weapon[]; //allows list of available weapons
  rooms: Room[]; //allows list of available Rooms
}

//Defines a individual Player
export interface Player {
  id: string; //primary key of attribute
  character: Character; //character the player is using
  location: Location; //current position on the board
  cards: PlayerCards; //the players hand of cards
  isPlaying: boolean; //checks if the player is eliminated or in the game
}

//TODO: add any more needed

//TODO: Definie messages that will be passed from the Client
