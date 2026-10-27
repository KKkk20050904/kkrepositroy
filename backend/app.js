// 原有
app.use('/api/goods', require('./routes/goods'))
// 新增下面一行
app.use('/api/collect', require('./routes/collect'))