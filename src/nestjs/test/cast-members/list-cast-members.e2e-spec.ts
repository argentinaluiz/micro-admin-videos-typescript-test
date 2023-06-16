import request from 'supertest';
import { CastMemberRepository } from '@fc/micro-videos/cast-member/domain';
import { CAST_MEMBER_PROVIDERS } from '../../src/cast-members/cast-members.providers';
import { ListCastMembersFixture } from '../../src/cast-members/fixtures';
import { CastMembersController } from '../../src/cast-members/cast-members.controller';
import { instanceToPlain } from 'class-transformer';
import { startApp } from '../../src/@share/testing/helpers';
import qs from 'qs';

describe('CastMembersController (e2e)', () => {
  describe('/cast-members (GET)', () => {
    describe('should return cast members sorted by created_at when request query is empty', () => {
      let categoryRepo: CastMemberRepository.Repository;
      const nestApp = startApp();
      const { entitiesMap, arrange } =
        ListCastMembersFixture.arrangeIncrementedWithCreatedAt();

      beforeEach(async () => {
        categoryRepo = nestApp.app.get<CastMemberRepository.Repository>(
          CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
        );
        try {
          await categoryRepo.bulkInsert(Object.values(entitiesMap));
        } catch (e) {
          console.error(e);
        }
      });

      test.each(arrange)(
        'when query params is $send_data',
        async ({ send_data, expected }) => {
          const queryParams = new URLSearchParams(send_data as any).toString();
          return request(nestApp.app.getHttpServer())
            .get(`/cast-members/?${queryParams}`)
            .expect(200)
            .expect({
              data: expected.entities.map((e) =>
                instanceToPlain(
                  CastMembersController.castMemberToResponse(e.toJSON()),
                ),
              ),
              meta: expected.meta,
            });
        },
      );
    });

    describe('should return cast-members using paginate, filter and sort', () => {
      let categoryRepo: CastMemberRepository.Repository;
      const nestApp = startApp();
      const { entitiesMap, arrange } = ListCastMembersFixture.arrangeUnsorted();

      beforeEach(async () => {
        categoryRepo = nestApp.app.get<CastMemberRepository.Repository>(
          CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
        );
        await categoryRepo.bulkInsert(Object.values(entitiesMap));
      });

      test.each([arrange[0]])(
        'when query params is $send_data',
        async ({ send_data, expected }) => {
          const queryParams = qs.stringify(send_data as any);
          return request(nestApp.app.getHttpServer())
            .get(`/cast-members/?${queryParams}`)
            .expect(200)
            .expect({
              data: expected.entities.map((e) =>
                instanceToPlain(
                  CastMembersController.castMemberToResponse(e.toJSON()),
                ),
              ),
              meta: expected.meta,
            });
        },
      );
    });
  });
});
