const { database } = require('../shared/admin');

exports.getScreams = (request, response) => {
  database.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      let screams = [];
      querySnapshot.forEach((document) => {
        screams.push({
          screamId: document.id,
          userHandle: document.data().userHandle,
          fullName: document.data().fullName,
          body: document.data().body,
          createdAt: document.data().createdAt,
          userImage: document.data().userImage
        })
      })
      return response.json(screams);
    })
    .catch((err) => console.error(err));
}

exports.createScream = (request, response) => {

  const newScream = {
    body: request.body.body,
    userHandle: request.user.handle,
    userImage: request.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  database.collection('screams')
    .add(newScream)
    .then((document) => {
      const respScream = newScream;
      respScream.screamId = document.id;
      response.json(respScream);
    })
    .catch((err) => {
      response.status(500).json({
        error: 'Oops, something went wrong'
      });
      console.error(err);
    });
}

exports.getScream = (request, response) => {
  let screamData = {};
  database.doc(`/screams/${request.params.screamId}`).get()
    .then((document) => {
      if (!document.exists) {
        return response.status(401).json({
          message: 'Sorry, the scream does not exist'
        });
      }
      screamData = document.data();
      screamData.screamId = document.id;
      return database
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId', '==', request.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((comment) => {
        screamData.comments.push(comment.data());
      })
      return response.status(200).json(screamData);
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}

// comment/reply on a scream 
// @params screamId
exports.commentOnScream = (request, response) => {
  if (request.body.body.trim() === '') {
    return response.status(400).json({
      message: 'Comment must not  be empty'
    })
  }
  const newComment = {
    body: request.body.body,
    userHandle: request.user.handle,
    screamId: request.params.screamId,
    userImage: request.user.imageUrl,
    createdAt: new Date().toISOString()
  }

  console.log(newComment);

  database.doc(`/screams/${request.params.screamId}`).get()
    .then((scream) => {
      if (!scream.exists) {
        return response.status(404).json({
          error: 'Scream not found'
        })
      }
      return scream.ref.update({
        commentCount: scream.data().commentCount + 1
      });
    })
    .then(() => {
      return database.collection('comments').add(newComment);
    })
    .then(() => {
      return response.json(newComment);
    })
    .catch((erro) => {
      console.log(erro);
      return response.status(500).json({
        error: 'Something went wrong'
      });
    })
}

// like/vote a scream 
// @params screamId
exports.likeScream = (request, response) => {
  const likeDoc = database.collection('likes')
    .where('userHandle', '==', request.user.handle)
    .where('screamId', '==', request.params.screamId).limit(1);

  const screamDoc = database.doc(`/screams/${request.params.screamId}`);

  let screamData;
  screamDoc.get()
    .then((document) => {
      if (document.exists) {
        screamData = document.data();
        screamData.screamId = document.id;
        return likeDoc.get()
      } else {
        return response.status(404).json({
          error: 'The Document does not exist'
        });
      }
    })
    .then((data) => {
      if (data.empty) {
        return database.collection('likes').add({
          screamId: request.params.screamId,
          userHandle: request.user.handle
        })
          .then(() => {
            screamData.likeCount++;
            return screamDoc.update({
              likeCount: screamData.likeCount
            });
          })
          .then(() => {
            return response.json(screamData)
          })
      } else {
        return response.status(400).json({
          error: 'Scream already liked'
        });
      }
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}

// unlike/unvote a scream 
// @params screamId
exports.unlikeScream = (request, response) => {
  const likeDoc = database.collection('likes')
    .where('userHandle', '==', request.user.handle)
    .where('screamId', '==', request.params.screamId).limit(1);

  const screamDoc = database.doc(`/screams/${request.params.screamId}`);

  let screamData;
  screamDoc.get()
    .then((document) => {
      if (document.exists) {
        screamData = document.data();
        screamData.screamId = document.id;
        return likeDoc.get()
      } else {
        return response.status(404).json({
          error: 'The Document does not exist'
        });
      }
    })
    .then((data) => {
      if (data.empty) {
        return response.status(400).json({
          error: 'Scream not liked'
        });
      } else {
        return database.doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDoc.update({
              likeCount: screamData.likeCount
            });
          })
          .then(() => {
            return response.status(200).json(screamData)
          })
      }
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}

// delete/remove a scream 
// @params screamId
exports.deleteScream = (request, response) => {
  const document = database.doc(`/screams/${request.params.screamId}`);
  document.get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({
          error: 'Scream does not exist'
        });
      }
      if (doc.data().userHandle !== request.user.handle) {
        return response.status(403).json({
          error: 'An unauthorized access'
        });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      return response.status(200).json({
        message: 'Scream deleted succesfully'
      });
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}