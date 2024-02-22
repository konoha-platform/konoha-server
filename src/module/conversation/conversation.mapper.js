const { omitBy, isNil } = require('lodash');

const { UserMapper } = require('../user/user.mapper');

class ConversationMapper {
  static async toDto(conversation) {
    const dto = {};
    dto._id = conversation?._id;
    dto.text = conversation?.text;
    dto.call = conversation?.call;
    dto.media = conversation?.media;
    dto.recipients = await UserMapper.toListDto(conversation?.recipients);
    return omitBy(dto, isNil);
  }

  static async toListDto(conversations) {
    if (!conversations || conversations.length === 0) return [];
    return await Promise.all(conversations.map(async (conversation) => await this.toDto(conversation)))
  }
}

module.exports = { ConversationMapper };