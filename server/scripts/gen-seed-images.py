# -*- coding: utf-8 -*-
"""生成 21 张商品示例图（7 分类 × 3 件），输出到 server/uploads/seed/"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = r"C:\Users\31505\OneDrive\文档\deepseek-harness\default-workspace\campus-secondhand-trade\server\uploads\seed"
os.makedirs(BASE, exist_ok=True)

CATEGORY_COLORS = {
    "教材书籍": (79, 116, 245),
    "数码电子": (124, 92, 255),
    "生活用品": (34, 181, 115),
    "服饰鞋包": (255, 159, 67),
    "运动户外": (231, 76, 60),
    "美妆个护": (233, 30, 140),
    "其他": (96, 125, 139),
}

ITEMS = [
    ("教材书籍", "高等数学教材（同济版）", 15, 59, "九成新，笔记很少，适合大一"),
    ("教材书籍", "大学英语四级词汇书", 12, 45, "重点词汇已划，几乎全新"),
    ("教材书籍", "线性代数课本", 10, 39, "课后题未写，保存完好"),
    ("数码电子", "蓝牙无线耳机", 89, 299, "续航不错，配件齐全"),
    ("数码电子", "机械键盘 87键", 129, 399, "青轴手感好，送键帽"),
    ("数码电子", "移动电源 20000mAh", 45, 129, "双口快充，容量足"),
    ("生活用品", "宿舍小台灯", 19, 59, "三档调光，护眼不刺眼"),
    ("生活用品", "保温杯 500ml", 25, 79, "保温 12 小时，内胆干净"),
    ("生活用品", "大号收纳箱", 15, 49, "放床底刚好，盖子完整"),
    ("服饰鞋包", "帆布双肩包", 35, 99, "容量大，可放 16 寸电脑"),
    ("服饰鞋包", "运动卫衣 L码", 45, 159, "宽松版型，洗过两次"),
    ("服饰鞋包", "小白鞋 39码", 59, 199, "只穿过两次，无明显磨损"),
    ("运动户外", "羽毛球拍（双拍）", 39, 129, "轻量拍，送球一筒"),
    ("运动户外", "瑜伽垫", 25, 69, "加厚防滑，附收纳带"),
    ("运动户外", "篮球 7号", 49, 149, "室内外两用，弹性好"),
    ("美妆个护", "护肤品小样套装", 29, 99, "未拆封，日期新鲜"),
    ("美妆个护", "带灯化妆镜", 35, 89, "三色调光，桌面摆放"),
    ("美妆个护", "洗发水 400ml", 19, 59, "全新未开封"),
    ("其他", "多肉盆栽", 9, 25, "小盆栽，好养活"),
    ("其他", "手写笔记本", 6, 18, "空白页，硬壳封面"),
    ("其他", "卡通抱枕", 15, 45, "柔软不塌陷，干净无污渍"),
]

FONT_BD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_RG = r"C:\Windows\Fonts\msyh.ttc"


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def wrap_text(draw, text, fnt, max_width):
    lines, cur = [], ""
    for ch in text:
        trial = cur + ch
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


for idx, (cat, name, price, orig, desc) in enumerate(ITEMS, 1):
    color = CATEGORY_COLORS[cat]
    w = h = 600
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 垂直渐变背景（浅色）
    for y in range(h):
        t = y / h
        draw.line([(0, y), (w, y)], fill=lerp(lerp(color, (255, 255, 255), 0.75), (255, 255, 255), t))

    # 顶部装饰圆
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([-120, -140, 260, 200], fill=color + (36,))
    od.ellipse([w - 200, h - 260, w + 120, h + 40], fill=color + (28,))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 分类标签
    chip_font = font(FONT_RG, 30)
    tw = draw.textlength(cat, font=chip_font)
    draw.rounded_rectangle([40, 40, 40 + tw + 44, 40 + 56], radius=28, fill=color)
    draw.text((62, 52), cat, font=chip_font, fill=(255, 255, 255))

    # 中央商品名（自动换行 + 自适应字号）
    fnt = font(FONT_BD, 64)
    lines = wrap_text(draw, name, fnt, 480)
    if len(lines) > 2:
        fnt = font(FONT_BD, 52)
        lines = wrap_text(draw, name, fnt, 500)
    line_h = fnt.getbbox("字")[3] - fnt.getbbox("字")[1] + 18
    total_h = line_h * len(lines)
    start_y = (h - total_h) // 2 - 30
    for i, line in enumerate(lines):
        lw = draw.textlength(line, font=fnt)
        draw.text(((w - lw) / 2, start_y + i * line_h), line, font=fnt, fill=(31, 45, 82))

    # 价格
    price_font = font(FONT_BD, 56)
    price_text = f"¥{price}"
    pw = draw.textlength(price_text, font=price_font)
    draw.text(((w - pw) / 2, start_y + total_h + 40), price_text, font=price_font, fill=(255, 77, 46))

    # 底部水印
    mark = font(FONT_RG, 26)
    mt = "校园闲置交易 · 示例商品"
    mw = draw.textlength(mt, font=mark)
    draw.text(((w - mw) / 2, h - 60), mt, font=mark, fill=(150, 160, 190))

    out = os.path.join(BASE, f"demo-{idx:02d}.png")
    img.save(out, "PNG", optimize=True)

print(f"生成完成：{len(ITEMS)} 张 -> {BASE}")
