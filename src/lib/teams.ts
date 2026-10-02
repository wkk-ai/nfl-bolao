export type TeamMeta = {
  abbr: string;
  city: string;
  nick: string;
  primary: string;
  secondary: string;
};

export const TEAMS: Record<string, TeamMeta> = {
  ARI: { abbr: "ARI", city: "Arizona", nick: "Cardinals", primary: "#97233F", secondary: "#000000" },
  ATL: { abbr: "ATL", city: "Atlanta", nick: "Falcons", primary: "#A71930", secondary: "#000000" },
  BAL: { abbr: "BAL", city: "Baltimore", nick: "Ravens", primary: "#241773", secondary: "#9E7C0C" },
  BUF: { abbr: "BUF", city: "Buffalo", nick: "Bills", primary: "#00338D", secondary: "#C60C30" },
  CAR: { abbr: "CAR", city: "Carolina", nick: "Panthers", primary: "#0085CA", secondary: "#101820" },
  CHI: { abbr: "CHI", city: "Chicago", nick: "Bears", primary: "#0B162A", secondary: "#C83803" },
  CIN: { abbr: "CIN", city: "Cincinnati", nick: "Bengals", primary: "#FB4F14", secondary: "#000000" },
  CLE: { abbr: "CLE", city: "Cleveland", nick: "Browns", primary: "#311D00", secondary: "#FF3C00" },
  DAL: { abbr: "DAL", city: "Dallas", nick: "Cowboys", primary: "#003594", secondary: "#869397" },
  DEN: { abbr: "DEN", city: "Denver", nick: "Broncos", primary: "#FB4F14", secondary: "#002244" },
  DET: { abbr: "DET", city: "Detroit", nick: "Lions", primary: "#0076B6", secondary: "#B0B7BC" },
  GB: { abbr: "GB", city: "Green Bay", nick: "Packers", primary: "#203731", secondary: "#FFB612" },
  HOU: { abbr: "HOU", city: "Houston", nick: "Texans", primary: "#03202F", secondary: "#A71930" },
  IND: { abbr: "IND", city: "Indianapolis", nick: "Colts", primary: "#002C5F", secondary: "#A2AAAD" },
  JAX: { abbr: "JAX", city: "Jacksonville", nick: "Jaguars", primary: "#006778", secondary: "#D7A22A" },
  KC: { abbr: "KC", city: "Kansas City", nick: "Chiefs", primary: "#E31837", secondary: "#FFB81C" },
  LAC: { abbr: "LAC", city: "Los Angeles", nick: "Chargers", primary: "#0080C6", secondary: "#FFC20E" },
  LAR: { abbr: "LAR", city: "Los Angeles", nick: "Rams", primary: "#003594", secondary: "#FFA300" },
  LV: { abbr: "LV", city: "Las Vegas", nick: "Raiders", primary: "#000000", secondary: "#A5ACAF" },
  MIA: { abbr: "MIA", city: "Miami", nick: "Dolphins", primary: "#008E97", secondary: "#FC4C02" },
  MIN: { abbr: "MIN", city: "Minnesota", nick: "Vikings", primary: "#4F2683", secondary: "#FFC62F" },
  NE: { abbr: "NE", city: "New England", nick: "Patriots", primary: "#002244", secondary: "#C60C30" },
  NO: { abbr: "NO", city: "New Orleans", nick: "Saints", primary: "#D3BC8D", secondary: "#101820" },
  NYG: { abbr: "NYG", city: "New York", nick: "Giants", primary: "#0B2265", secondary: "#A71930" },
  NYJ: { abbr: "NYJ", city: "New York", nick: "Jets", primary: "#125740", secondary: "#000000" },
  PHI: { abbr: "PHI", city: "Philadelphia", nick: "Eagles", primary: "#004C54", secondary: "#A5ACAF" },
  PIT: { abbr: "PIT", city: "Pittsburgh", nick: "Steelers", primary: "#101820", secondary: "#FFB612" },
  SEA: { abbr: "SEA", city: "Seattle", nick: "Seahawks", primary: "#002244", secondary: "#69BE28" },
  SF: { abbr: "SF", city: "San Francisco", nick: "49ers", primary: "#AA0000", secondary: "#B3995D" },
  TB: { abbr: "TB", city: "Tampa Bay", nick: "Buccaneers", primary: "#D50A0A", secondary: "#FF7900" },
  TEN: { abbr: "TEN", city: "Tennessee", nick: "Titans", primary: "#0C2340", secondary: "#4B92DB" },
  WSH: { abbr: "WSH", city: "Washington", nick: "Commanders", primary: "#5A1414", secondary: "#FFB612" },
  WAS: { abbr: "WAS", city: "Washington", nick: "Commanders", primary: "#5A1414", secondary: "#FFB612" },
};

export function teamMeta(abbr: string): TeamMeta {
  return (
    TEAMS[abbr] ?? {
      abbr,
      city: abbr,
      nick: abbr,
      primary: "#888888",
      secondary: "#222222",
    }
  );
}

export function teamLogo(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

export function teamLabel(abbr: string): string {
  const t = teamMeta(abbr);
  return `${t.city} ${t.nick}`;
}
