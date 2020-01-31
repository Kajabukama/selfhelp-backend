// for referrence only

let schema = {
  users: [{
    userId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2',
    email: 'kajabukama@gmail.com',
    handle: 'kajabukama',
    firstname: 'Yusuph',
    lastname: 'kajabukama',
    createdAt: '2019-11-30T17:35:46.579Z',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-be435.appspot.com/o/335023936039.jpg?alt=media',
    bio: 'Some bio info',
    website: 'https://example.com',
    location: 'Dar es salaam, TZ'
  }],
  screams: [{
    userHandle: "user",
    body: "This is the body of the scream",
    createdAt: "2019-09-13T11:18:04.566Z",
    likeCount: 15,
    commentCount: 21
  }],
  comments: [{
    userHandle: "user",
    screamId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2',
    body: "This is the body of the scream comment",
    createdAt: "2019-09-13T11:18:04.566Z"
  }],
  notifications: [{
    recipient: 'user',
    sender: 'kajabukama',
    read: true | false,
    screamId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2',
    type: like | comment,
    createdAt: '2019-09-13T11:18:04.566Z'
  }]
};

const userDetails = {
  credentials = {
    userId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2',
    email: 'kajabukama@gmail.com',
    handle: 'kajabukama',
    firstname: 'Yusuph',
    lastname: 'kajabukama',
    createdAt: '2019-11-30T17:35:46.579Z',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-be435.appspot.com/o/335023936039.jpg?alt=media',
    bio: 'Some bio info',
    website: 'https://example.com',
    location: 'Dar es salaam, TZ'
  },
  likes: [{
      userHandle: 'user',
      screamId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2'
    },
    {
      userHandle: 'user',
      screamId: 'YGbNMheGo7QdqpGIHXbgHb2g6Rz2'
    },
  ]
}