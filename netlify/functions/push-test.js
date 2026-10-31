// Netlify returns 403 for direct URL calls to a scheduled function in production, so the
// "Send a test notification" button calls this unscheduled twin. Same code path, test slot only.
const cron = require("./push-cron");

exports.handler = (event) => {
  const qp = (event && event.queryStringParameters) || {};
  return cron.handler({ queryStringParameters: Object.assign({}, qp, { test: "1" }) });
};
