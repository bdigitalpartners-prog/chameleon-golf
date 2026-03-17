export type LeagueKey = "pga" | "liv";

export interface PlayerData {
  position: number;
  name: string;
  shortName: string;
  flag: string;
  country: string;
  score: string;
  rounds: {
    period: number;
    score: string;
    strokes: number;
  }[];
}

export interface TournamentStatus {
  state: "pre" | "in" | "post";
  detail: string;
  shortDetail: string;
  completed: boolean;
  period: number;
}

export interface LeagueData {
  league: string;
  leagueSlug: LeagueKey;
  eventName: string;
  courseName: string;
  courseLocation: string;
  purse: string;
  defendingChamp: string;
  status: TournamentStatus;
  broadcast: string;
  players: PlayerData[];
  link: string;
}
