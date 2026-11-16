# -*- coding: utf-8 -*-
"""生成 21 张"实物展示风格"商品图 v3（影棚商品摄影风格）
- 影棚浅色背景 + 分类色调 + 景深光斑
- 商品大图（emoji 彩色字形）轻微倾斜 + 落地柔影 + 玻璃倒影
- 无文字覆盖（价格/标题由 App 界面展示）
输出：server/uploads/seed/demo-01.png ~ demo-21.png（覆盖旧图）
"""
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = r"C:\Users\31505\OneDrive\文档\deepseek-harness\default-workspace\campus-secondhand-trade\server\uploads\seed"
os.makedirs(BASE, exist_ok=True)

EMOJI_FONT = r"C:\Windows\Fonts\seguiemj.ttf"
W = H = 600

STYLE = {
    "教材书籍": ((238, 244, 255), (79, 116, 245)),
    "数码电子": ((243, 240, 255), (124, 92, 255)),
    "生活用品": ((236, 250, 244), (34, 181, 115)),
    "服饰鞋包": ((255, 246, 236), (255, 140, 40)),
    "运动户外": ((255, 240, 237), (231, 76, 60)),
    "美妆个护": ((255, 240, 248), (233, 30, 140)),
    "其他": ((241, 245, 248), (96, 125, 139)),
}

ITEMS = [
    ("教材书籍", "高等数学教材（同济版）", "📚"),
    ("教材书籍", "大学英语四级词汇书", "📖"),
    ("教材书籍", "线性代数课本", "📘"),
    ("数码电子", "蓝牙无线耳机", "🎧"),
    ("数码电子", "机械键盘 87键", "⌨️"),
    ("数码电子", "移动电源 20000mAh", "🔋"),
    ("生活用品", "宿舍小台灯", "💡"),
    ("生活用品", "保温杯 500ml", "☕"),
    ("生活用品", "大号收纳箱", "📦"),
    ("服饰鞋包", "帆布双肩包", "🎒"),
    ("服饰鞋包", "运动卫衣 L码", "🧥"),
    ("服饰鞋包", "小白鞋 39码", "👟"),
    ("运动户外", "羽毛球拍（双拍）", "🏸"),
    ("运动户外", "瑜伽垫", "🧘"),
    ("运动户外", "篮球 7号", "🏀"),
    ("美妆个护", "护肤品小样套装", "🧴"),
    ("美妆个护", "带灯化妆镜", "🪞"),
    ("美妆个护", "洗发水 400ml", "🧼"),
    ("其他", "多肉盆栽", "🌵"),
    ("其他", "手写笔记本", "📓"),
    ("其他", "卡通抱枕", "🧸"),
]


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def studio_bg(base_rgb, rng):
    """影棚背景：中心亮 + 分类色晕染 + 光斑 + 暗角"""
    img = Image.new("RGB", (W, H), (255, 255, 255))
    px = img.load()
    for y in range(H):
        for x in range(0, W, 2):
            dx = (x - W / 2) / (W / 2)
            dy = (y - H / 2) / (H / 2)
            d = min(1.0, math.sqrt(dx * dx + dy * dy))
            t = d * 0.75
            color = lerp((253, 254, 255), base_rgb, t)
            px[x, y] = color
            if x + 1 < W:
                px[x + 1, y] = color

    # 景深光斑
    bokeh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh)
    for _ in range(10):
        r = rng.randint(18, 70)
        cx = rng.randint(0, W)
        cy = rng.randint(0, H)
        alpha = rng.randint(18, 46)
        bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=base_rgb + (alpha,))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(14))
    img = Image.alpha_composite(img.convert("RGBA"), bokeh)

    # 暗角
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    for i in range(60):
        vd.rectangle([i * 3, i * 3, W - i * 3, H - i * 3], outline=int(i * 2.2))
    vig = vig.filter(ImageFilter.GaussianBlur(30))
    dark = Image.new("RGBA", (W, H), (8, 12, 30, 255))
    dark.putalpha(vig.point(lambda v: int(v * 0.55)))
    img = Image.alpha_composite(img, dark)
    return img


def render_emoji(emoji, size):
    canvas = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(EMOJI_FONT, size)
    bbox = d.textbbox((0, 0), emoji, font=font, embedded_color=True)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.text(((size * 2 - tw) / 2 - bbox[0], (size * 2 - th) / 2 - bbox[1]),
           emoji, font=font, embedded_color=True)
    glyph = canvas.crop(canvas.getbbox())
    max_side = 400
    scale = max_side / max(glyph.width, glyph.height)
    glyph = glyph.resize((max(1, int(glyph.width * scale)), max(1, int(glyph.height * scale))), Image.LANCZOS)
    return glyph


def fade_reflection(glyph):
    """生成倒影：翻转 + 由深到浅的渐隐"""
    refl = glyph.transpose(Image.FLIP_TOP_BOTTOM).copy()
    alpha = refl.split()[3]
    grad = Image.linear_gradient("L").resize((refl.width, refl.height))
    grad = grad.point(lambda v: int(v * 0.30))
    alpha = Image.composite(alpha, Image.new("L", alpha.size, 0), grad)
    refl.putalpha(alpha)
    return refl


for idx, (cat, name, emoji) in enumerate(ITEMS, 1):
    base_rgb, _accent = STYLE[cat]
    rng = random.Random(idx * 7919)
    img = studio_bg(base_rgb, rng)

    glyph = render_emoji(emoji, 300)
    # 轻微倾斜，更自然
    angle = rng.uniform(-4.0, 4.0)
    glyph = glyph.rotate(angle, expand=True, resample=Image.BICUBIC)

    gx = (W - glyph.width) // 2
    gy = (H - glyph.height) // 2 - 24

    # 落地柔影
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sw = int(glyph.width * 0.72)
    sh = int(glyph.height * 0.14)
    sd.ellipse(
        [gx + (glyph.width - sw) // 2, gy + glyph.height - sh // 2,
         gx + (glyph.width + sw) // 2, gy + glyph.height + sh // 2],
        fill=(10, 20, 40, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    img = Image.alpha_composite(img, shadow)

    # 玻璃倒影
    refl = fade_reflection(glyph)
    refl_y = gy + glyph.height + 6
    if refl_y < H:
        img.alpha_composite(refl, (gx, refl_y))

    # 贴商品主体
    img.alpha_composite(glyph, (gx, gy))

    # 轻微色彩校正（提亮 + 微对比）
    img = Image.eval(img.convert("RGB"), lambda v: min(255, int(v * 1.02 + 3)))

    out = os.path.join(BASE, f"demo-{idx:02d}.png")
    img.convert("RGB").save(out, "PNG", optimize=True)

print(f"生成完成：{len(ITEMS)} 张（影棚实物风格）-> {BASE}")
