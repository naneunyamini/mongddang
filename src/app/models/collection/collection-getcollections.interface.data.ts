import { MoviePreview } from '../movie/movie.interface';

export interface GetCollectionsResponseData{
  id: number;
  name: string;
  like: number;
  movies: MoviePreview[];
  createdAt: string;
  modifiedAt: string;
}
