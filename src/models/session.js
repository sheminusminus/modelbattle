class Session {
  static uid = null;

  static init = (userData) => {
    Session.uid = userData.uid;
  };
}

export default new Session();
