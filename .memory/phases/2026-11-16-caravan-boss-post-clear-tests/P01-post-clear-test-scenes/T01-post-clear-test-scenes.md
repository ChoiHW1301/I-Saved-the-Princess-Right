# T01 보스 클리어 후 테스트 장면

## Status
done

## 수정 대상 및 심볼
- `apps/web/src/game/content/BossTestScenario.ts`: post-clear 시나리오 타입, 목록, 조회 함수
- `apps/web/src/game/test/BossTestScenario.test.ts`: 다음 바이옴 및 시작 시각 매핑 테스트
- `apps/web/src/features/home/HomePage.tsx`: 개발자 테스트 목록과 테스트 실행 핸들러
- `apps/web/src/features/home/HomePage.css`: 클리어 후 시나리오 섹션 스타일(기존 버튼 스타일 재사용 우선)
- `apps/web/src/game/GameCanvas.tsx`: 개발자 post-clear 모드 설정 전달 및 로컬 전용 처리
- `apps/web/src/game/scenes/CaravanScene.ts`: 시작 시각·완료 마일스톤 사전 설정 및 보스 조우 없이 전환 상태 시작

## 동작 청사진
- post-clear 케이스는 5분 라바 보스 두 종류, 10분 성채 장군, 15분 숲 수호자다.
- 해당 시점까지의 비이벤트 마일스톤을 완료 처리하고 캠페인 클럭의 과거 마일스톤은 이미 방출된 것으로 설정한다.
- post-clear 시작에서는 보스를 생성하지 않으며, 완료된 현재 마일스톤에 따라 다음 바이옴 전환이 시작된다.
- 보스 조우 테스트와 post-clear 테스트를 UI 및 launch config에서 구별한다.
- 개발자 테스트는 기존과 같이 저장/결과 제출을 하지 않는다.

## 검증
- `npm --workspace apps/web test -- BossTestScenario.test.ts`
- `npm --workspace apps/web run typecheck`
- `npm --workspace apps/web run build`
- 전체 웹 테스트 실행 시 이 작업과 무관한 기존 `CharacterCatalog.test.ts` 2건 실패 확인(화상 피해 및 상인 탄환 피해 기대값 불일치)

## Commit
- `feat(game): add post-boss transition test starts`
