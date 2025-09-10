import { Controller, Get, HttpException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list() {
    try {
      const data = await this.users.findAll();
      return { success: true, data };
    } catch (e) {
      throw new HttpException(
        { success: false, error: { code: 'E_DB_QUERY', message: 'Failed to fetch users' } },
        500,
      );
    }
  }
}
