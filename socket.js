module.exports = io => {
  io.on('connection', socket => {
    console.log('New client connected');

    // Join question room
    socket.on('joinQuestion', questionId => {
      socket.join(questionId);
      console.log(`User joined question ${questionId}`);
    });

    // Leave question room
    socket.on('leaveQuestion', questionId => {
      socket.leave(questionId);
      console.log(`User left question ${questionId}`);
    });

    // New answer notification
    socket.on('newAnswer', ({ questionId, answer }) => {
      socket.to(questionId).emit('answerAdded', answer);
      console.log(`New answer added to question ${questionId}`);
    });

    // Answer upvoted notification
    socket.on('answerUpvoted', ({ questionId, answerId }) => {
      socket.to(questionId).emit('answerUpdated', { answerId, type: 'upvote' });
      console.log(`Answer ${answerId} upvoted in question ${questionId}`);
    });

    // Answer downvoted notification
    socket.on('answerDownvoted', ({ questionId, answerId }) => {
      socket.to(questionId).emit('answerUpdated', { answerId, type: 'downvote' });
      console.log(`Answer ${answerId} downvoted in question ${questionId}`);
    });

    // Answer featured notification
    socket.on('answerFeatured', ({ questionId, answerId }) => {
      socket.to(questionId).emit('answerFeatured', answerId);
      console.log(`Answer ${answerId} featured in question ${questionId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};