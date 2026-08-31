import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FavoriteService } from 'src/app/services/favorite/favorite.service';
import { MovieService } from 'src/app/services/movie/movie.service';
import { GetMovieByIdResponseData } from 'src/app/models/movie/movie-getmoviebyid-response-data.interface';
import { jwtDecode } from 'jwt-decode';
import { GetUserResponseData } from 'src/app/models/user/user-getuser-response.data.interface';
import { UserService } from 'src/app/services/user/user.service';
import { Movie, MoviePreview, MoviesByGenre } from 'src/app/models/movie/movie.interface';

@Component({
  selector: 'app-recommendation',
  templateUrl: './recommendation.page.html',
  styleUrls: ['./recommendation.page.scss']
})
export class RecommendationPage implements OnInit {
  isLoggedIn: boolean = false;
  user = { username: '', email: '' };
  nickname: string | null = null; // 사용자 닉네임
  likedMovies: MoviePreview[] = [];
  movies: Movie[] = []; // movies 속성 추가
  selectedMovies: Movie[] = []; // 사용자가 선택한 영화 목록
  moviesGroupedByGenre: MoviesByGenre = {}; // 장르별로 그룹화된 영화 데이터
  Object = Object; // Object를 템플릿에서 사용할 수 있도록 추가
  genres: string[] = []; // 장르 키 배열 추가

  constructor(
    private authService: AuthService,
    private favoriteService: FavoriteService,
    private movieService: MovieService,
    private userService: UserService,
    private router: Router
  ) {}

 
  ngOnInit(): void {
    this.authService.getLoginStatus().subscribe({
      next: (status) => {
        this.isLoggedIn = status;
  
        if (this.isLoggedIn) {
          const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
          const recommendationShown = localStorage.getItem('recommendationShown') === 'true';
  
          console.log('isFirstLogin:', isFirstLogin);
          console.log('recommendationShown:', recommendationShown);
  
          // 첫 로그인 시 추천 페이지 표시
          if (isFirstLogin && !recommendationShown) {
            console.log('추천 페이지를 표시합니다.');
            this.getUserData(); // 사용자 데이터 로드
            this.loadMovies(); // 영화 데이터 로드
          } else if (!recommendationShown) {
            console.log('추천 페이지 유지');
            this.getUserData(); // 사용자 데이터 로드
            this.loadMovies(); // 영화 데이터 로드
          } else {
            // 이미 추천 페이지를 표시했다면 홈으로 이동
            console.log('이미 추천 페이지를 표시했으므로 홈으로 이동합니다.');
            this.router.navigate(['/home']);
          }
        } else {
          // 로그인하지 않은 경우 로그인 페이지로 이동
          console.log('로그인하지 않았으므로 로그인 페이지로 이동합니다.');
          this.router.navigate(['/auth/login']);
        }
      },
      error: (err) => {
        console.error('로그인 상태 확인 중 오류 발생:', err);
      },
    });
  }
  
  
  // 페이지 완료 후 플래그 저장
  completeRecommendationProcess() {
    localStorage.setItem('recommendationShown', 'true'); // 페이지 표시 완료 기록
    this.router.navigate(['/home']); // Home 페이지로 리다이렉트
  }
  
  // 사용자 데이터를 가져오는 메서드
  getUserData() {
    const email = this.getUserEmailFromToken();
    if (email) {
      this.userService.getUserByEmail(email).subscribe({
        next: (user: GetUserResponseData) => {
          console.log('User Data:', user);
          this.user = user;
        },
        error: (err) => {
          console.error('사용자 정보를 가져오는 중 오류:', err);
        }
      });
    } else {
      console.warn('No email found in token');
      this.isLoggedIn = false;
    }
  }

  // JWT 토큰에서 이메일 추출
  private getUserEmailFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.email;
    }
    return null;
  }
  getUserFavorites() {
    const userId = parseInt(this.authService.getUserIdFromToken()!, 10);
    if (!isNaN(userId) && userId > 0) {
      this.favoriteService.getUserFavorites(userId).subscribe({
        next: (favorites) => {
          console.log('User Favorites:', favorites);
          favorites.forEach((favorite) => {
            this.getMovieDetails(favorite.movieId);
          });
        },
        error: (err) => {
          console.error('Error fetching favorites:', err);
        }
      });
    } else {
      console.error('Invalid user ID.');
    }
  }

  getMovieDetails(movieId: number) {
    this.movieService.getMovieById(movieId.toString()).subscribe({
      next: (movie: GetMovieByIdResponseData) => {
        this.likedMovies.push({
          id: movie.id,
          title: movie.title || '제목 없음',
          posterUrl: movie.posterUrl || '/assets/default-poster.jpg',
        });
        console.log('Liked Movies:', this.likedMovies);
      },
      error: (err) => {
        console.error(`Error fetching movie details for movie ID ${movieId}:`, err);
      }
    });
  }

  selectMovie(movie: Movie) {
    console.log('Selected movie:', movie);
  }
  navigateToHome() {
    this.router.navigate(['/home']); // Home 페이지로 이동
  }
  loadMovies() {
    this.movieService.getMovies().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          const groupedByGenre: MoviesByGenre = {};
          response.forEach((movie) => {
            const genre = movie.genre || '기타';
            if (!groupedByGenre[genre]) {
              groupedByGenre[genre] = [];
            }
            groupedByGenre[genre].push(movie);
          });
  
          this.moviesGroupedByGenre = groupedByGenre;
          this.genres = Object.keys(groupedByGenre); // 장르 키 배열
          console.log('Movies grouped by genre:', this.moviesGroupedByGenre);
        } else {
          console.error('No movies available.');
        }
      },
      error: (err) => {
        console.error('Error loading movies:', err);
      },
    });
  }
  
  toggleMovieSelection(movie: Movie) {
    const index = this.selectedMovies.findIndex((item) => item.id === movie.id);
    if (index > -1) {
      this.selectedMovies.splice(index, 1); // 이미 선택된 영화라면 선택 해제
    } else {
      this.selectedMovies.push(movie); // 선택되지 않은 영화라면 추가
    }
  }
  
  isSelected(movie: Movie): boolean {
    return this.selectedMovies.some((item) => item.id === movie.id);
  }
  
  goToShowRecommendedGenre() {
    if (this.selectedMovies.length === 0) {
      alert('먼저 영화를 선택해주세요!');
      return;
    }
  
    const genreCounts: { [key: string]: number } = {};
  
    this.selectedMovies.forEach((movie) => {
      const genre = this.getGenreByMovie(movie);
      if (!genreCounts[genre]) {
        genreCounts[genre] = 0;
      }
      genreCounts[genre]++;
    });
  
    const mostFrequentGenre = Object.keys(genreCounts).reduce((a, b) =>
      genreCounts[a] > genreCounts[b] ? a : b
    );
  
    // 선택된 장르를 로컬 스토리지에 저장
    localStorage.setItem('selectedGenre', mostFrequentGenre);
  
    // Home 페이지로 이동하며 선택된 장르 전달
    this.router.navigate(['/home'], { queryParams: { genre: mostFrequentGenre } });
  }
  
  
  getGenreByMovie(movie: Movie): string {
    console.log('Finding genre for movie:', movie);
  
    const foundGenre = Object.keys(this.moviesGroupedByGenre).find((genre) =>
      this.moviesGroupedByGenre[genre].some((item) => item.id === movie.id)
    );
  
    console.log('Found genre:', foundGenre);
  
    return foundGenre || '기타';
  }
  goToRecommendationProcess() {
    // 장르 선택 페이지로 이동
    this.router.navigate(['/recommendation']);
  }
  
  
}
