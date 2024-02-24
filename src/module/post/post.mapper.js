const { omitBy, isNil } = require('lodash');

const { getPresignedUrl } = require('../../core/aws/s3');
const { UserMapper } = require('../user/user.mapper');
const { CommentMapper } = require('../comment/comment.mapper');

class PostMapper {
  static async toDto(post) {
    const dto = {};
    dto._id = post?._id;
    dto.content = post?.content;
    dto.images = await Promise.all(post.images.map(async (key) =>  ({ key, url: await getPresignedUrl(key) })));
    dto.user = await UserMapper.toDto(post?.user);
    dto.comments = await CommentMapper.toListDto(post?.comments);
    dto.likes = post.likes;
    dto.createdAt = post?.createdAt;
    dto.updatedAt = post?.updatedAt;
    return omitBy(dto, isNil);
  }

  static async toListDto(posts) {
    if (!posts || posts.length === 0) return [];
    return await Promise.all(posts.map(async (post) => await this.toDto(post)))
  }
}

module.exports = { PostMapper };