import axios from 'axios';

export class TossClient {
  private secretKey: string;
  private encryptedSecretKey: string;
  private http = axios.create({ baseURL: 'https://api.tosspayments.com/v1' });

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용하지 않습니다.
    // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가합니다.
    // @docs https://docs.tosspayments.com/reference/using-api/authorization#인증
    this.encryptedSecretKey = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
    this.http.defaults.headers.common['Authorization'] = this.encryptedSecretKey;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
  }

  // 결제 승인
  // 결제 승인 API를 호출하세요.
  // 결제를 승인하면 결제수단에서 금액이 차감돼요.
  // @docs https://docs.tosspayments.com/guides/v2/payment-widget/integration#3-결제-승인하기
  async confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
    try {
      const { data } = await this.http.post('/payments/confirm', {
        orderId: params.orderId,
        amount: params.amount,
        paymentKey: params.paymentKey,
      });
      return data;
    } catch (error: any) {
      // 토스페이먼츠 API 에러 처리
      if (error.response) {
        throw {
          message: error.response.data.message || '결제 승인에 실패했습니다.',
          code: error.response.data.code,
          response: error.response.data,
        };
      }
      throw error;
    }
  }
}
