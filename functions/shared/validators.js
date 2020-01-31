const isEmail = (email) => {
  const regExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regExpression)) return true;
  else return false;
}

const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
}

exports.validateSignupData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Email must not be Empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address";
  }
  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.validateLoginData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = 'Email Must not be empty';
  } else if (!isEmail(data.email)) {
    errors.email = 'Must be a valid email address';
  }
  if (isEmpty(data.password)) errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.reduceUserDetails = (data) => {
  let details = {};
  if (!isEmpty(data.firstName.trim())) details.firstName = data.firstName;
  if (!isEmpty(data.lastName.trim())) details.lastName = data.lastName;
  if (!isEmpty(data.gender.trim())) details.gender = data.gender;
  if (!isEmpty(data.position.trim())) details.position = data.position;
  if (!isEmpty(data.category.trim())) details.category = data.category;
  if (!isEmpty(data.council.trim())) details.council = data.council;
  if (!isEmpty(data.region.trim())) details.region = data.region;
  if (!isEmpty(data.bio.trim())) details.bio = data.bio;

  details.fullName = data.firstName + ' ' + data.lastName;

  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      details.website = `http://${data.website.trim()}`
    } else details.website = data.website;
  }
  return details;
}