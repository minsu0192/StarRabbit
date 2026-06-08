export const runtime = 'edge';

import Link from 'next/link';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      <main className="flex-1 px-5 py-8 prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-xl font-black mb-1">이용약관</h1>
        <p className="text-xs text-gray-400 mb-8">최종 수정일: 2026년 6월 8일</p>

        <Section title="제1조 (목적)">
          이 약관은 별토끼(이하 &quot;서비스&quot;)의 이용 조건과 절차, 이용자와 운영자 간의 권리·의무를 규정합니다.
        </Section>

        <Section title="제2조 (정의)">
          <ul>
            <li><strong>서비스</strong>: 별토끼가 제공하는 웹툰 평점·리뷰 커뮤니티 및 관련 기능 일체</li>
            <li><strong>이용자</strong>: 이 약관에 동의하고 서비스를 이용하는 자</li>
            <li><strong>회원</strong>: 구글 계정으로 로그인하여 서비스를 이용하는 자</li>
            <li><strong>콘텐츠</strong>: 회원이 서비스에 작성한 평점, 한줄평, 추천 등 일체</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol>
            <li>이 약관은 서비스 내 공지사항 또는 이용약관 페이지에 게시함으로써 효력이 발생합니다.</li>
            <li>운영자는 관련 법률을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.</li>
            <li>회원이 변경된 약관에 동의하지 않으면 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (이용 자격)">
          <ol>
            <li>만 14세 이상이라면 누구나 가입할 수 있습니다.</li>
            <li>만 14세 미만인 경우 법정대리인의 동의가 필요합니다.</li>
            <li>이전에 서비스 이용이 정지된 경우 재가입이 제한될 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (회원 가입 및 계정)">
          <ol>
            <li>서비스는 구글 OAuth를 통한 소셜 로그인만 지원합니다.</li>
            <li>회원은 자신의 계정 정보를 타인에게 양도하거나 공유할 수 없습니다.</li>
            <li>계정 탈퇴는 프로필 페이지 또는 운영자에게 직접 요청할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제6조 (서비스 이용)">
          <ol>
            <li>웹툰 목록 열람은 로그인 없이도 가능합니다.</li>
            <li>평점 작성, 한줄평 작성, 추천은 로그인 후 이용 가능합니다.</li>
            <li>동일 웹툰에 대해 1인 1평만 허용됩니다. (수정·삭제 가능)</li>
            <li>본인의 한줄평에는 추천할 수 없습니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (금지 행위)">
          다음 행위는 금지되며, 위반 시 게시물 삭제 또는 계정 정지 조치를 받을 수 있습니다.
          <ol>
            <li>타인의 명예를 훼손하거나 모욕하는 행위</li>
            <li>팬덤·안티를 결집하여 조직적으로 특정 점수를 투표하는 행위 (점수 인플레/디플레)</li>
            <li>음란물, 도박, 불법 사이트 홍보 등 불법 콘텐츠 게시</li>
            <li>광고·스팸·외부 링크 홍보 목적의 한줄평 작성</li>
            <li>서비스의 정상적인 운영을 방해하는 행위 (크롤링, 자동화 스크립트 등)</li>
            <li>타인의 개인정보를 동의 없이 수집·이용하는 행위</li>
          </ol>
        </Section>

        <Section title="제8조 (콘텐츠의 권리와 책임)">
          <ol>
            <li>회원이 작성한 콘텐츠의 저작권은 회원 본인에게 있습니다.</li>
            <li>회원은 서비스에 콘텐츠를 게시함으로써 운영자에게 서비스 운영·개선·홍보 목적의 비독점적 이용 권한을 부여합니다.</li>
            <li>콘텐츠의 내용에 대한 법적 책임은 작성한 회원 본인에게 있습니다.</li>
            <li>운영자는 약관 위반 콘텐츠를 사전 통보 없이 삭제할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제9조 (플랫폼 비제휴 및 표시 정보)">
          <ol>
            <li>별토끼는 네이버웹툰, 카카오페이지, 카카오웹툰, 리디 등 각 웹툰 플랫폼 및 작품 권리자와 공식 제휴·후원·승인 관계에 있는 서비스가 아닙니다.</li>
            <li>서비스에 표시되는 작품명, 작가명, 플랫폼명과 관련 표지는 리뷰 대상 식별 및 정보 제공 목적으로만 사용됩니다.</li>
            <li>각 작품과 플랫폼에 관한 상표권·저작권 및 기타 권리는 해당 권리자에게 있습니다.</li>
          </ol>
        </Section>

        <Section title="제10조 (권리침해 신고 및 임시조치)">
          <ol>
            <li>저작권, 상표권, 명예, 개인정보 등 권리침해를 주장하는 자는 대상 게시물, 권리 관계, 침해 사유와 연락처를 운영자 이메일로 제출할 수 있습니다.</li>
            <li>운영자는 신고 내용을 검토하여 필요한 경우 해당 게시물의 노출을 중단하거나 삭제할 수 있습니다.</li>
            <li>게시물 작성자는 운영자 이메일을 통해 소명자료와 함께 이의신청을 할 수 있습니다.</li>
            <li>운영자는 신고자와 작성자의 자료, 관련 법령 및 서비스 정책을 검토하여 게시물의 복원·삭제 또는 제한 유지 여부를 결정합니다.</li>
          </ol>
          <p>권리침해 신고 및 이의신청: <a href="mailto:minsu0192@gmail.com" className="underline">minsu0192@gmail.com</a></p>
        </Section>

        <Section title="제11조 (서비스 변경·중단)">
          <ol>
            <li>운영자는 서비스 내용을 변경하거나 중단할 수 있습니다.</li>
            <li>서비스 중단 시 30일 전 공지하는 것을 원칙으로 하되, 불가피한 경우 즉시 중단할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제12조 (면책 조항)">
          <ol>
            <li>운영자는 천재지변, 서비스 장애, 제3자의 귀책 사유로 인한 손해에 대해 책임을 지지 않습니다.</li>
            <li>운영자는 회원이 작성한 콘텐츠의 정확성·신뢰성에 대해 보장하지 않습니다.</li>
            <li>운영자는 회원 간 분쟁에 개입할 의무가 없습니다.</li>
          </ol>
        </Section>

        <Section title="제13조 (준거법 및 관할)">
          이 약관은 대한민국 법률에 따르며, 분쟁 발생 시 운영자 소재지 법원을 관할 법원으로 합니다.
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-900">
          <p className="text-xs text-gray-400">
            문의: <a href="mailto:minsu0192@gmail.com" className="underline">minsu0192@gmail.com</a>
          </p>
          <Link href="/" className="mt-3 inline-block text-xs text-amber-600 dark:text-amber-400 hover:underline">
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
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
