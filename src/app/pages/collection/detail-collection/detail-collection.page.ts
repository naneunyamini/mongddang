import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { GetUserResponseData } from 'src/app/models/user/user-getuser-response.data.interface';
import { jwtDecode } from 'jwt-decode';
import { ActivatedRoute } from '@angular/router';
import { CollectionService } from 'src/app/services/collection/collection.service';
import { GetCollectionsResponseData } from 'src/app/models/collection/collection-getcollections.interface.data';
import { AsyncStatus } from 'src/app/models/common/async-status.type';
import { ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-detail-collection',
  templateUrl: './detail-collection.page.html',
  styleUrls: ['./detail-collection.page.scss'],
})
export class DetailCollectionPage implements OnInit {
  username: string | null = null;
  collection: GetCollectionsResponseData | null = null;
  collectionLoadStatus: AsyncStatus = 'idle';
  collectionLoadError = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private collectionService: CollectionService,
    private route: ActivatedRoute,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.loadUserName();
    this.loadCollection(); // 컬렉션 로드 추가
  }

  loadUserName(): void {
    if (environment.demoMode) {
      this.username = this.authService.user?.username || '영화덕후';
      return;
    }

    const email = this.getUserEmailFromToken();
    if (email) {
      this.userService.getUserByEmail(email).subscribe({
        next: (user: GetUserResponseData) => {
          this.username = user.username;
          console.log('사용자 이름:', this.username);
        },
        error: (err) => {
          console.error('사용자 정보를 가져오는 중 오류:', err);
        },
        complete: () => {
          console.log('사용자 이름 로드 완료.');
        },
      });
    } else {
      console.warn('토큰에서 이메일을 추출할 수 없습니다.');
    }
  }

  loadCollection(): void {
    const collectionId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      this.collectionLoadStatus = 'error';
      this.collectionLoadError = '올바르지 않은 컬렉션 주소입니다.';
      return;
    }

    this.collectionLoadStatus = 'loading';
    this.collectionLoadError = '';

    this.collectionService.getCollectionById(collectionId).subscribe({
      next: (collection) => {
        this.collection = collection;
        this.collectionLoadStatus = 'success';
      },
      error: (error: unknown) => {
        console.error('컬렉션 상세 조회 실패:', error);
        this.collection = null;
        this.collectionLoadStatus = 'error';
        this.collectionLoadError = '컬렉션을 불러오지 못했습니다.';
        void this.presentLoadErrorToast();
      },
    });
  }

  retryCollection(): void {
    this.loadCollection();
  }

  private async presentLoadErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.collectionLoadError,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: '재시도',
          handler: () => this.retryCollection(),
        },
      ],
    });

    await toast.present();
  }

  private getUserEmailFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.email;
    }
    return null;
  }
}
