const {
  admin,
  database
} = require('./admin');

module.exports = (request, response, next) => {
  let idToken;
  if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
    idToken = request.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No Token found');
    return response.status(403).json({
      error: 'An Authorized Access'
    });
  }

  admin.auth().verifyIdToken(idToken)
    .then((decodedData) => {
      request.user = decodedData;
      return database.collection('users')
        .where('userId', '==', request.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      request.user.handle = data.docs[0].data().handle;
      request.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    })
    .catch((erro) => {
      console.error('Error while verifying token');
      if (erro.code == 'auth/argument-error') {
        return response.status(403).json({
          token: 'Token mismatch, log in to try again'
        });
      } else {
        return response.status(403).json(erro);
      }
    })
}