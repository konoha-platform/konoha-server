const Conversations = require('./conversation.model');
const Messages = require('../message/message.model');
const { APIFeatures } = require('../../shared/APIFeatures');
const { ConversationMapper } = require('./conversation.mapper');

const conversationService = {
  list: async ({ userId, query }) => {
    const features = new APIFeatures(
      Conversations.find({
        recipients: userId,
      }),
      query
    ).paginate();

    const conversations = await features.query
      .sort('-updatedAt')
      .populate('recipients', 'avatar username fullname');

    const conversationDtos = await ConversationMapper.toListDto(conversations);
    return { conversations: conversationDtos };
  },

  delete: async ({ id, userId }) => {
    const newConver = await Conversations.findOneAndDelete({
      $or: [{ recipients: [userId, id] }, { recipients: [id, userId] }],
    });
    await Messages.deleteMany({ conversation: newConver._id });
  },
};

module.exports = conversationService;
