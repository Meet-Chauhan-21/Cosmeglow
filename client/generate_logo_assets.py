import os
import base64
import numpy as np
from PIL import Image, ImageDraw

def generate_assets():
    src_path = os.path.join('client', 'src', 'images', 'New_Logo.jpeg')
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source file {src_path} does not exist")

    img = Image.open(src_path).convert('RGB')
    arr = np.array(img, dtype=np.float32)

    # 1. High precision alpha extraction for smooth anti-aliased transparency
    brightness = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    alpha_bright = np.clip((252 - brightness) / (252 - 215) * 255.0, 0, 255)
    color_diff = 255 - np.min(arr, axis=2)
    alpha_color = np.clip((color_diff - 4) / 25 * 255.0, 0, 255)
    alpha = np.maximum(alpha_bright, alpha_color).astype(np.uint8)

    rgba = np.dstack((arr.astype(np.uint8), alpha))
    full_trans = Image.fromarray(rgba, 'RGBA')

    # Crop full logo to content bounding box + comfortable padding
    # Bounding box of content: x=(162, 1365), y=(81, 999)
    bbox = (150, 70, 1377, 1010)
    full_cropped = full_trans.crop(bbox)

    # Save full transparent logo in src/images/logo.png and public/logo.png
    full_cropped.save(os.path.join('client', 'src', 'images', 'logo.png'), 'PNG', optimize=True)
    full_cropped.save(os.path.join('client', 'public', 'logo.png'), 'PNG', optimize=True)
    print('Saved full transparent logo.png in src/images/ and public/')

    # 2. Crop CG emblem alone for rounded brand badge & favicons
    # Emblem bounding box: x=(324, 1221), y=(81, 767)
    emblem_bbox = (310, 70, 1235, 775)
    emblem_cropped = full_trans.crop(emblem_bbox)

    # Create 512x512 rounded brand badge
    base_size = 512
    canvas = Image.new('RGBA', (base_size, base_size), (0, 0, 0, 0))
    mask = Image.new('L', (base_size, base_size), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse((6, 6, base_size - 6, base_size - 6), fill=255)

    bg = Image.new('RGBA', (base_size, base_size), (255, 255, 255, 255))
    draw_bg = ImageDraw.Draw(bg)
    # Elegant Rose Gold metallic accent ring (RGB: 197, 131, 113)
    draw_bg.ellipse((6, 6, base_size - 6, base_size - 6), fill=(255, 255, 255, 255), outline=(197, 131, 113, 230), width=16)

    # Fit emblem gracefully inside circle
    emb_w, emb_h = emblem_cropped.size
    ratio = emb_h / emb_w
    target_w = int(base_size * 0.72)
    target_h = int(target_w * ratio)
    emb_resized = emblem_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    off_x = (base_size - target_w) // 2
    off_y = (base_size - target_h) // 2
    bg.paste(emb_resized, (off_x, off_y), emb_resized)
    canvas.paste(bg, (0, 0), mask)

    # Save logo-rounded.png
    canvas.save(os.path.join('client', 'src', 'images', 'logo-rounded.png'), 'PNG', optimize=True)
    print('Saved logo-rounded.png')

    # 3. Favicons and Chrome icons in public/
    sizes = [
        (512, 512, 'android-chrome-512x512.png'),
        (192, 192, 'android-chrome-192x192.png'),
        (180, 180, 'apple-touch-icon.png'),
        (32, 32, 'favicon-32x32.png'),
        (16, 16, 'favicon-16x16.png'),
    ]

    for w, h, name in sizes:
        res = canvas.resize((w, h), Image.Resampling.LANCZOS)
        res.save(os.path.join('client', 'public', name), 'PNG', optimize=True)

    # ICO file containing multi-size mipmaps
    ico = canvas.resize((64, 64), Image.Resampling.LANCZOS)
    ico.save(
        os.path.join('client', 'public', 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print('Saved all public favicons and icons')

    # 4. Generate SVG favicon
    with open(os.path.join('client', 'public', 'android-chrome-512x512.png'), 'rb') as f:
        b64_512 = base64.b64encode(f.read()).decode('utf-8')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64_512}" x="0" y="0" width="512" height="512"/>
</svg>'''
    with open(os.path.join('client', 'public', 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print('Saved public/favicon.svg')

    # 5. Create og-image.png (1200 x 630) for social cards and previews
    og_w, og_h = 1200, 630
    og = Image.new('RGBA', (og_w, og_h), (19, 15, 26, 255)) # Luxurious dark background #130F1A

    # Subtle radial glow behind logo in rose gold
    glow = Image.new('RGBA', (og_w, og_h), (0, 0, 0, 0))
    draw_glow = ImageDraw.Draw(glow)
    center_x, center_y = og_w // 2, og_h // 2 - 10
    for r in range(320, 0, -10):
        alpha_glow = int(22 * (1 - r / 320))
        draw_glow.ellipse((center_x - r, center_y - int(r*0.65), center_x + r, center_y + int(r*0.65)), fill=(197, 131, 113, alpha_glow))

    og = Image.alpha_composite(og, glow)

    # Center full logo
    og_logo_h = 380
    og_logo_w = int(full_cropped.size[0] * (og_logo_h / full_cropped.size[1]))
    og_logo = full_cropped.resize((og_logo_w, og_logo_h), Image.Resampling.LANCZOS)
    logo_x = (og_w - og_logo_w) // 2
    logo_y = (og_h - og_logo_h) // 2
    og.paste(og_logo, (logo_x, logo_y), og_logo)

    og.convert('RGB').save(os.path.join('client', 'public', 'og-image.png'), 'PNG', quality=95)
    print('Saved public/og-image.png')

    # Clean up any leftover test files
    for test_file in [
        'test_transparent.png', 'test_dark_preview.png', 'test_full_cropped.png',
        'test_emblem_cropped.png', 'test_circle_emblem.png', 'test_circle_full.png',
        'current_cloudinary_logo.png'
    ]:
        p = os.path.join('client', 'src', 'images', test_file)
        if os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass

    print('All logo assets generated cleanly and successfully!')

if __name__ == '__main__':
    generate_assets()
