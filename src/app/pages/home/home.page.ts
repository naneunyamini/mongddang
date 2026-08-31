import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { MovieService } from "../../services/movie/movie.service";
import { GetMoviesResponseData } from "../../models/movie/movie-getmovie-response-data.interface";
import { environment } from "../../../environments/environment";
import { MoviesByGenre } from "../../models/movie/movie.interface";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements AfterViewInit {
  readonly chatbotEnabled = environment.chatbotEnabled;
  @ViewChild('swiper_cgv') swiperRef_cgv!: ElementRef;
  @ViewChild('swiper_netflix') swiperRef_netflix!: ElementRef;
  @ViewChild('swiper_genre') swiperRef_genre!: ElementRef;
  @ViewChild('swiper_recommended') swiperRef_recommended!: ElementRef;
  @ViewChild('elementRef', { static: false }) elementRef!: ElementRef;

   // 챗봇 모달 열림/닫힘 상태
   isChatbotModalOpen: boolean = false;
  movies: GetMoviesResponseData[] = [];
  recommendedMovies: GetMoviesResponseData[] = []; // 추천 영화 데이터
  genres: string[] = [];
  moviesGroupedByGenre: MoviesByGenre = {};


  toggleChatbotModal() {
    this.isChatbotModalOpen = !this.isChatbotModalOpen; // 모달 열기/닫기 토글
  }
  // 모달 닫힘 처리
  closeChatbotModal() {
    this.isChatbotModalOpen = false;
  }
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private movieService: MovieService) { }

    ngOnInit() {
      this.getMovies(() => {
        this.activatedRoute.queryParams.subscribe((params: { [key: string]: string }) => {
          const selectedGenre = params['genre'] || localStorage.getItem('selectedGenre');
          if (selectedGenre) {
            console.log('Loading recommended movies for genre:', selectedGenre);
            this.loadRecommendedMovies(selectedGenre);
          }
        });
      });
    }

  ngAfterViewInit() {
    if (this.swiperRef_cgv && this.swiperRef_netflix) {
      const swiperEl_cgv = this.swiperRef_cgv.nativeElement;
      const swiperEl_netflix = this.swiperRef_netflix.nativeElement;
      const swiperEl_genre = this.swiperRef_netflix.nativeElement;
      const swiperEl_recommended = this.swiperRef_recommended.nativeElement;

      const params = {
        slidesPerView: 3,
        spaceBetween: 5,
      };

      Object.assign(swiperEl_cgv, params);
      swiperEl_cgv.initialize();

      Object.assign(swiperEl_netflix, params);
      swiperEl_netflix.initialize();

      const genreparams = {
        slidesPerView: 3, // 4개 표시
        spaceBetween: 5,
      };

      Object.assign(swiperEl_genre, genreparams);
      swiperEl_genre.initialize();

      const recommendedparams = {
        slidesPerView: 4, // 4개 표시
        spaceBetween: 5,
      };

      Object.assign(swiperEl_recommended, recommendedparams);
      swiperEl_recommended.initialize();
    } else {
      console.warn('Swiper elements are not available for initialization');
    }
  }
  goToNowsCommentPage() {
    this.router.navigate(['nows-comment']);
  }

  goToSearchPage() {
    this.router.navigate(['search'], { state: { movies: this.movies } });
  }

  getMovies(callback?: () => void) {
    this.movieService.getMovies().subscribe({
      next: (response: GetMoviesResponseData[]) => {
        this.movies = response;
        console.log('Movies loaded:', this.movies);

        // 영화 데이터를 장르별로 그룹화
        this.groupMoviesByGenre(this.movies);

        // 콜백 실행
        if (callback) {
          callback();
        }
      },
      error: (err: any) => {
        console.error('Error fetching movies:', err);
      },
      complete: () => {
        console.log('Movie fetching complete');
      }
    });
  }
// 영화 데이터를 장르별로 그룹화
  groupMoviesByGenre(movies: GetMoviesResponseData[]) {
    const groupedByGenre: MoviesByGenre = {};

    movies.forEach((movie) => {
      const genre = movie.genre || '기타';
      if (!groupedByGenre[genre]) {
        groupedByGenre[genre] = [];
      }
      groupedByGenre[genre].push(movie);
    });

    this.moviesGroupedByGenre = groupedByGenre;
    this.genres = Object.keys(groupedByGenre); // 장르 키 배열 생성
    console.log('Movies grouped by genre:', this.moviesGroupedByGenre);
  }


  goToMovieDetailPage(id: string) {
    if (id) {
      this.router.navigate([`movie/detail/${id}`]);
    } else {
      console.warn('Invalid movie ID');
    }
  }
  goToRecommendationPage() {
    this.router.navigate(['recommendation'], { state: { movies: this.movies } })
  }

  goTochatbotPage() {
    this.router.navigate(['/chatbot']);
  }

  // 특정 장르의 추천 영화를 로드
  loadRecommendedMovies(genre: string) {
    console.log('Filtering movies for genre:', genre);
    this.recommendedMovies = this.movies.filter(
      (movie) => movie.genre?.trim() === genre.trim()
    );

    console.log('Filtered recommended movies:', this.recommendedMovies);
    localStorage.setItem('recommendedMovies', JSON.stringify(this.recommendedMovies));
  }
  // 챗봇 페이지로 이동
  navigateToChatbotPage() {
    this.router.navigate(['/chatbot']); // '/chatbot' 경로로 이동
  }
}
