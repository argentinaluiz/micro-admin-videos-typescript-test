import {
  AggregateRoot,
  NotFoundError,
} from '@fc/micro-videos/@seedwork/domain';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundErrorFilter } from './not-found-error.filter';
import request from 'supertest';

class Stub extends AggregateRoot {
  toJSON(): Required<any> {
    throw new Error('Method not implemented.');
  }
}

@Controller('stub')
class StubController {
  @Get()
  index() {
    throw new NotFoundError('1', Stub);
  }
}

describe('NotFoundErrorFilter Unit Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StubController],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new NotFoundErrorFilter());
    await app.init();
  });

  it('should catch a EntityValidationError', () => {
    return request(app.getHttpServer()).get('/stub').expect(404).expect({
      statusCode: 404,
      error: 'Not Found',
      message: 'Stub Not Found using ID (1)',
    });
  });
});
