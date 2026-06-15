/**
 * 统一响应格式
 */

function success(res, data, message = '操作成功') {
  return res.json({
    ok: true,
    data,
    message
  });
}

function fail(res, message = '操作失败', statusCode = 400) {
  return res.status(statusCode).json({
    ok: false,
    message
  });
}

function error(res, message = '服务器内部错误', statusCode = 500) {
  return res.status(statusCode).json({
    ok: false,
    message
  });
}

module.exports = {
  success,
  fail,
  error
};
