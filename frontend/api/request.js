/**
 * 网络请求与图片上传统一封装（模块2）
 *
 * 使用方式：HBuilderX 创建 uniapp 项目后，把本文件放入项目的 /api 目录。
 * 注意：真机调试时，把 BASE_URL 改成电脑的局域网 IP，例如 http://192.168.1.100:3000/api
 */
const BASE_URL = 'http://localhost:3000/api';

function getToken() {
  return uni.getStorageSync('token') || '';
}

/**
 * 组装请求头（自动附带登录 token）
 * @param {String} contentType 需要指定 Content-Type 时传入，例如 'application/json'
 */
function buildHeader(contentType) {
  const header = {};
  if (contentType) header['Content-Type'] = contentType;
  const token = getToken();
  if (token) header['Authorization'] = 'Bearer ' + token;
  return header;
}

/**
 * 通用请求封装
 * @param {Object} options { url, method, data }
 * @returns {Promise} 成功时 resolve 后端返回的 data 字段
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: buildHeader('application/json'),
      success: (res) => {
        // 后端统一返回 { code: 0, message, data }
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          const msg = (res.data && res.data.message) || '请求失败';
          uni.showToast({ title: msg, icon: 'none' });
          reject(res.data || { message: msg });
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请检查后端服务', icon: 'none' });
        reject(err);
      }
    });
  });
}

/**
 * 上传单张图片
 * @param {String} filePath 本地图片路径（uni.chooseImage 返回的 tempFilePaths 中的一项）
 * @returns {Promise<String>} 图片相对地址，如 /uploads/xxx.jpg
 */
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/upload',
      filePath: filePath,
      name: 'files',
      header: buildHeader(),
      success: (res) => {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          uni.showToast({ title: '图片上传响应解析失败', icon: 'none' });
          return reject(e);
        }
        if (data.code === 0 && data.data && data.data.urls && data.data.urls.length) {
          resolve(data.data.urls[0]);
        } else {
          uni.showToast({ title: data.message || '图片上传失败', icon: 'none' });
          reject(data);
        }
      },
      fail: (err) => {
        uni.showToast({ title: '图片上传失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

export { BASE_URL };
