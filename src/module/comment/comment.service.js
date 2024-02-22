const { StatusCodes } = require('http-status-codes');

const Comments = require('./comment.model');
const { addToNotificationQueue } = require('../notification/notification.queue');
const Posts = require('../post/post.model');
const { POST, COMMENT } = require('../../shared/message');

const commentService = {
  create: async ({ postId, content, tag, reply, postUserId, userId }) => {
    const post = await Posts.findById(postId);
    if (!post) {
      const err = new Error(POST.POST_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }

    if (reply) {
      const cm = await Comments.findById(reply);
      if (!cm) {
        const err = new Error(COMMENT.COMMENT_NOT_FOUND);
        err.status = StatusCodes.NOT_FOUND;
        throw err;
      }
    }

    const newComment = new Comments({
      content,
      tag,
      reply,
      postUserId,
      postId,
      user: userId,
    });

    await Posts.findOneAndUpdate(
      { _id: postId },
      {
        $push: { comments: newComment._id },
      },
      { new: true }
    );
    await newComment.save();

    addToNotificationQueue({
      text: newComment.reply
        ? 'mentioned you in a comment.'
        : 'has commented on your post.',
      recipients: newComment.reply ? [newComment.tag._id] : [post.user._id],
      url: `/posts/${post._id}`,
      content: newComment.content,
      user: { _id: userId },
    });

    return { newComment };
  },

  update: async ({ content, id, userId }) => {
    await Comments.findOneAndUpdate(
      {
        _id: id,
        user: userId,
      },
      { content }
    );
  },

  like: async ({ id, userId }) => {
    const comment = await Comments.find({ _id: id, likes: userId });
    if (comment.length > 0) {
      const err = new Error(COMMENT.COMMENT_LIKED);
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }

    await Comments.findOneAndUpdate(
      { _id: id },
      {
        $push: { likes: userId },
      },
      { new: true }
    );
  },

  unlike: async ({ id, userId }) => {
    await Comments.findOneAndUpdate(
      { _id: id },
      {
        $pull: { likes: userId },
      },
      { new: true }
    );
  },

  delete: async ({ id, userId }) => {
    const comment = await Comments.findOneAndDelete({
      _id: id,
      $or: [{ user: userId }, { postUserId: userId }],
    });
    await Posts.findOneAndUpdate(
      { _id: comment.postId },
      {
        $pull: { comments: req.params.id },
      }
    );
  },
};

module.exports = commentService;
