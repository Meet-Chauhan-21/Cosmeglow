import os
from PIL import Image, ImageDraw

def create_rounded_favicon(input_path, output_dir):
    # Open original logo
    img = Image.open(input_path).convert("RGBA")
    
    sizes = [
        (512, 512, "android-chrome-512x512.png"),
        (192, 192, "android-chrome-192x192.png"),
        (180, 180, "apple-touch-icon.png"),
        (32, 32, "favicon-32x32.png"),
        (16, 16, "favicon-16x16.png"),
    ]
    
    # Base size for high quality rendering
    base_size = 512
    
    # Create circular / rounded rectangle icon
    canvas = Image.new("RGBA", (base_size, base_size), (0, 0, 0, 0))
    
    # Draw rounded background (White circle with subtle primary border or clean circular icon)
    # Circular mask for rounded style like big platforms
    mask = Image.new("L", (base_size, base_size), 0)
    draw_mask = ImageDraw.Draw(mask)
    # Circle radius with slight inset
    draw_mask.ellipse((10, 10, base_size - 10, base_size - 10), fill=255)
    
    # Background fill: pure white or soft brand circle so the logo pops out clearly on dark/light browser tabs
    bg = Image.new("RGBA", (base_size, base_size), (255, 255, 255, 255))
    
    # Draw soft primary accent circle ring
    draw_bg = ImageDraw.Draw(bg)
    draw_bg.ellipse((8, 8, base_size - 8, base_size - 8), fill=(255, 255, 255, 255), outline=(88, 28, 135, 200), width=16)
    
    # Resize original logo to fit nicely in center (e.g. 75% of canvas size)
    target_logo_w = int(base_size * 0.72)
    aspect_ratio = img.height / img.width
    target_logo_h = int(target_logo_w * aspect_ratio)
    
    if target_logo_h > int(base_size * 0.72):
        target_logo_h = int(base_size * 0.72)
        target_logo_w = int(target_logo_h / aspect_ratio)
        
    logo_resized = img.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)
    
    # Paste logo in center of background
    offset_x = (base_size - target_logo_w) // 2
    offset_y = (base_size - target_logo_h) // 2
    bg.paste(logo_resized, (offset_x, offset_y), logo_resized)
    
    # Apply circular mask
    rounded_icon = Image.new("RGBA", (base_size, base_size), (0, 0, 0, 0))
    rounded_icon.paste(bg, (0, 0), mask)
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save base 512 logo
    rounded_icon.save(os.path.join(output_dir, "logo.png"), "PNG")
    rounded_icon.save(os.path.join("src", "images", "logo-rounded.png"), "PNG")
    
    for w, h, filename in sizes:
        res = rounded_icon.resize((w, h), Image.Resampling.LANCZOS)
        res.save(os.path.join(output_dir, filename), "PNG")
        
    # Also save favicon.ico containing 16, 32, 48 sizes
    ico_img = rounded_icon.resize((64, 64), Image.Resampling.LANCZOS)
    ico_img.save(
        os.path.join(output_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("Favicons updated successfully!")

if __name__ == "__main__":
    create_rounded_favicon("src/images/logo.png", "public")
