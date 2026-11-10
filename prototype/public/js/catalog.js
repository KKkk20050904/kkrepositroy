/**
 * 商品与分类数据。
 * 同时供浏览器（window.PDD_CATALOG）和 Node 服务端（require）使用，
 * 这样页面静态托管时也能用同一份数据做降级渲染。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PDD_CATALOG = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const categories = [
    {
      id: 'fruit',
      name: '蔬菜水果',
      icon: '🍎',
      color: '#fff0eb',
      blurb: '产地直发，新鲜到家',
      children: ['时令水果', '新鲜蔬菜', '肉禽蛋品', '海鲜水产', '粮油调味', '乳品烘焙']
    },
    {
      id: 'digital',
      name: '手机数码',
      icon: '🎧',
      color: '#edf3ff',
      blurb: '大牌数码，正品低价',
      children: ['手机通讯', '智能穿戴', '耳机音响', '电脑办公', '摄影摄像', '数码配件']
    },
    {
      id: 'fashion',
      name: '女装男装',
      icon: '👕',
      color: '#fff0f5',
      blurb: '当季新款，一件也包邮',
      children: ['连衣裙', 'T恤衬衫', '牛仔裤', '外套', '卫衣', '内衣袜品']
    },
    {
      id: 'beauty',
      name: '美妆个护',
      icon: '💄',
      color: '#fff2e9',
      blurb: '精致好物，天天有惊喜',
      children: ['面部护肤', '彩妆香水', '洗发护发', '身体护理', '口腔护理', '美妆工具']
    },
    {
      id: 'baby',
      name: '母婴童装',
      icon: '🧸',
      color: '#fff8e3',
      blurb: '妈妈安心选，宝宝放心用',
      children: ['纸尿裤', '奶粉辅食', '童装童鞋', '玩具早教', '婴儿洗护', '孕产用品']
    },
    {
      id: 'food',
      name: '食品饮料',
      icon: '🥨',
      color: '#fff4e4',
      blurb: '好吃不贵，囤货必备',
      children: ['休闲零食', '坚果炒货', '饮料冲调', '方便速食', '糖果巧克力', '茶叶']
    },
    {
      id: 'home',
      name: '家居家装',
      icon: '🛋️',
      color: '#eef7f0',
      blurb: '把日子过成喜欢的样子',
      children: ['床品布艺', '收纳整理', '厨房用品', '清洁用品', '家装建材', '灯具']
    },
    {
      id: 'appliance',
      name: '家用电器',
      icon: '🔌',
      color: '#eef1ff',
      blurb: '品质家电，省心又省电',
      children: ['厨房电器', '生活电器', '个护电器', '大家电', '影音电器', '电器配件']
    },
    {
      id: 'bag',
      name: '鞋包配饰',
      icon: '👟',
      color: '#f8f1e8',
      blurb: '百搭单品，出门不撞款',
      children: ['女鞋', '男鞋', '箱包', '饰品', '手表', '眼镜']
    },
    {
      id: 'sports',
      name: '运动户外',
      icon: '⚽',
      color: '#eaf7f4',
      blurb: '动起来，去拥抱好天气',
      children: ['运动服饰', '健身器材', '户外装备', '骑行', '游泳', '球类']
    },
    {
      id: 'book',
      name: '图书文具',
      icon: '📚',
      color: '#f3f0ff',
      blurb: '读书写字，慢慢变厉害',
      children: ['图书', '文具', '办公用品', '绘画', '益智', '字帖']
    },
    {
      id: 'pet',
      name: '宠物生活',
      icon: '🐾',
      color: '#fff0e7',
      blurb: '主子的快乐，一次买齐',
      children: ['猫粮', '狗粮', '零食', '玩具', '清洁', '出行']
    }
  ];

  const products = [
    {
      id: 'p1',
      title: '无线蓝牙耳机 半入耳式 超长续航',
      subtitle: 'HiFi音质 · 触控操作 · 兼容安卓苹果',
      price: 39.9,
      originalPrice: 129,
      sales: '10万+',
      badge: '百亿补贴',
      tags: ['官方正品', '退货包运费'],
      image: 'images/products/headphones.svg',
      category: 'digital'
    },
    {
      id: 'p2',
      title: '厚底老爹鞋 百搭休闲运动鞋',
      subtitle: '轻便软底 · 显高不累脚 · 多色可选',
      price: 59.9,
      originalPrice: 199,
      sales: '3.2万',
      badge: '限时秒杀',
      tags: ['7天无理由', '极速退款'],
      image: 'images/products/sneakers.svg',
      category: 'fashion'
    },
    {
      id: 'p3',
      title: '100%纯棉短袖T恤 男女同款',
      subtitle: '柔软透气 · 不易起球 · 夏季必备',
      price: 19.9,
      originalPrice: 59.9,
      sales: '8.6万',
      badge: '回头客好店',
      tags: ['退货包运费', '假一赔十'],
      image: 'images/products/tshirt.svg',
      category: 'fashion'
    },
    {
      id: 'p4',
      title: '山东烟台红富士苹果 5斤装',
      subtitle: '脆甜多汁 · 现摘现发 · 坏果包赔',
      price: 24.8,
      originalPrice: 39.9,
      sales: '12万+',
      badge: '产地直发',
      tags: ['坏果包赔', '顺丰包邮'],
      image: 'images/products/apple.svg',
      category: 'fruit'
    },
    {
      id: 'p5',
      title: '原木抽纸 24包整箱 家庭装',
      subtitle: '4层加厚 · 柔韧不掉屑 · 母婴可用',
      price: 29.9,
      originalPrice: 59.9,
      sales: '20万+',
      badge: '居家必备',
      tags: ['24包整箱', '49小时发货'],
      image: 'images/products/tissue.svg',
      category: 'home'
    },
    {
      id: 'p6',
      title: '316不锈钢保温杯 500ml',
      subtitle: '24小时保温 · 便携防漏 · 送礼佳选',
      price: 35.9,
      originalPrice: 89,
      sales: '2.8万',
      badge: '买一送一',
      tags: ['食品级材质', '运费险'],
      image: 'images/products/bottle.svg',
      category: 'home'
    },
    {
      id: 'p7',
      title: '复古小方包 单肩斜挎两用',
      subtitle: '软皮质感 · 大容量 · 通勤百搭',
      price: 45.9,
      originalPrice: 159,
      sales: '1.6万',
      badge: '新品首发',
      tags: ['7天无理由', '赠送运险'],
      image: 'images/products/bag.svg',
      category: 'bag'
    },
    {
      id: 'p8',
      title: '每日坚果混合果仁 30包',
      subtitle: '独立小包装 · 6种果仁 · 新鲜锁鲜',
      price: 39.9,
      originalPrice: 99,
      sales: '6.4万',
      badge: '百亿补贴',
      tags: ['日期新鲜', '坏果包赔'],
      image: 'images/products/nuts.svg',
      category: 'food'
    },
    {
      id: 'p9',
      title: '家用空气炸锅 5L大容量',
      subtitle: '无油低脂 · 可视窗口 · 一键定时',
      price: 129,
      originalPrice: 299,
      sales: '9000+',
      badge: '家电节',
      tags: ['全国联保', '送货入户'],
      image: 'images/products/airfryer.svg',
      category: 'appliance'
    },
    {
      id: 'p10',
      title: '薰衣草洗衣液 4斤装 持久留香',
      subtitle: '深层洁净 · 低泡易漂 · 机洗手洗通用',
      price: 16.9,
      originalPrice: 39.9,
      sales: '15万+',
      badge: '囤货装',
      tags: ['4斤大容量', '闪电发货'],
      image: 'images/products/detergent.svg',
      category: 'home'
    },
    {
      id: 'p11',
      title: '儿童益智大颗粒积木 120粒',
      subtitle: '安全无毛刺 · 启蒙拼搭 · 收纳盒装',
      price: 29.9,
      originalPrice: 79,
      sales: '1.1万',
      badge: '宝妈严选',
      tags: ['3C认证', '益智启蒙'],
      image: 'images/products/blocks.svg',
      category: 'baby'
    },
    {
      id: 'p12',
      title: '猫咪冻干双拼粮 1.5kg',
      subtitle: '高蛋白 · 无谷低敏 · 全阶段通用',
      price: 49.9,
      originalPrice: 129,
      sales: '7000+',
      badge: '养宠必备',
      tags: ['日期新鲜', '不吃包退'],
      image: 'images/products/catfood.svg',
      category: 'pet'
    }
  ];

  return {
    categories,
    products,
    hotSearches: ['蓝牙耳机', '老爹鞋', '抽纸整箱', '红富士苹果', '保温杯', '空气炸锅']
  };
});
