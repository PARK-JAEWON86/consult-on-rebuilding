/**
 * 성능 측정 유틸리티
 */

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  /**
   * 성능 측정 시작
   */
  start(name: string) {
    this.metrics.set(name, performance.now());
  }

  /**
   * 성능 측정 종료 및 결과 반환
   */
  end(name: string): PerformanceMetrics | null {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`Performance measurement "${name}" was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
    };

    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance [${name}]: ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * 성능 측정 함수 래퍼
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * 모든 측정 지표 초기화
   */
  clear() {
    this.metrics.clear();
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/**
 * 컴포넌트 렌더링 시간 측정 훅
 */
export function measureComponentRender(componentName: string) {
  if (typeof window === 'undefined') return;

  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = `${componentName}-render`;

  // 시작 마크
  performance.mark(startMark);

  // 클린업 함수
  return () => {
    // 종료 마크
    performance.mark(endMark);

    // 측정
    try {
      performance.measure(measureName, startMark, endMark);

      const entries = performance.getEntriesByName(measureName);
      if (entries.length > 0) {
        const duration = entries[0].duration;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎨 Render [${componentName}]: ${duration.toFixed(2)}ms`);
        }
      }

      // 정리
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch (error) {
      // 측정 실패 시 무시
    }
  };
}

/**
 * API 호출 시간 측정
 */
export async function measureApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(apiName, apiCall);
}

/**
 * Web Vitals 측정
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vitals:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }

  // 프로덕션에서는 분석 도구로 전송
  // 예: analytics.track('web-vitals', metric)
}
