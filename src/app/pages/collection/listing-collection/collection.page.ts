import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronDownCircle,
  chevronForwardCircle,
  chevronUpCircle,
  colorPalette,
  document,
  globe,
} from 'ionicons/icons';
import { CollectionService } from 'src/app/services/collection/collection.service';
import { tap } from 'rxjs/operators';
import { NavController, ToastController } from '@ionic/angular';
import { AsyncStatus } from 'src/app/models/common/async-status.type';
import { GetCollectionsResponseData } from 'src/app/models/collection/collection-getcollections.interface.data';

interface CollectionListItem extends GetCollectionsResponseData {
  isFavorite: boolean;
  favoriteCount: number;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.page.html',
  styleUrls: ['./collection.page.scss'],
})
export class CollectionPage implements OnInit {
  readonly skeletonItems = [1, 2, 3];
  collections: CollectionListItem[] = [];
  collectionLoadStatus: AsyncStatus = 'idle';
  collectionLoadError = '';
  sharedCollections$ = this.collectionService.getSharedCollections();

  constructor(
    private router: Router,
    private collectionService: CollectionService,
    private navController: NavController,
    private toastController: ToastController,
  ) {
    addIcons({ chevronDownCircle, chevronForwardCircle, chevronUpCircle, colorPalette, document, globe });
  }

  ngOnInit() {
    this.loadCollections();
  }

  loadCollections(): void {
    this.collectionLoadStatus = 'loading';
    this.collectionLoadError = '';

    this.collectionService.getCollections().subscribe({
      next: (collections: GetCollectionsResponseData[]) => {
        this.collections = collections.map((collection) => ({
          ...collection,
          isFavorite: false,
          favoriteCount: collection.like || 0,
        }));

        this.collectionLoadStatus = this.collections.length > 0 ? 'success' : 'empty';
      },
      error: (error: unknown) => {
        console.error('컬렉션 로딩 실패:', error);
        this.collectionLoadStatus = 'error';
        this.collectionLoadError = '컬렉션을 불러오지 못했습니다.';
        void this.presentLoadErrorToast();
      },
    });
  }

  retryCollections(): void {
    this.loadCollections();
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
          handler: () => this.retryCollections(),
        },
      ],
    });

    await toast.present();
  }

  toggleFavorite(collection: CollectionListItem): void {
    collection.isFavorite = !collection.isFavorite;
    collection.favoriteCount += collection.isFavorite ? 1 : -1;

    // 서버에 업데이트 요청 (필요한 경우)
    this.collectionService.updateFavoriteStatus(collection.id, collection.isFavorite).subscribe(
      (response) => {
        console.log('하트 상태 업데이트 성공:', response);
      },
      (error) => {
        console.error('하트 상태 업데이트 실패:', error);
        // 실패 시 원래 상태로 복구
        collection.isFavorite = !collection.isFavorite;
        collection.favoriteCount += collection.isFavorite ? 1 : -1;
      }
    );
  }

  goToUploadCollectionPage() {
    this.router.navigate(['collection/upload-collection']);
  }

  goToDetailCollectionPage(id: number) {
    this.router.navigate(['/detail-collection', id]);
  }

  shareCollection(collectionId: number) {
    this.collectionService.shareCollection(collectionId).pipe(
      tap((response) => {
        console.log('컬렉션 공유 성공:', response);
        // 공유된 컬렉션을 리스트에 추가
        this.sharedCollections$.subscribe((sharedCollections) => {
          sharedCollections.push(response);
        });
      })
    ).subscribe(
      (response) => console.log('공유된 컬렉션:', response),
      (error) => console.error('컬렉션 공유 실패:', error)
    );
  }

  viewDetail(collectionId: number) {
    this.navController.navigateForward(`/detail-collection/${collectionId}`);
  }
}
