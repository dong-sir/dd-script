'use strict';

const axios = require('axios');

// 配置参数
const config = {
    baseUrl: 'https://api.juejin.cn',
    apiUrl: {
        getTodayStatus: '/growth_api/v1/get_today_status',
        checkIn: '/growth_api/v1/check_in',
        getLotteryConfig: '/growth_api/v1/lottery_config/get',
        drawLottery: '/growth_api/v1/lottery/draw'
    },
    cookie: '',
    openapi: {
        baseURL: 'https://api.weixin.qq.com/cgi-bin',
        appid: '',
        appsecret: '',
        openId: '',
        templateId: '',
    }
}

// 签到
const checkIn = async () => {
    let {error, isCheck} = await getTodayCheckStatus();
    if (error) return console.log('查询签到失败');
    if (isCheck) return console.log('今日已参与签到');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.checkIn, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) {
        console.log(data);
        await subscribeMessage({award: '无', remark: '签到失败'});
    } else {
        await subscribeMessage({award: `当前积分：${data.data.sum_point}`, remark: '签到成功'});
    }
}

// 查询今日是否已经签到
const getTodayCheckStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios(baseUrl + apiUrl.getTodayStatus, {headers: {Cookie: cookie}});
    if (data.err_no) {
        await subscribeMessage({award: '无', remark: data.err_msg});
    }
    return {error: data.err_no !== 0, isCheck: data.data}
}

// 幸运抽奖
const luckyLottery = async () => {
    let {error, isDraw} = await getTodayDrawStatus();
    if (error) return console.log('查询抽奖次数失败');
    if (isDraw) return console.log('今日已无免费抽奖次数');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.drawLottery, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) return console.log('免费抽奖失败');
    console.log(`恭喜抽到：${data.data.lottery_name}`);
}

// 获取今天免费抽奖的次数
const getTodayDrawStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.getLotteryConfig, method: 'get', headers: {Cookie: cookie}});
    if (data.err_no) {
        return {error: true, isDraw: false}
    } else {
        return {error: false, isDraw: data.data.free_count === 0}
    }
}

/**
 * 获取小程序接口调用凭据
 * @see https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html
 */
const getWxAccessToken = async () => {
    let {data} = await axios({url: config.openapi.baseURL + '/token?grant_type=client_credential&appid=wxeddbdecdf7a1c61a&secret=b4d56bc3e76822676f82e8f337c2cdee',method: 'get'});
    return data;
}

/**
 * 订阅消息发送
 * @see https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/subscribe-message/subscribeMessage.send.html
 * @returns
 */
const subscribeMessage = async (event) => {
    // 获取小程序接口调用凭据
    let {access_token} = await getWxAccessToken();
    let {data} = await axios({
        url: config.openapi.baseURL + '/message/subscribe/send?access_token=' + access_token,
        method: 'POST',
        data: {
            touser: config.openapi.openId,
            template_id: config.openapi.templateId,
            miniprogram_state: "developer",
            data: {
                thing1:{
                  value: '掘金签到'
                },
                thing2:{
                  value: event.award
                },
                thing10:{
                  value: event.remark
                }
            }
        }
    });
    console.log(data)
}
exports.main_handler = async (event, context) => {
    console.log('start');
    await checkIn();
    await luckyLottery();
    console.log('end');
};
