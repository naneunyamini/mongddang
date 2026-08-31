import { inject, NgModule } from '@angular/core';
import { CanActivateFn, PreloadAllModules, Router, RouterModule, Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { CollectionAddPage } from './pages/movie/collection-add/collection-add.page';
import { RecommendationPage } from './pages/home/recommendation/recommendation.page';
import { ChatbotPage } from './pages/chatbot/chatbot.page';
import { environment } from '../environments/environment';

const chatbotEnabledGuard: CanActivateFn = () =>
  environment.chatbotEnabled || inject(Router).createUrlTree(['/home']);

const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'chatbot',
    component: ChatbotPage,
    canActivate: [chatbotEnabledGuard],
  },

  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'movie',
    loadChildren: () => import('./pages/movie/movie.module').then(m => m.MovieModule)
  },
  {
    path: 'movie-favorite',
    loadChildren: () => import('./pages/movie/movie.module').then(m => m.MovieModule)
  },

  {
    path: 'collection',
    loadChildren: () => import('./pages/collection/collection.module').then(m => m.CollectionPageModule)
  },
  {
    path: 'mypage',
    loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule) // 올바른 경로로 수정
  },
  {
    path: 'liked-movie',
    loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule)
  },
  {
    path: 'liked-collection',
    loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule)
  },
  {

    path: 'delete-account',
    loadChildren: () => import('./pages/auth/delete-account/delete-account.module').then( m => m.DeleteAccountPageModule)
  },
  {
    path: 'liked-comment',
    loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule)
  },
  {
    path: 'my-colleciton',
    loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule)
  },
  {
    path: 'movie/detail/:id/collection-add', component: CollectionAddPage
  },

  // {
  //   path: 'recommendation',
  //   loadChildren: () => import('./pages/auth/mypage/mypage.module').then(m => m.MypagePageModule)
  // },
  
  {
    path: 'detail-collection/:id',
    loadChildren: () => import('./pages/collection/detail-collection/detail-collection.page.module').then(m => m.DetailCollectionPageModule )
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
