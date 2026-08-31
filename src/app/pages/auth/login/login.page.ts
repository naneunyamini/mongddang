import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SignInRequestData } from 'src/app/models/auth/auth-signin-request-data.interface';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss']
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      // 크롬 경고창으로 메시지 표시
      window.alert('이메일 또는 비밀번호가 입력되지 않았습니다.');
      return;
    }

    const signInRequestData: SignInRequestData = {
      email: this.email,
      password: this.password,
    };

    // 로그인 요청
    this.authService.login(signInRequestData).subscribe({
      next: (response) => {
        if (response.success) {
          // 데모 인증 완료 후 Mock 영화가 표시되는 홈으로 이동
          this.router.navigate(['/home']);
        } else {
          // 크롬 경고창으로 로그인 실패 메시지 표시
          window.alert(response.message); // 사용자 친화적인 오류 메시지 표시
        }
      },
      error: (err) => {
        // 크롬 경고창으로 존재하지 않는 아이디 메시지 표시
        window.alert('로그인 처리 중 오류가 발생했습니다.');
      },
      complete: () => {
        console.log('로그인 요청 완료.');
      }
    });
  }

  goToCreateAccountPage() {
    console.log('회원가입 페이지로 이동');
    this.router.navigate(['auth/create-account']);
  }
}
