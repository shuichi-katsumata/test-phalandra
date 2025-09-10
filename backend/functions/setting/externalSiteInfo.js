const { db } = require('../../utils/firebaseUtils');
const getExternalSiteInfo = async (path) => {
  const snapshot = await db.ref(path).once('value');
  return snapshot.val();
}
const getLoginInfo = async (accountKey, siteName) => {
  const login_info = {};
  const loginItems_path = `users/${accountKey}/id_pass/${siteName}/login_items`;
  login_info.id = await getExternalSiteInfo(`${loginItems_path}/id`);
  login_info.pass = await getExternalSiteInfo(`${loginItems_path}/pass`);
  login_info.loginUrl = await getExternalSiteInfo(`${loginItems_path}/loginUrl`);
  return login_info;
}
module.exports = getLoginInfo;