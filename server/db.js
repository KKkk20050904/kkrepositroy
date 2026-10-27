const pool = require('./config/db');

module.exports = {
  query(sql, params, callback) {
    pool.query(sql, params).then(([result]) => {
      callback(null, result);
    }).catch(callback);
  }
};
