from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
EVENTS = [
    ('HYPE FEST', 'hype-fest', 'HYPE FEST 2025', 'music', 'Đại nhạc hội'),
    ('MEKONG', 'mekong-flow', 'Mekong Flow Festival', 'music', 'Lễ hội âm nhạc'),
    ('SKILLLINK ĐỒNG HÀNH CÙNG TRIỂN LÃM NGŨ HÀNH', 'ngu-hanh', 'Triển lãm Ngũ Hành Music Festival', 'music', 'Triển lãm · Âm nhạc'),
    ('sự kiện', 'rung-chuong-vang', 'Rung Chuông Vàng – Tiểu học Bình Thuỷ 2', 'community', 'Giáo dục · Cộng đồng'),
    ('SỰ KIỆN', 'trai-bong-hoa-nhap', 'Trái bóng hòa nhập', 'community', 'Thể thao · Cộng đồng'),
    ('T&T', 'tt-marathon', 'T&T Marathon Vĩnh Long', 'community', 'Chạy bộ · Vĩnh Long'),
    ('“THẤU”', 'thau-orcax', 'THẤU – ORCAX kiến tạo trải nghiệm số', 'corporate', 'Trải nghiệm số · ĐBSCL'),
    ('KOKOMI HÚT SHOW', 'kokomi-hut-show', 'Kokomi Hút Show', 'corporate', 'Chương trình thực tế · Cần Thơ'),
    ('Lễ bàn giao xe', 'ban-giao-xe-dcar', 'Lễ bàn giao xe DCAR', 'corporate', 'Lễ bàn giao xe · DCAR'),
    ('LỄ KHAI TRƯƠNG NHÀ MÁY BESTWAY', 'bestway-vsip', 'Khai trương nhà máy BESTWAY', 'opening', 'Khai trương · VSIP Cần Thơ'),
    ('LỄ TỐT NGHIỆP TẠI FPT', 'tot-nghiep-fpt', 'Lễ tốt nghiệp FPT Polytechnic', 'community', 'Lễ tốt nghiệp · FPT Polytechnic'),
    ('Roborock Authorized', 'roborock-can-tho', 'Roborock Authorized Store Cần Thơ', 'opening', 'Cửa hàng · Cần Thơ'),
    ('SKILLLINK ĐỒNG HÀNH CÙNG LOYALIZE', 'loyalize-chatbot', 'Triển lãm trải nghiệm dịch vụ Chatbot – Loyalize', 'corporate', 'Triển lãm · Trải nghiệm dịch vụ'),
    ('THOÁT MÀNG HÌNH', 'thoat-man-hinh-on-life', 'Thoát màn hình – ON LIFE', 'community', 'Sự kiện · Cộng đồng'),
    ('THỜI BÁO SỐ', 'thoi-bao-so', 'Thời Báo Số', 'corporate', 'Sự kiện · Thời Báo Số'),
    ('Điều kì diệu số 8', 'dieu-ki-dieu-so-8', 'Điều kì diệu số 8', 'community', 'Sự kiện · Cộng đồng'),
    ('ĐỒ ÁN TỐT NGHIỆP', 'do-an-tot-nghiep', 'Đồ án tốt nghiệp', 'graduation', 'Đồ án tốt nghiệp'),
]

albums = []
for prefix, slug, title, category, label in EVENTS:
    folders = [p for p in (ROOT / 'Ảnh sự kiện').iterdir() if p.is_dir() and p.name.startswith(prefix)]
    if not folders:
        raise ValueError(f'Không tìm thấy thư mục: {prefix}')
    files = sorted(p for folder in folders for p in folder.rglob('*') if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'))
    if not files:
        print(f'Skipped empty album: {slug}')
        continue
    paths = []
    for i, source in enumerate(files, 1):
        target = ROOT / 'assets/images/events' / slug / f'{i:02}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
            with Image.open(source) as raw:
                image = ImageOps.exif_transpose(raw).convert('RGB')
                image.thumbnail((1920, 1920))
                image.save(target, 'WEBP', quality=85, method=6)
        paths.append(target.relative_to(ROOT).as_posix())
    if category == 'graduation':
        # Each immediate child folder is a separate graduation project album.
        image_paths = dict(zip(files, paths))
        for folder in folders:
            for group in sorted(p for p in folder.iterdir() if p.is_dir()):
                group_images = [image_paths[p] for p in files if p.is_relative_to(group)]
                if group_images:
                    albums.append(dict(title=group.name.replace('_', ' –'), category=category,
                                       label=label, images=group_images))
    else:
        albums.append(dict(title=title, category=category, label=label, images=paths))

(ROOT / 'assets/js/event-albums.js').write_text('window.SKILLLINK_EVENT_ALBUMS = ' + json.dumps(albums, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'{len(albums)} albums, {sum(len(a["images"]) for a in albums)} photos')
