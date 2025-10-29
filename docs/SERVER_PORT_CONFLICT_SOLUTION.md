# 서버 포트 충돌 문제 분석 및 해결방안

**작성일:** 2025-10-30
**문제 코드:** EADDRINUSE
**영향 포트:** 3001 (Next.js), 4000 (NestJS)

---

## 📋 1. 문제 요약

### 증상
```
Error: listen EADDRINUSE: address already in use :::3001
Error: listen EADDRINUSE: address already in use :::4000
```

- **프론트엔드 (Next.js)**: 포트 3001에서 시작 실패
- **백엔드 (NestJS)**: 포트 4000에서 시작 실패
- 반복적인 재시작에도 문제 지속

### 발생 시점
- 개발 서버 재시작 시도 시
- 다수의 백그라운드 `pnpm run dev` 프로세스 실행 후

### 영향 범위
- 로컬 개발 환경 전체 중단
- 프론트엔드 및 백엔드 서버 모두 작동 불가
- AI Photo Studio 테스트 불가능

---

## 🔍 2. 근본 원인 분석

### 2.1 프로세스 누수 메커니즘

```
백그라운드 셸 (f10b84, b06966, 8166d9, 502c0c, edaf71, 2aaf2c)
    ↓
pnpm run dev
    ↓
concurrently
    ↓
├─ pnpm dev:web → Node.js (Next.js on 3001)
└─ pnpm dev:api → Node.js (NestJS on 4000)
```

**문제점:**
1. **KillShell 명령의 한계**: 백그라운드 셸만 종료하고 자식 프로세스는 계속 실행
2. **Orphan 프로세스 생성**: 부모 프로세스가 종료되어도 Node.js 프로세스들이 포트 점유 지속
3. **누적 효과**: 6-7개의 셸이 각각 2개의 서버를 실행하여 총 12-14개의 Node.js 프로세스 생성

### 2.2 포트 충돌 발생 과정

```
시도 1: pnpm run dev (백그라운드) → 3001, 4000 점유
시도 2: pnpm run dev (백그라운드) → 3001, 4000 이미 사용 중
시도 3: pnpm run dev (백그라운드) → 3001, 4000 이미 사용 중
...
```

**결과:**
- 첫 번째 인스턴스만 성공적으로 포트 점유
- 이후 시도들은 모두 EADDRINUSE 에러로 실패
- 하지만 프로세스들은 계속 실행 상태 유지

### 2.3 시스템 리소스 영향

```bash
# 프로세스 누수 확인
$ ps aux | grep node | wc -l
15+  # 예상보다 많은 Node.js 프로세스

# 포트 점유 확인
$ lsof -ti:3001,4000
26635
26109
25892
...  # 다수의 PID
```

---

## ✅ 3. 즉시 해결 방법

### 3.1 완전한 프로세스 정리 (권장)

```bash
# 모든 개발 서버 관련 프로세스 한 번에 종료
lsof -ti:3001,4000 | xargs kill -9 2>/dev/null && \
pkill -9 -f "pnpm run dev" 2>/dev/null && \
pkill -9 -f "concurrently" 2>/dev/null && \
pkill -9 -f "next dev" 2>/dev/null && \
pkill -9 -f "nest start" 2>/dev/null && \
echo "✅ 모든 프로세스 정리 완료"
```

### 3.2 포트 해제 확인

```bash
# 포트가 비어있는지 확인
lsof -ti:3001,4000

# 예상 결과: 에러 또는 출력 없음 (포트가 비어있음을 의미)
```

### 3.3 서버 재시작

```bash
# 프로젝트 루트에서 실행
pnpm run dev
```

### 3.4 검증

**성공 시 예상 출력:**
```
[0] ▲ Next.js 14.1.0
[0]    - Local:        http://localhost:3001
[0]  ✓ Ready in 2.7s

[1] [Nest] 28110  - LOG [NestFactory] Starting Nest application...
[1] [Nest] 28110  - LOG [NestApplication] Nest application successfully started
[1] ✅ OAuth configuration validated successfully
```

---

## 🛡️ 4. 재발 방지 전략

### 4.1 개발 서버 관리 모범 사례

#### ❌ 피해야 할 패턴
```bash
# 백그라운드에서 여러 번 실행하지 말 것
pnpm run dev &
pnpm run dev &  # 이미 실행 중!
```

#### ✅ 권장 패턴
```bash
# 1. 기존 프로세스 확인
lsof -ti:3001,4000

# 2. 있다면 정리
lsof -ti:3001,4000 | xargs kill -9

# 3. 단일 인스턴스 실행
pnpm run dev
```

### 4.2 프로세스 모니터링 도구

#### 실시간 포트 모니터링
```bash
# 포트 사용 상태 확인
lsof -i:3001
lsof -i:4000

# 자세한 정보 확인
lsof -nP -iTCP:3001,4000 -sTCP:LISTEN
```

#### 개발 서버 프로세스 확인
```bash
# Node.js 프로세스 확인
ps aux | grep -E "(next|nest)" | grep -v grep

# pnpm 관련 프로세스 확인
ps aux | grep pnpm | grep -v grep
```

### 4.3 자동화 스크립트

#### `scripts/dev-clean-start.sh` 생성
```bash
#!/bin/bash

echo "🧹 기존 개발 서버 프로세스 정리 중..."

# 포트 점유 프로세스 종료
lsof -ti:3001,4000 | xargs kill -9 2>/dev/null

# 개발 서버 프로세스 종료
pkill -9 -f "pnpm run dev" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "nest start" 2>/dev/null

echo "✅ 정리 완료"

# 포트 확인
echo "🔍 포트 상태 확인 중..."
if lsof -ti:3001,4000 > /dev/null 2>&1; then
    echo "⚠️ 경고: 포트가 여전히 사용 중입니다"
    exit 1
else
    echo "✅ 포트 3001, 4000 사용 가능"
fi

echo "🚀 개발 서버 시작 중..."
pnpm run dev
```

#### 사용 방법
```bash
# 실행 권한 부여
chmod +x scripts/dev-clean-start.sh

# 실행
./scripts/dev-clean-start.sh
```

#### package.json에 스크립트 추가
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:web\" \"pnpm dev:api\"",
    "dev:clean": "bash scripts/dev-clean-start.sh",
    "dev:stop": "lsof -ti:3001,4000 | xargs kill -9 && pkill -9 -f 'pnpm run dev'"
  }
}
```

---

## 📚 5. 추천 워크플로우

### 5.1 일상적인 서버 시작

```bash
# 방법 1: 기본 시작 (포트가 비어있을 때)
pnpm run dev

# 방법 2: 안전한 시작 (포트 정리 후 시작)
pnpm run dev:clean
```

### 5.2 서버 종료

```bash
# 방법 1: 터미널에서 실행 중일 때
Ctrl + C

# 방법 2: 백그라운드에서 실행 중일 때
pnpm run dev:stop

# 방법 3: 수동 종료
lsof -ti:3001,4000 | xargs kill -9
```

### 5.3 문제 발생 시 대응

#### Step 1: 문제 확인
```bash
# 포트 점유 확인
lsof -i:3001
lsof -i:4000

# 프로세스 확인
ps aux | grep -E "(next|nest|pnpm)" | grep -v grep
```

#### Step 2: 완전 정리
```bash
# 모든 관련 프로세스 종료
lsof -ti:3001,4000 | xargs kill -9 2>/dev/null
pkill -9 -f "pnpm run dev" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "nest start" 2>/dev/null
```

#### Step 3: 검증
```bash
# 포트가 비어있는지 확인
lsof -ti:3001,4000

# 예상 결과: 출력 없음 또는 에러
```

#### Step 4: 재시작
```bash
pnpm run dev
```

---

## 🔧 6. 기술적 세부사항

### 6.1 프로세스 트리 구조

```
bash (백그라운드 셸)
└─ pnpm (pnpm run dev)
   └─ node (concurrently)
      ├─ pnpm (dev:web)
      │  └─ node (Next.js dev server on 3001)
      └─ pnpm (dev:api)
         └─ node (NestJS dev server on 4000)
```

### 6.2 시그널 처리

```bash
# SIGTERM (15) - 정상 종료 시도
kill -15 <PID>

# SIGKILL (9) - 강제 종료 (권장)
kill -9 <PID>
```

**차이점:**
- `kill -15`: 프로세스가 정리 작업을 수행할 기회를 줌 (느림, 때로 실패)
- `kill -9`: 즉시 프로세스 종료 (빠름, 확실함)

### 6.3 포트 바인딩 메커니즘

```typescript
// NestJS (apps/api/src/main.ts)
await app.listen(4000);  // 포트 4000 바인딩 시도

// Next.js (package.json)
"dev:web": "next dev -p 3001"  // 포트 3001 바인딩 시도
```

**EADDRINUSE 발생 조건:**
- 이미 다른 프로세스가 해당 포트를 LISTEN 상태로 점유 중
- SO_REUSEADDR 옵션이 없는 경우 (기본값)

---

## 📊 7. 모니터링 및 예방

### 7.1 정기 점검

```bash
# 주간 점검 스크립트
# scripts/weekly-cleanup.sh

#!/bin/bash
echo "📊 개발 환경 상태 점검"

# Node.js 프로세스 수 확인
NODE_COUNT=$(ps aux | grep node | grep -v grep | wc -l)
echo "Node.js 프로세스: $NODE_COUNT"

if [ $NODE_COUNT -gt 5 ]; then
    echo "⚠️ Node.js 프로세스가 많습니다. 정리를 권장합니다."
fi

# 포트 점유 확인
echo "포트 3001 상태:"
lsof -i:3001 || echo "비어있음"

echo "포트 4000 상태:"
lsof -i:4000 || echo "비어있음"
```

### 7.2 IDE/에디터 설정

#### VS Code 설정 (`.vscode/tasks.json`)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Clean Start Dev Server",
      "type": "shell",
      "command": "./scripts/dev-clean-start.sh",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Stop Dev Server",
      "type": "shell",
      "command": "pnpm run dev:stop",
      "problemMatcher": []
    }
  ]
}
```

---

## 🎯 8. 결론 및 권장사항

### 핵심 교훈
1. **단일 인스턴스 원칙**: 개발 서버는 한 번에 하나만 실행
2. **완전한 정리**: 프로세스 종료 시 자식 프로세스까지 확인
3. **검증 습관**: 시작 전 항상 포트 상태 확인

### 장기 개선 방향
1. **자동화**: `dev:clean` 스크립트를 기본 워크플로우로 채택
2. **모니터링**: 정기적인 프로세스 점검 습관화
3. **문서화**: 팀원들과 이 문서 공유 및 교육

### 긴급 대응 체크리스트
- [ ] `lsof -ti:3001,4000 | xargs kill -9` 실행
- [ ] `pkill -9 -f "pnpm run dev"` 실행
- [ ] `lsof -ti:3001,4000` 로 포트 해제 확인
- [ ] `pnpm run dev` 로 재시작
- [ ] 로그에서 "Ready" 및 "successfully started" 확인

---

## 📞 추가 지원

문제가 지속되거나 다른 이슈가 발생하는 경우:
1. 이 문서의 Step 3 (즉시 해결 방법) 재시도
2. 시스템 재부팅 고려 (극단적 경우)
3. Docker를 사용한 개발 환경 격리 검토

**마지막 업데이트:** 2025-10-30
**검증 완료:** ✅ Next.js (3001), ✅ NestJS (4000)
