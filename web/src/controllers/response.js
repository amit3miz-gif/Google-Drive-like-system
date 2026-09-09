function sendJson(res, statusCode, body) {
    return res
        .status(statusCode)
        .type('application/json')
        .send(JSON.stringify(body, null, 1) + '\n');
}

module.exports = { sendJson };
