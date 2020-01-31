const firebase = require('firebase');
const config = require('../shared/config');
firebase.initializeApp(config);

const { database, admin } = require('../shared/admin');
const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require('../shared/validators');

// base url
const baseUrl = 'https://firebasestorage.googleapis.com/v0/b';

exports.createUser = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    handle: request.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return response.status(400).json(errors);

  const default_image = "default.png";
  let token, userId;

  database.doc(`/users/${newUser.handle}`).get()
    .then((document) => {
      if (document.exists) {
        return response.status(400).json({
          handle: 'This user already exists'
        })
      } else {
        return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const user = newUser;
      const userCredentials = {
        handle: user.handle,
        email: user.email,
        createdAt: new Date().toISOString(),
        userId: userId,
        imageUrl: `${baseUrl}/${config.storageBucket}/o/${default_image}?alt=media`
      }
      return database.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({
        token: token
      })
    })
    .catch((erro) => {
      console.error(erro);
      if (erro.code == 'auth/email-already-in-use') {
        return response.status(400).json({
          message: 'Email address already in use'
        });
      } else {
        return response.status(500).json({
          message: 'Something went wrong try again'
        });
      }
    });
}

// authenticate User
// @params email address/ password
exports.authenticateUser = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password
  }
  const { valid, errors } = validateLoginData(user);
  if (!valid) return response.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return response.status(201).json({
        token: token
      });
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(404).json({
        error: 'Wrong credentials, please try again'
      });
    })
}

// get authenticated User details
exports.authenticatedUserDetails = (request, response) => {
  let userDetails = {}
  database.doc(`/users/${request.user.handle}`).get()
    .then((document) => {
      if (document.exists) {
        userDetails.credentials = document.data();
        return database.collection('likes').where('userHandle', '==', request.user.handle).get();
      }
    })
    .then((documents) => {
      userDetails.likes = [];
      documents.forEach((document) => {
        userDetails.likes.push(document.data());
      })
      return database
        .collection('notifications')
        .where('recipient', '==', request.user.handle)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    })
    .then((data) => {
      userDetails.notifications = [];
      data.forEach((doc) => {
        userDetails.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          screamId: doc.data().screamId,
          type: doc.data().type,
          read: doc.data().read,
          createdAt: doc.data().createdAt,
          notificationId: doc.id
        });
      })
      return response.json(userDetails);
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}

// add user details
// @params userhandle/username
exports.addUserDetails = (request, response) => {
  let userDetails = reduceUserDetails(request.body);
  database.doc(`/users/${request.user.handle}`).update(userDetails)
    .then(() => {
      return response.status(200).json({
        message: 'User data added successfully'
      });
    })
    .catch((erro) => {
      console.error(error)
      return response.status(500).json({
        error: erro.code
      });
    })
}

// get any user details
// @params userhandle/username
exports.getUserDetails = (request, response) => {
  let userData = {};
  database.doc(`/users/${request.params.handle}`).get()
    .then(document => {
      if (document.exists) {
        userData.user = document.data();
        return database
          .collection('screams')
          .where('userHandle', '==', request.params.handle)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        return response.status(404).json({
          error: 'User does not exists'
        })
      }
    })
    .then((data) => {
      userData.screams = [];
      data.forEach((doc) => {
        userData.screams.push({
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          screamId: doc.id,
        });
      });
      return response.json(userData);
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}

// upload user profile image
// @params userhandle/username
exports.profileImageUpload = (request, response) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({
    headers: request.headers
  });

  let imageFilename;
  let uploadedImage = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

    console.log(fieldname, file, filename, encoding, mimetype);
    // check file type before uploading
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return response.status(500).json({
        error: 'Wrong file submitted'
      });
    }
    // extract file extension
    const fileExtension = filename.split('.')[filename.split('.').length - 1];
    imageFilename = `${Math.floor(Math.random() * 1000000000000)}.${fileExtension}`;
    const filePath = path.join(os.tmpdir(), imageFilename);
    uploadedImage = {
      filePath,
      mimetype
    };
    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on('finish', () => {
    admin.storage().bucket().upload(uploadedImage.filePath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: uploadedImage.mimetype
        }
      }
    })
      .then(() => {
        const imgUrl = `${baseUrl}/${config.storageBucket}/o/${imageFilename}?alt=media`;
        return database.doc(`/users/${request.user.handle}`).update({
          imageUrl: imgUrl
        });
      })
      .then(() => {
        return response.status(201).json({
          message: 'Image uploaded successfully'
        });
      })
      .catch((erro) => {
        console.error(erro);
        return response.status(500).json({
          error: erro.code
        });
      })
  });
  busboy.end(request.rawBody);
}

// mark notifications read
// @params userhandle/username
exports.markNotificationsRead = (request, response) => {
  let batch = database.batch();
  request.body.forEach((notificationId) => {
    const notification = database.doc(`/notifications/${notificationId}`);
    batch.update(notification, {
      read: true
    });
  })
  batch.commit()
    .then(() => {
      return response.status(201).json({
        message: 'Notification marked Read'
      })
    })
    .catch((erro) => {
      console.error(erro);
      return response.status(500).json({
        error: erro.code
      });
    })
}