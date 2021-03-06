import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { empty } from '@ember/object/computed';

import { task } from 'ember-concurrency';

export default class EmailInput extends Component {
  tagName = '';

  type = '';
  value = '';
  isEditing = false;
  user = null;

  @empty('user.email') disableSave;

  notValidEmail = false;
  prevEmail = '';

  @computed('user.email')
  get emailIsNull() {
    let email = this.get('user.email');
    return email == null;
  }

  @computed('user.{email,email_verified}')
  get emailNotVerified() {
    let email = this.get('user.email');
    let verified = this.get('user.email_verified');

    return email != null && !verified;
  }

  isError = false;
  emailError = '';
  disableResend = false;

  @computed('disableResend', 'user.email_verification_sent')
  get resendButtonText() {
    if (this.disableResend) {
      return 'Sent!';
    } else if (this.get('user.email_verification_sent')) {
      return 'Resend';
    } else {
      return 'Send verification email';
    }
  }

  @task(function* () {
    try {
      yield this.user.resendVerificationEmail();
      this.set('disableResend', true);
    } catch (error) {
      if (error.errors) {
        this.set('isError', true);
        this.set('emailError', `Error in resending message: ${error.errors[0].detail}`);
      } else {
        this.set('isError', true);
        this.set('emailError', 'Unknown error in resending message');
      }
    }
  })
  resendEmailTask;

  @action
  editEmail() {
    let email = this.value;
    let isEmailNull = function (email) {
      return email == null;
    };

    this.set('emailIsNull', isEmailNull(email));
    this.set('isEditing', true);
    this.set('prevEmail', this.value);
  }

  @action
  saveEmail() {
    let userEmail = this.value;
    let user = this.user;

    let emailIsProperFormat = function (userEmail) {
      let regExp = /^\S+@\S+\.\S+$/;
      return regExp.test(userEmail);
    };

    if (!emailIsProperFormat(userEmail)) {
      this.set('notValidEmail', true);
      return;
    }

    user
      .changeEmail(userEmail)
      .then(() => {
        this.set('serverError', null);
      })
      .catch(err => {
        let msg;
        if (err.errors && err.errors[0] && err.errors[0].detail) {
          msg = `An error occurred while saving this email, ${err.errors[0].detail}`;
        } else {
          msg = 'An unknown error occurred while saving this email.';
        }
        user.set('email', this.prevEmail);
        this.set('serverError', msg);
        this.set('isError', true);
        this.set('emailError', `Error in saving email: ${msg}`);
      });

    this.set('isEditing', false);
    this.set('notValidEmail', false);
    this.set('disableResend', false);
  }

  @action
  cancelEdit() {
    this.set('isEditing', false);
    this.set('value', this.prevEmail);
  }
}
