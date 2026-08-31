import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { MovieService } from '../../services/movie/movie.service';
import { GetMoviesResponseData } from '../../models/movie/movie-getmovie-response-data.interface';
import { environment } from '../../../environments/environment';
import { MoviesByGenre } from '../../models/movie/movie.interface';
import { AsyncStatus } from '../../models/common/async-status.type';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  readonly chatbotEnabled = environment.chatbotEnabled;
  readonly skeletonItems = [1, 2, 3];
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
  movieLoadStatus: AsyncStatus = 'idle';
  movieLoadError = '';
  private selectedGenre: string | null = null;

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
    private movieService: MovieService,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.selectedGenre =
      this.activatedRoute.snapshot.queryParamMap.get('genre') ||
      localStorage.getItem('selectedGenre');
    this.getMovies();
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

  getMovies(): void {
    this.movieLoadStatus = 'loading';
    this.movieLoadError = '';

    this.movieService.getMovies().subscribe({
      next: (response: GetMoviesResponseData[]) => {
        this.movies = response;

        if (response.length === 0) {
          this.moviesGroupedByGenre = {};
          this.genres = [];
          this.recommendedMovies = [];
          this.movieLoadStatus = 'empty';
          return;
        }

        this.groupMoviesByGenre(this.movies);
        if (this.selectedGenre) {
          this.loadRecommendedMovies(this.selectedGenre);
        }
        this.movieLoadStatus = 'success';
      },
      error: (error: unknown) => {
        console.error('영화 목록을 불러오지 못했습니다.', error);
        this.movieLoadStatus = 'error';
        this.movieLoadError = '영화 정보를 불러오지 못했습니다.';
        void this.presentLoadErrorToast();
      },
    });
  }

  retryMovies(): void {
    this.getMovies();
  }

  handlePosterError(event: Event): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = 'assets/images/unknown.png';

    if (!image.src.endsWith(fallbackUrl)) {
      image.src = fallbackUrl;
    }
  }

  private async presentLoadErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.movieLoadError,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: '재시도',
          handler: () => this.retryMovies(),
        },
      ],
    });

    await toast.present();
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
  }

  goToMovieDetailPage(id: string) {
    if (id) {
      this.router.navigate([`movie/detail/${id}`]);
    } else {
      console.warn('Invalid movie ID');
    }
  }
  goToRecommendationPage() {
    this.router.navigate(['recommendation'], {
      state: { movies: this.movies },
    });
  }

  goTochatbotPage() {
    this.router.navigate(['/chatbot']);
  }

  // 특정 장르의 추천 영화를 로드
  loadRecommendedMovies(genre: string) {
    this.recommendedMovies = this.movies.filter(
      (movie) => movie.genre?.trim() === genre.trim(),
    );

    localStorage.setItem(
      'recommendedMovies',
      JSON.stringify(this.recommendedMovies),
    );
  }
  // 챗봇 페이지로 이동
  navigateToChatbotPage() {
    this.router.navigate(['/chatbot']); // '/chatbot' 경로로 이동
  }
}
