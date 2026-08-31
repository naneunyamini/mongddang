import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PostCollectionRequestData,
  PostCollectionResponseData
} from "../../models/collection/collection-postcollection.interface.data";
import { GetCollectionsResponseData } from "../../models/collection/collection-getcollections.interface.data";
import {
  UpdateCollectionRequestData,
  UpdateCollectionResponseData
} from "../../models/collection/collection-updatecollection.interface.data";

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/collections`;
  private readonly mockCollectionsUrl = 'assets/mock/collections.json';

  constructor(private http: HttpClient) {}

  // 컬렉션 생성
  createCollection(payload: PostCollectionRequestData): Observable<PostCollectionResponseData> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<PostCollectionResponseData>(`${this.apiUrl}`, payload, { headers });
  }

  // 컬렉션 조회
  getCollections(): Observable<GetCollectionsResponseData[]> {
    if (environment.demoMode) {
      return this.http
        .get<GetCollectionsResponseData[]>(this.mockCollectionsUrl)
        .pipe(delay(environment.demoRequestDelayMs));
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<GetCollectionsResponseData[]>(`${this.apiUrl}?includeMovies=true`, { headers });
  }

  // 특정 컬렉션 조회 (ID로)
  getCollectionById(collectionId: number): Observable<GetCollectionsResponseData> {
    if (environment.demoMode) {
      return this.getCollections().pipe(
        map((collections) => {
          const collection = collections.find((item) => item.id === collectionId);

          if (!collection) {
            throw new Error(`Collection not found: ${collectionId}`);
          }

          return collection;
        }),
      );
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<GetCollectionsResponseData>(`${this.apiUrl}/${collectionId}`, { headers });
  }

  // 특정 사용자의 컬렉션 조회
  getUserCollections(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  // 컬렉션 업데이트
  updateCollection(id: number, payload: UpdateCollectionRequestData): Observable<UpdateCollectionResponseData[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<UpdateCollectionResponseData[]>(`${this.apiUrl}/${id}`, payload, { headers });
  }

  // 컬렉션에 영화 추가
  addMovieToCollection(collectionId: number, movieId: string): Observable<any> {
    const url = `${this.apiUrl}/${collectionId}/movies/${movieId}`;
    return this.http.post<any>(url, {});
  }

  // 컬렉션 삭제
  deleteCollection(collectionId: number): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${collectionId}`, { headers });
  }

  // 공유된 컬렉션 조회
  getSharedCollections(): Observable<GetCollectionsResponseData[]> {
    if (environment.demoMode) {
      return this.getCollections();
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<GetCollectionsResponseData[]>(`${this.apiUrl}/shared`, { headers });
  }

  // 컬렉션 공유
  shareCollection(collectionId: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/share/${collectionId}`, {}, { headers });
  }

  // 하트 상태와 favoriteCount 업데이트
  updateFavoriteStatus(collectionId: number, isFavorite: boolean): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(`${this.apiUrl}/${collectionId}/favorite`, { isFavorite }, { headers });
  }
}
