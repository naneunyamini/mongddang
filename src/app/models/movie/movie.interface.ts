export interface Movie {
  id: string;
  title: string;
  directorName: string;
  genre: string;
  contents: string;
  runningTime: number;
  posterUrl: string;
  stillUrl: string;
  favorite: number;
  nation: string;
  company: string;
  ratedYn: boolean;
  type: string;
  actor: string;
  releasedAt: string;
  createdAt: string;
  modifiedAt: string;
}

export type MoviePreview = Pick<Movie, 'id' | 'title' | 'posterUrl'>;

export type MoviesByGenre = Record<string, Movie[]>;
