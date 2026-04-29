export interface NewsMotd {
  id: string;
  title: string;
  tabTitle: string;
  body: string;
  image: string;
  tileImage: string;
  sortingPriority: number;
  hidden: boolean;
}

export interface NewsBrSection {
  hash: string;
  date: string;
  image: string;
  motds: NewsMotd[];
}

export interface NewsStwMessage {
  title: string;
  body: string;
  image: string;
}

export interface NewsStwSection {
  hash: string;
  date: string;
  messages: NewsStwMessage[];
}

export interface NewsResponse {
  br: NewsBrSection;
  stw: NewsStwSection;
}
