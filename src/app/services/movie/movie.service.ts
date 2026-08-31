import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {GetMoviesResponseData} from "../../models/movie/movie-getmovie-response-data.interface";
import {GetMovieByIdResponseData} from "../../models/movie/movie-getmoviebyid-response-data.interface";
import {map} from "rxjs/operators";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn :'root',
})
export class MovieService {
  private readonly apiUrl = `${environment.apiBaseUrl}/movies`;
  private readonly mockMoviesUrl = 'assets/mock/movies.json';

  constructor(private http: HttpClient) {
  }
  
  // 영화 목록 조회
  getMovies(): Observable<GetMoviesResponseData[]> {
    if (environment.useMockMovies) {
      return this.http.get<GetMoviesResponseData[]>(this.mockMoviesUrl);
    }

    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.get<GetMoviesResponseData[]>(`${this.apiUrl}`, { headers })
  }

  // 영화 조회
  getMovieById(id:string): Observable<GetMovieByIdResponseData>{
    if (environment.useMockMovies) {
      return this.getMovies().pipe(
        map((movies) => {
          const movie = movies.find((item) => item.id === id);

          if (!movie) {
            throw new Error(`Movie not found: ${id}`);
          }

          return movie;
        }),
      );
    }

    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.get<GetMovieByIdResponseData>(`${this.apiUrl}/${id}`, { headers})
  }

}
