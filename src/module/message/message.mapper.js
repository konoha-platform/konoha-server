const { omitBy, isNil } = require('lodash');

const { ConversationMapper } = require('../conversation/conversation.mapper');
const { getPresignedUrl } = require('../../core/aws/s3')
const { UserMapper } = require('../user/user.mapper');

class MessageMapper {
  static async toDto(message) {
    const dto = {};
    dto._id = message?._id;
    dto.text = message?.text;
    dto.call = message?.call;
    dto.media = await getPresignedUrl(message?.media);
    dto.conversation = await ConversationMapper.toDto(message?.conversation);
    dto.sender = await UserMapper.toDto(message?.sender);
    dto.recipient = await UserMapper.toDto(message?.recipient);
    dto.createdAt = message?.createdAt;
    dto.updatedAt = message?.updatedAt;
    return omitBy(dto, isNil);
  }

  static async toListDto(conversations) {
    if (!conversations || conversations.length === 0) return [];
    return await Promise.all(conversations.map(async (conversation) => await this.toDto(conversation)))
  }
}

module.exports = { MessageMapper };