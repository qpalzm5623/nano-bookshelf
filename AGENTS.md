# Nano BookShelf AI Coding Guidelines & Operational Rules

## 1. Fast & Lean Execution (크레딧 절약 및 고속 작업 원칙)
- **브라우저 서브에이전트(browser_subagent) 자동 실행 전면 금지**:
  - 단순 태그 변경, 스타일 수정, 컴포넌트 추가/수정 등 일반 작업 시 브라우저 서브에이전트를 띄우지 않습니다.
  - 사용자가 명시적으로 브라우저 테스트나 스크린샷 검증을 요구한 경우에만 실행합니다.
- **최소 도구 호출(Minimal Tool Calls)**:
  - 파일 편집 도구(`replace_file_content`)를 활용해 군더더기 없이 정확하게 코드를 수정합니다.
  - 검증용 쉘 스크립트 작성이나 서버 재시작 등을 최소화하여 크레딧과 응답 지연을 방지합니다.

## 2. Coding & Architecture
- 한국어 주석 및 직관적인 코드 작성
- 본사(Master)와 학원(Admin) 간 인터페이스/데이터 구조 일관성 유지
- 신속한 두괄식 보고: [결론/해결책] -> [코드] -> [상세 설명]
