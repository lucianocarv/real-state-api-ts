import { FastifyInstance } from 'fastify';
import { communityController } from '../controllers/community-controller';

async function communityRoutesAuth(fastify: FastifyInstance) {
  fastify.post('/communities', communityController.createOneCommunity);
  fastify.post('/communities/image/upload/:id', communityController.uploadCoverImage);
  fastify.put('/communities/:id', communityController.updateOneProvince);
  fastify.delete('/communities/:id', communityController.deleteOneCommunity);
}

export { communityRoutesAuth };
