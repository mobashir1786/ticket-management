const asyncHandler = require('../utils/asyncHandler');
const commentService = require('../services/commentService');

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.user,
    req.validated.params.id,
    req.validated.body.message
  );
  res.status(201).json({ success: true, data: comment });
});

module.exports = {
  addComment,
};
