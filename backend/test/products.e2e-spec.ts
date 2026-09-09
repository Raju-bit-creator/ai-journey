import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/users/user.entity.js';
import { Product } from '../src/products/product.entity.js';

describe('Products + Auth (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  let products: Repository<Product>;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    users = moduleFixture.get(getRepositoryToken(User));
    products = moduleFixture.get(getRepositoryToken(Product));
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      const owners = await users.find({ where: { email: In(createdEmails) } });
      const ownerIds = owners.map((u) => u.id);
      if (ownerIds.length > 0) {
        await products
          .createQueryBuilder()
          .delete()
          .where('"ownerId" IN (:...ownerIds)', { ownerIds })
          .execute();
      }
      await users.delete({ email: In(createdEmails) });
    }
    await app.close();
  });

  function uniqueEmail(label: string): string {
    const email = `e2e_${label}_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
    createdEmails.push(email);
    return email;
  }

  async function registerUser(name: string, label: string) {
    const email = uniqueEmail(label);
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name, email, password: 'password123' })
      .expect(201);
    return { sessionId: res.body.sessionId as string, userId: res.body.user.id as string, email };
  }

  it('rejects creating a product without a session', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Nope', price: 1 })
      .expect(401);
  });

  it('lets a registered user create a product', async () => {
    const owner = await registerUser('Owner One', 'owner1');

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('x-session-id', owner.sessionId)
      .send({ name: 'E2E Widget', price: 12.5 })
      .expect(201);

    expect(res.body.owner.id).toBe(owner.userId);
  });

  it('prevents another user from editing or deleting it, allows the owner to', async () => {
    const owner = await registerUser('Owner Two', 'owner2');
    const stranger = await registerUser('Stranger', 'stranger');

    const created = await request(app.getHttpServer())
      .post('/products')
      .set('x-session-id', owner.sessionId)
      .send({ name: 'Guarded Item', price: 20 })
      .expect(201);
    const id = created.body.id;

    await request(app.getHttpServer())
      .patch(`/products/${id}`)
      .set('x-session-id', stranger.sessionId)
      .send({ price: 999 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set('x-session-id', stranger.sessionId)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/products/${id}`)
      .set('x-session-id', owner.sessionId)
      .send({ price: 25 })
      .expect(200)
      .expect((res) => {
        expect(res.body.price).toBe(25);
      });

    await request(app.getHttpServer())
      .delete(`/products/${id}`)
      .set('x-session-id', owner.sessionId)
      .expect(204);
  });

  it('paginates the product list', async () => {
    const owner = await registerUser('Paginator', 'paginator');

    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/products')
        .set('x-session-id', owner.sessionId)
        .send({ name: `Page Item ${i}`, price: 1 })
        .expect(201);
    }

    const res = await request(app.getHttpServer())
      .get('/products?page=1&limit=2')
      .expect(200);

    expect(res.body.items).toHaveLength(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('logs out and invalidates the session', async () => {
    const owner = await registerUser('LogoutTest', 'logout');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-session-id', owner.sessionId)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('x-session-id', owner.sessionId)
      .expect(204);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-session-id', owner.sessionId)
      .expect(401);
  });
});
