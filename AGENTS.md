# Bonda Project Rules

- `docs/PRODUCT.md`와 `docs/IMPLEMENTATION_SPEC.md`를 제품 및 구현의 source of truth로 사용한다.
- 큰 기능은 한 번에 구현하지 않고 검증 가능한 작은 vertical slice로 나눈다.
- 변경 전에 기존 코드와 관련 문서를 먼저 읽고 필요한 파일만 수정한다.
- 불필요한 신규 파일과 사용하지 않는 dependency를 만들지 않는다.
- frontend는 적은 계층과 단순한 파일 구조를 유지하며 과도한 폴더 분리를 피한다.
- backend는 domain rule이 있는 영역에 DDD를 적용하되 단순 CRUD에는 과도한 abstraction을 만들지 않는다.
- LLM output을 검증된 사실로 직접 저장하지 않는다.
- 숫자 계산과 risk state 결정은 deterministic logic으로 구현한다.
- 테스트 없는 핵심 domain logic은 완료로 간주하지 않는다.
- 구현 후 관련 build와 test를 반드시 실행하고 결과를 확인한다.
- secret은 코드, 설정 파일, 로그에 저장하지 않고 환경변수로 주입한다.
