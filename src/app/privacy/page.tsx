export const runtime = 'edge';

import Link from 'next/link';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      <main className="flex-1 px-5 py-8">
        <h1 className="text-xl font-black mb-1">개인정보처리방침</h1>
        <p className="text-xs text-gray-400 mb-8">최종 수정일: 2026년 6월 5일 · 개인정보보호법 제30조에 따라 작성</p>

        <Section title="1. 수집하는 개인정보 항목">
          <table>
            <thead>
              <tr><th>항목</th><th>수집 방법</th></tr>
            </thead>
            <tbody>
              <tr><td>이메일 주소</td><td>구글 OAuth 연동 시 자동 수집</td></tr>
              <tr><td>닉네임 (자동 생성)</td><td>최초 로그인 시 자동 생성</td></tr>
              <tr><td>구글 프로필 이름</td><td>닉네임 초기값으로만 사용</td></tr>
              <tr><td>작성 콘텐츠(평점·한줄평)</td><td>서비스 이용 시 직접 입력</td></tr>
            </tbody>
          </table>
          <p className="mt-2">비밀번호, 주민등록번호, 결제정보 등 민감정보는 수집하지 않습니다.</p>
        </Section>

        <Section title="2. 개인정보 수집 및 이용 목적">
          <ul>
            <li>회원 식별 및 서비스 접근 제어</li>
            <li>1인 1평 정책 적용을 위한 계정 연계</li>
            <li>서비스 공지 및 운영 정책 안내</li>
            <li>부정 이용 방지 및 서비스 보호</li>
            <li>Google Analytics를 통한 익명 통계 분석 (서비스 개선 목적)</li>
          </ul>
        </Section>

        <Section title="3. 개인정보 보유 및 이용 기간">
          <ul>
            <li>원칙: 회원 탈퇴 시까지 보유 후 즉시 파기</li>
            <li>단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보유
              <ul>
                <li>전자상거래법: 소비자 불만·분쟁처리 기록 → 3년</li>
                <li>정보통신망법: 로그인 기록 → 3개월</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="4. 개인정보 제3자 제공">
          별토끼는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 법령에 의한 수사기관의 요청이 있는 경우는 예외로 합니다.
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          <table>
            <thead>
              <tr><th>수탁업체</th><th>위탁 내용</th><th>보유 기간</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase Inc. (AWS us-east-1)</td>
                <td>데이터베이스 저장 및 인증 처리</td>
                <td>회원 탈퇴 시까지</td>
              </tr>
              <tr>
                <td>Google LLC</td>
                <td>OAuth 인증, Analytics (익명 통계)</td>
                <td>각 서비스 정책에 따름</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="6. 이용자의 권리">
          이용자는 언제든지 아래 권리를 행사할 수 있습니다.
          <ul>
            <li>개인정보 열람 요청</li>
            <li>오류 정정 요청</li>
            <li>삭제 및 처리 정지 요청 (회원 탈퇴)</li>
          </ul>
          <p className="mt-2">
            행사 방법: <a href="mailto:minsu0192@gmail.com" className="underline">minsu0192@gmail.com</a>으로 이메일 요청 또는 서비스 내 계정 탈퇴 기능 이용
          </p>
        </Section>

        <Section title="7. 쿠키 및 분석 도구">
          <ul>
            <li>로그인 세션 유지를 위해 브라우저 쿠키를 사용합니다.</li>
            <li>Google Analytics를 사용하여 방문자 수, 페이지 이용 패턴 등 익명 통계를 수집합니다. IP는 익명화 처리됩니다.</li>
            <li>브라우저 설정에서 쿠키를 차단할 수 있으나, 이 경우 로그인 기능이 제한될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="8. 개인정보 보호책임자">
          <p>
            별토끼는 개인 운영 서비스입니다.<br />
            책임자: 별토끼 운영자<br />
            연락처: <a href="mailto:minsu0192@gmail.com" className="underline">minsu0192@gmail.com</a>
          </p>
          <p className="mt-2">개인정보 관련 불만은 개인정보보호위원회(privacy.go.kr) 또는 개인정보침해신고센터(118)에 신고할 수 있습니다.</p>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-900">
          <Link href="/" className="inline-block text-xs text-amber-600 dark:text-amber-400 hover:underline">
            ← 홈으로
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-sm font-black mb-2 text-gray-800 dark:text-gray-100">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-1.5
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
        [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
        [&_th]:text-left [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-gray-200 [&_th]:dark:border-gray-800 [&_th]:bg-gray-50 [&_th]:dark:bg-gray-900
        [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-gray-200 [&_td]:dark:border-gray-800
        [&_a]:text-amber-600 [&_a]:dark:text-amber-400">
        {children}
      </div>
    </section>
  );
}
