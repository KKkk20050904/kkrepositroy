// 后端入口文件（最小可运行版）
// 目前只挂载了王五的商品列表模块，方便单独测试
// 小组整合时，在下方"其他组员路由"位置添加各自的路由即可

const express = require('express')
const goodsRouter = require('./router/goods')

const app = express()
const PORT = 3000

// 解析 JSON 请求体
app.use(express.json())

// 王五负责：商品列表模块
app.use('/api/goods', goodsRouter)

// ---- 其他组员路由在此添加，例如： ----
// app.use('/api/auth', require('./router/auth'))          // 张三
// app.use('/api/category', require('./router/category'))  // 孙八
// app.use('/api/msg', require('./router/msg'))            // 钱七

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`)
})
