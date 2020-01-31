const functions = require('firebase-functions');
const cors = require('cors');
const app = require('express')();
app.use(cors());

const authMiddleware = require('./shared/middleware');
const {
  database
} = require('./shared/admin');
const {
  getScreams,
  getScream,
  createScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require('./controllers/screams');

const {
  createUser,
  authenticateUser,
  addUserDetails,
  authenticatedUserDetails,
  profileImageUpload,
  getUserDetails,
  markNotificationsRead
} = require('./controllers/users');

// user related routes
app.post('/signup', createUser);
app.post('/signin', authenticateUser);
app.get('/user', authMiddleware, authenticatedUserDetails);
app.post('/user', authMiddleware, addUserDetails);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', authMiddleware, markNotificationsRead);
app.post('/user/image', authMiddleware, profileImageUpload);

// scream related routes
app.get('/screams', getScreams);
app.post('/scream', authMiddleware, createScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', authMiddleware, deleteScream)
app.get('/scream/:screamId/like', authMiddleware, likeScream)
app.get('/scream/:screamId/unlike', authMiddleware, unlikeScream)
app.post('/scream/:screamId/comment', authMiddleware, commentOnScream);


exports.api = functions.region('europe-west1').https.onRequest(app);

// create a notification on liking a comment
// @params likes/{id}
exports.createNotificationOnLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return database.doc(`/screams/${snapshot.data().screamId}`).get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
          return database.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            createdAt: new Date().toISOString(),
            screamId: doc.id
          })
        }
      })
      .catch((erro) => console.error(erro));
  })

// delete a notification on unliking a comment
// @params likes/{id}
exports.deleteNotificationOnUnLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return database.doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((erro) => console.error(erro));
  })

// create a notification on comments
// @params comments/{id}
exports.createNotificationOnComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return database.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
          return database.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            createdAt: new Date().toISOString(),
            screamId: doc.id
          })
        }
      })
      .catch((erro) => console.error(erro));
  })

// update user images across collections
// @params userHandle/username
exports.onUserImageChange = functions
  .region('europe-west1')
  .firestore.document('/users/{userid}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      let batch = database.batch();
      return database
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = database.doc(`/screams/${doc.id}`);
            batch.update(scream, {
              userImage: change.after.data().imageUrl
            });
          })
          return batch.commit();
        })
        .catch((erro) => console.error(erro));
    } else {
      return true;
    }
  })

// delete user comments, notifications, likes 
// across collections based on a deletion of a scream
// @params screamId
exports.onScreamDelete = functions
  .region('europe-west1')
  .firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = database.batch();
    return database
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(database.doc(`/comments/${doc.id}`));
        });
        return database
          .collection('likes')
          .where('screamId', '==', screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(database.doc(`/likes/${doc.id}`));
        });
        return database
          .collection('notifications')
          .where('screamId', '==', screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(database.doc(`/notifications/${doc.id}`));
        });
        return batch.commit()
      })
      .catch((erro) => console.error(erro));
  })