import axios from 'axios';

export class TossClient {
  private secretKey: string;
  private http = axios.create({ baseURL: 'https://api.tosspayments.com/v1' });

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.http.defaults.auth = { username: this.secretKey, password: '' };
  }

  // 결제 승인 (결제키 + 주문번호 또는 amount 등으로 확정)
  async confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
    const { data } = await this.http.post('/payments/confirm', params);
    return data; // 원본 데이터 그대로 리턴 (필요 시 후속 단계에서 타입화)
  }
}
