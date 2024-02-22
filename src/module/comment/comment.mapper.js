const { omitBy, isNil } = require('lodash');

const { UserMapper } = require('../user/user.mapper');

class CommentMapper {
  static async toDto(comment) {
    const dto = {};
    dto._id = comment?._id;
    dto.tag = comment?.tag;
    dto.content = comment?.content;
    dto.reply = comment?.reply;
    dto.likes = comment?.likes;
    dto.postId = comment?.postId;
    dto.postUserId = comment?.postUserId;
    dto.user = await UserMapper.toDto(comment?.user);
    return omitBy(dto, isNil);
  }

  static async toListDto(comments) {
    if (!comments) return;
    return await Promise.all(comments.map(async (comment) => await CommentMapper.toDto(comment)))
  }
}

module.exports = { CommentMapper };