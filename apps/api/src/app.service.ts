import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): { success: boolean; data: { message: string; version: string } } {
    return {
      success: true,
      data: {
        message: 'Consulton API is running!',
        version: '1.0.0',
      },
    }
  }
}
