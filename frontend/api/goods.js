/**
 * 商品相关接口封装（模块2：闲置商品发布、图片上传）
 * 放入 uniapp 项目的 /api 目录
 */
import { request } from './request.js';

/**
 * 发布闲置商品
 * @param {Object} data
 *   title:         string  商品标题（必填）
 *   description:   string  商品描述（选填）
 *   price:         number  转让价格（必填）
 *   originalPrice: number  原价（选填）
 *   categoryId:    number  分类ID
 *   images:        string[] 图片地址数组（由 uploadImage 上传后得到）
 */
export function publishGoods(data) {
  return request({
    url: '/goods',
    method: 'POST',
    data
  });
}

/**
 * 获取商品分类（接口由"首页分类"模块孙八提供，发布页复用）
 * 接口未就绪时，发布页会自动使用本地兜底分类
 */
export function getCategories() {
  return request({
    url: '/category',
    method: 'GET'
  });
}
