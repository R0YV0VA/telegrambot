const { ClickHouse } = require('clickhouse');

module.exports = new ClickHouse({
    url: 'localhost',
    port: '8123',
    debug: false,
    basicAuth: {
        username: "default",
        password: "${cret"
    },
    isUseGzip: false,
    config: {
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
        database: 'telegramBotTest'
    }
});
