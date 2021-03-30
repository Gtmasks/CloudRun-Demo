const axios = require('axios');
const url = process.env.DING_URL || '';
class DingTalk {
  async robotSay(title, text) {
    if ('staging' === process.env.PROFILE) {
      return;
    }
    return axios.post(url, {
      msgtype: 'markdown',
      markdown: {
        title,
        text: `### breeze[${process.env.PROFILE}]
        ${text}
        `
      },
      at: {
        isAtAll: true
      }
    }, {
      headers: {
      }
    }).then((res) => {
    }).catch(err => {
      logger.error(err, 'send Ding Robot message error');
    });
  }
}

module.exports = new DingTalk();