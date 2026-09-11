# Bonda

> 내가 산 채권의 변화를 한눈에 추적하는 AI Credit Monitoring 서비스

Bonda(본다)는 개인투자자가 보유하거나 관심 있는 회사채의 발행기업을 지속적으로 확인하고, 채권 매수 이후 새롭게 발생한 신용위험 관련 변화를 탐지하도록 돕습니다. 이름은 **Bond + 본다**에서 왔습니다.

## 프로젝트 구조

```text
bonda/
├── frontend/    # React + TypeScript + Vite
├── backend/     # Java 21 + Spring Boot + Gradle
├── evaluation/  # 향후 평가 기준과 결과
├── docs/        # 프로젝트 문서
│   ├── PRODUCT.md
│   └── IMPLEMENTATION_SPEC.md
└── AGENTS.md
```

제품과 구현의 기준 문서는 [PRODUCT.md](./docs/PRODUCT.md), [IMPLEMENTATION_SPEC.md](./docs/IMPLEMENTATION_SPEC.md)입니다.

## 시작하기

### Frontend

```bash
cd frontend
npm install
npm run dev
```

프로덕션 빌드는 `npm run build`로 확인합니다.

### Backend

Java 21과 로컬 PostgreSQL을 준비하고 루트의 `.env.example` 값을 실행 환경에 설정합니다.

```bash
cd backend
./gradlew bootRun
```

Windows에서는 `gradlew.bat bootRun`을 사용합니다. 서버가 실행되면 `GET http://localhost:8080/api/health`에서 상태를 확인할 수 있습니다.

테스트와 빌드는 각각 `./gradlew test`, `./gradlew build`로 실행합니다.

DART 수집은 `DART_API_KEY`와 숫자 8자리 `Issuer.corpCode`가 필요합니다. 기본 Scheduler는 비활성화되어 있으며, 설정 후 `POST /api/admin/disclosures/collect?issuerId={id}`로 수동 확인할 수 있습니다. 데모 발행사의 `DEMO` 코드는 외부 호출에서 제외됩니다.

## 프로젝트 상태

현재는 Issuer, Bond, Holding, Watchlist와 DART 공시 수집·버전 관리, extraction 입력 정규화 및 deterministic pre-filter 기반을 제공합니다. LLM API와 Risk Event 생성은 아직 구현하지 않습니다.

## 문서

- [제품 정의](./docs/PRODUCT.md)
- [구현 명세](./docs/IMPLEMENTATION_SPEC.md)
- [문서 안내](./docs/README.md)
- [디자인 기준](./DESIGN.md)

## License

라이선스는 추후 확정할 예정입니다.
